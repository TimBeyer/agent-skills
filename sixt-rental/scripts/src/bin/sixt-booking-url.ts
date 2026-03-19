#!/usr/bin/env bun
// Sixt booking URL generator — creates a direct link to the Sixt offer list

import { parse, bookingUrlOptions, validateIsoDatetime, validateDateOrder, validateCountryCode, type BookingUrlValues } from "../lib/cli";
import { selectLocation } from "../lib/client";
import { getCountry } from "../lib/countries";

const { values } = parse<BookingUrlValues>(bookingUrlOptions);

if (values.help) {
  console.error(`Usage: bun sixt-booking-url.ts --pickup <datetime> --return <datetime> --station <id> [options]

Generate a direct booking URL for the Sixt offer list with station, dates,
and partner campaign pre-applied.

Required:
  --pickup        Pickup datetime (YYYY-MM-DDTHH:MM)
  --return        Return datetime (YYYY-MM-DDTHH:MM)
  --station       Station branch ID

Options:
  --country       2-letter country code (default: DE)
  --campaign      Partner campaign code
  --station-name  Human-readable station name (auto-detected if omitted)
  --table         Output just the URL string instead of JSON
  -h, --help      Show this help`);
  process.exit(0);
}

if (!values.pickup || !values.return || !values.station) {
  console.error("Error: --pickup, --return, and --station are required");
  process.exit(1);
}

validateIsoDatetime(values.pickup, "pickup");
validateIsoDatetime(values.return, "return");
validateDateOrder(values.pickup, values.return);
validateCountryCode(values.country!);

const country = getCountry(values.country!);

// Resolve station to get location_selection_id
console.error(`Resolving station ${values.station}...`);
const loc = await selectLocation(values.station, country);

if (!loc.location_selection_id) {
  console.error(`Failed to get location_selection_id for station ${values.station}`);
  process.exit(1);
}

const locSelId = loc.location_selection_id;
const title = values["station-name"] || loc.selected_location?.title || `Station ${values.station}`;

// Build offer list URL
const params = new URLSearchParams({
  zen_pu_location: locSelId,
  zen_do_location: locSelId,
  zen_pu_title: title,
  zen_do_title: title,
  zen_pu_time: values.pickup!,
  zen_do_time: values.return!,
  zen_pu_branch_id: `BRANCH:${values.station}`,
  zen_do_branch_id: `BRANCH:${values.station}`,
  zen_offer_matrix_id: crypto.randomUUID(),
  zen_vehicle_type: "car",
  zen_resident_country_required: "false",
  zen_prefer_bonus_program: "false",
  zen_is_partner_page_user: values.campaign ? "true" : "false",
  zen_point_of_sale: country.pointOfSale,
  zen_filters: JSON.stringify({
    group_type: [],
    features: [],
    passengers_count: [],
    bags_count: [],
    minimum_driver_age: [],
  }),
  zen_order_is_ascending: "false",
  zen_order_by: "",
});

if (values.campaign) {
  params.set("campaign", values.campaign);
}

const url = `https://www.${country.domain}/betafunnel/#/offerlist?${params.toString()}`;

if (values.table) {
  console.log(url);
} else {
  console.log(
    JSON.stringify(
      {
        url,
        station: title,
        stationId: values.station,
        pickup: values.pickup,
        return: values.return,
        country: country.code,
        campaign: values.campaign || null,
      },
      null,
      2,
    ),
  );
}
