#!/usr/bin/env bun
// Sixt car rental search — find offers across stations with optional protection pricing

import { parse, searchOptions, validateIsoDatetime, validateDateOrder, validateCountryCode, type SearchValues } from "../lib/cli";
import { suggestLocations, selectLocation, getOffers, getBookingForOffer, findProtection } from "../lib/client";
import { getCountry } from "../lib/countries";
import { parseFilter, applyFilters } from "../lib/filter";
import { formatTable } from "../lib/format";
import type { SixtOffer, SixtOfferWithProtection, SixtStation } from "../lib/types";

const { values } = parse<SearchValues>(searchOptions);

if (values.help) {
  console.error(`Usage: bun sixt-search.ts --pickup <datetime> --return <datetime> [options]

Search Sixt car rental availability and prices.

Required:
  --pickup      Pickup datetime (YYYY-MM-DDTHH:MM)
  --return      Return datetime (YYYY-MM-DDTHH:MM)

Options:
  --city        City name for station search (default: Berlin)
  --station     Specific station ID (skips city search)
  --country     2-letter country code (default: DE)
  --filter      Filter expression (repeatable, AND'd). Examples:
                  --filter "electric"          boolean true
                  --filter "!hybrid"           boolean false
                  --filter "passengers>=5"     numeric comparison
                  --filter "groupType=SUV"     string equality
                Fields: electric, hybrid, automatic, luxury, guaranteed, navIncluded,
                  passengers, bags, largeBags, smallBags, doors, minAge, range,
                  priceDay, priceTotal, deposit, groupType, bodyStyle, acriss, ...
  --electric    Shortcut for --filter "electric"
  --family      Shortcut for --filter "passengers>=5" "bags>=3" "automatic"
  --protection  Fetch protection pricing: basic|smart|allinclusive
  --rate        Corporate customer number
  --campaign    Partner campaign code
  --limit       Max offers to fetch protection for (default: 5, 0 = all)
  --token       JWT auth token for member pricing (from sixt-login)
  --table       Output as human-readable table instead of JSON
  -h, --help    Show this help`);
  process.exit(0);
}

if (!values.pickup || !values.return) {
  console.error("Error: --pickup and --return are required");
  console.error('Usage: bun sixt-search.ts --pickup "YYYY-MM-DDTHH:MM" --return "YYYY-MM-DDTHH:MM" [options]');
  process.exit(1);
}

validateIsoDatetime(values.pickup, "pickup");
validateIsoDatetime(values.return, "return");
validateDateOrder(values.pickup, values.return);
validateCountryCode(values.country!);

const country = getCountry(values.country!);
const limit = parseInt(values.limit!, 10);
const fetchProtection = !!values.protection && values.protection !== "none";
const token = values.token;

// --- Build filters from --filter, --electric, --family ---
const filterExprs: string[] = values.filter || [];
if (values.electric) filterExprs.push("electric");
if (values.family) filterExprs.push("passengers>=5", "bags>=3", "automatic");
const filters = filterExprs.map(parseFilter);

// --- Resolve stations ---
let stations: SixtStation[];

if (values.station) {
  stations = [{ id: values.station, name: `Station ${values.station}` }];
} else {
  const suggestions = await suggestLocations(values.city!, token);
  if (!suggestions.suggestions?.length) {
    console.error(`No stations found for "${values.city}"`);
    process.exit(1);
  }
  stations = suggestions.suggestions
    .filter(
      (s) =>
        s.location?.is_sixt_branch &&
        s.location?.branch?.vehicle_types?.some(
          (v) => v.includes("PASSENGER") || v.includes("E_CARS"),
        ),
    )
    .map((s) => ({
      id: s.location!.branch!.id!,
      name: s.location!.title || `Station ${s.location!.branch!.id}`,
    }));

  if (stations.length === 0) {
    console.error("No car rental stations found");
    process.exit(1);
  }
}

// --- Collect offers from all stations ---
const allOffers: SixtOffer[] = [];

for (const station of stations) {
  try {
    console.error(`Checking ${station.name}...`);
    const loc = await selectLocation(station.id, country, token);
    if (!loc.location_selection_id) continue;
    if (loc.selected_location?.title) station.name = loc.selected_location.title;

    const result = await getOffers(loc.location_selection_id, values.pickup!, values.return!, country, {
      corporateRate: values.rate,
      campaign: values.campaign,
      token,
    });
    if (!result.offers) continue;

    for (const offer of result.offers) {
      const car = offer.car_info;
      const selectedPlan = offer.mileage_plans?.find((p) => p.is_selected);
      const unlimitedPlan = offer.mileage_plans?.find((p) => p.is_unlimited);
      const rangeStr = car?.full_charge_distance?.distance;

      const entry: SixtOffer = {
        // Station
        station: station.name,
        stationId: station.id,

        // Vehicle identity
        title: car?.title || "Unknown",
        subline: car?.subline || "",
        acriss: (car?.acriss_codes || "").replace(/[\[\]]/g, ""),
        groupType: car?.group_type || "",
        bodyStyle: car?.body_style || "",
        guaranteed: car?.guaranteed_model || false,
        examples: car?.example_make_model || "",
        imageUrl: car?.vehicle_images?.[0]?.medium_url || "",

        // Vehicle specs
        passengers: car?.passengers_count || 0,
        bags: car?.bags_count || 0,
        largeBags: car?.large_bags_count || 0,
        smallBags: car?.small_bags_count || 0,
        doors: car?.doors_count || 0,
        automatic: car?.transmission_type?.includes("AUTOMATIC") || false,
        navIncluded: car?.navigation_included || false,

        // Powertrain
        electric: car?.is_electric || false,
        hybrid: car?.is_hybrid || false,
        luxury: car?.is_luxury || false,
        range: rangeStr ? parseInt(rangeStr, 10) : null,
        chargingCable: car?.charging_cable_details?.description || "",

        // Driver requirements
        minAge: car?.minimum_driver_age || 18,
        youngDriverFee: offer.is_young_driver_fee_applied || false,

        // Pricing
        priceDay: offer.price_per_day?.gross?.value || 0,
        priceTotal: offer.price_total?.gross?.value || 0,
        deposit: offer.deposit?.value || 0,
        mileage: offer.mileage_included_formatted || "",
        extraKmPrice: selectedPlan?.extra_mileage_amount?.gross?.value ?? null,
        unlimitedKmAvailable: !!unlimitedPlan,
        unlimitedKmPriceTotal: unlimitedPlan?.total_amount?.gross?.value ?? null,

        // Presentation
        rentalDays: offer.calculated_rental_days || 0,
        promoLabel: offer.promo_label || "",

        // Internal
        offerId: offer.offer_id,
        offerMatrixId: offer.offer_matrix_id,
      };

      allOffers.push(entry);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Error checking ${station.name}: ${msg}`);
  }
}

// --- Apply filters ---
const filtered = applyFilters(allOffers, filters);

if (filtered.length === 0) {
  if (values.table) {
    console.log("No offers found matching your criteria.");
  } else {
    console.log("[]");
  }
  process.exit(0);
}

// --- Sort by base price first ---
filtered.sort((a, b) => a.priceTotal - b.priceTotal);

// --- Fetch protection for top N offers only (fixes N+1 problem) ---
const enriched: SixtOfferWithProtection[] = filtered.map((o) => ({
  ...o,
  protectionDay: null,
  protectionTotal: null,
  protectionName: null,
  totalWithProtection: null,
  dayWithProtection: null,
}));

if (fetchProtection) {
  const toFetch = limit > 0 ? enriched.slice(0, limit) : enriched;
  console.error(`Fetching ${values.protection} protection for top ${toFetch.length} offers...`);

  for (const offer of toFetch) {
    try {
      const booking = await getBookingForOffer(offer.offerMatrixId, offer.offerId, country.currency, token);
      const prot = findProtection(booking, values.protection!);
      if (prot) {
        offer.protectionDay = prot.pricePerDay;
        offer.protectionTotal = prot.priceTotal;
        offer.protectionName = prot.name;
        offer.totalWithProtection = +(offer.priceTotal + prot.priceTotal).toFixed(2);
        offer.dayWithProtection = +(offer.priceDay + prot.pricePerDay).toFixed(2);
      }
    } catch {
      // Protection fetch failed for this offer, continue without
    }
  }

  // Re-sort by total-with-protection (offers without protection sort by base price)
  enriched.sort(
    (a, b) => (a.totalWithProtection ?? a.priceTotal) - (b.totalWithProtection ?? b.priceTotal),
  );
}

// --- Output ---
if (values.table) {
  console.log(`\nFound ${enriched.length} offers across ${stations.length} station(s)`);
  console.log(`Pickup: ${values.pickup} | Return: ${values.return} | Country: ${country.code}`);
  if (fetchProtection) console.log(`Protection: ${values.protection} (included in prices)`);
  if (filterExprs.length) console.log(`Filters: ${filterExprs.join(", ")}`);
  console.log("");
  console.log(formatTable(enriched, country.currency, fetchProtection));
} else {
  // Strip internal IDs from JSON output
  const output = enriched.map(({ offerId, offerMatrixId, ...rest }) => rest);
  console.log(JSON.stringify(output, null, 2));
}
