// Sixt gRPC-web API client using native fetch

import type { CountryConfig, SixtProtection } from "./types";
import { decodeJwtPayload } from "./auth";

const GRPC = "https://grpc-prod.orange.sixt.com";

/** Extract mnum (membership number) from JWT for use as user_profile_id */
let cachedToken: string | undefined;
let cachedMnum: string | undefined;
function getMnumFromToken(token: string): string {
  if (token !== cachedToken) {
    cachedToken = token;
    const payload = decodeJwtPayload(token);
    cachedMnum = payload.mnum != null ? String(payload.mnum) : "";
  }
  return cachedMnum!;
}

/** POST JSON to a Sixt gRPC-web endpoint */
async function grpcPost<T>(endpoint: string, body: Record<string, unknown>, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["sx-platform"] = "web-next";
    headers["x-client-type"] = "web";
    headers["x-sx-tenant"] = "6";
    headers["x-correlation-id"] = crypto.randomUUID();
  }
  const res = await fetch(`${GRPC}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API ${endpoint}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** Search for locations matching a query string */
export async function suggestLocations(query: string, token?: string) {
  return grpcPost<{
    suggestions?: Array<{
      location?: {
        title?: string;
        is_sixt_branch?: boolean;
        branch?: { id?: string; vehicle_types?: string[] };
      };
    }>;
  }>("/com.sixt.service.rent_booking.api.SearchService/SuggestLocations", {
    query,
    auto_complete_session_id: crypto.randomUUID(),
    vehicle_type: "1",
    user_profile_id: token ? getMnumFromToken(token) : "",
    location_purpose: 1,
    include_fastlane: null,
  }, token);
}

/** Resolve a branch ID to a location_selection_id */
export async function selectLocation(branchId: string, country: CountryConfig, token?: string) {
  return grpcPost<{
    location_selection_id?: string;
    selected_location?: { title?: string };
  }>("/com.sixt.service.rent_booking.api.SearchService/SelectLocation", {
    user_profile_id: token ? getMnumFromToken(token) : "",
    location_purpose: 1,
    vehicle_type: 1,
    auto_complete_session_id: crypto.randomUUID(),
    location_id: `BRANCH:${branchId}`,
    include_fastlane: null,
    sim_card_country_code: country.code,
  }, token);
}

/** Fetch offers for a location and date range */
export async function getOffers(
  locationSelectionId: string,
  pickup: string,
  ret: string,
  country: CountryConfig,
  opts: { corporateRate?: string; campaign?: string; token?: string } = {},
) {
  return grpcPost<{
    offers?: Array<{
      offer_id: string;
      offer_matrix_id: string;
      car_info?: {
        title?: string;
        subline?: string;
        is_electric?: boolean;
        is_hybrid?: boolean;
        is_luxury?: boolean;
        transmission_type?: string;
        passengers_count?: number;
        bags_count?: number;
        large_bags_count?: number;
        small_bags_count?: number;
        doors_count?: number;
        guaranteed_model?: boolean;
        example_make_model?: string;
        acriss_codes?: string;
        group_type?: string;
        body_style?: string;
        minimum_driver_age?: number;
        navigation_included?: boolean;
        full_charge_distance?: { distance?: string; distance_unit?: string };
        charging_cable_details?: { included?: boolean; label?: string; description?: string };
        vehicle_images?: Array<{ small_url?: string; medium_url?: string; large_url?: string }>;
      };
      price_per_day?: { gross?: { value?: number } };
      price_total?: { gross?: { value?: number } };
      crossedout_price_per_day?: { gross?: { value?: number } };
      crossedout_price_total?: { gross?: { value?: number } };
      deposit?: { value?: number };
      mileage_included_formatted?: string;
      calculated_rental_days?: number;
      promo_label?: string;
      is_young_driver_fee_applied?: boolean;
      mileage_plans?: Array<{
        is_selected?: boolean;
        is_unlimited?: boolean;
        total_amount?: { gross?: { value?: number } };
        extra_mileage_amount?: { gross?: { value?: number } };
      }>;
    }>;
  }>("/com.sixt.service.rent_booking.api.BookingService/GetOfferRecommendationsV2", {
    offer_matrix_id: crypto.randomUUID(),
    currency: country.currency,
    trip_spec: {
      pickup_datetime: { value: pickup },
      pickup_location_selection_id: locationSelectionId,
      return_location_selection_id: locationSelectionId,
      point_of_sale: country.pointOfSale,
      return_datetime: { value: ret },
      vehicle_type: 10,
      user_profile_id: opts.token ? getMnumFromToken(opts.token) : "",
      corporate_customer_number: opts.corporateRate || "",
      sim_card_country_code: country.code,
      device_location_country_code: country.code,
      campaign: opts.campaign || "",
    },
    enable_b2b_fallback: true,
  }, opts.token);
}

/** Fetch full booking details (including protection packages) for a specific offer */
export async function getBookingForOffer(
  offerMatrixId: string,
  offerId: string,
  currency: string,
  token?: string,
) {
  return grpcPost<{
    booking?: {
      selected?: {
        available_add_ons?: {
          packages?: Array<{
            description?: { name?: string; additional_info?: { name?: string } };
            actual_price?: { gross?: { value?: number } };
            actual_total_price?: { gross?: { value?: number } };
            damage_excess?: { value?: number };
            theft_excess?: { value?: number };
          }>;
        };
      };
    };
  }>("/com.sixt.service.rent_booking.api.BookingService/GetBookingForOffer", {
    booking_id: crypto.randomUUID(),
    offer_matrix_id: offerMatrixId,
    offer_id: offerId,
    currency,
  }, token);
}

/** Extract a specific protection package from a booking response */
export function findProtection(
  booking: Awaited<ReturnType<typeof getBookingForOffer>>,
  level: string,
): SixtProtection | null {
  const packages = booking?.booking?.selected?.available_add_ons?.packages || [];
  const nameMap: Record<string, string> = {
    basic: "Basic",
    smart: "Smart",
    allinclusive: "All Inclusive",
  };
  const target = nameMap[level];
  if (!target) return null;

  for (const pkg of packages) {
    const name = pkg.description?.additional_info?.name || pkg.description?.name || "";
    if (name.toLowerCase().includes(target.toLowerCase())) {
      return {
        name,
        pricePerDay: pkg.actual_price?.gross?.value || 0,
        priceTotal: pkg.actual_total_price?.gross?.value || 0,
        damageExcess: pkg.damage_excess?.value ?? null,
        theftExcess: pkg.theft_excess?.value ?? null,
      };
    }
  }
  return null;
}
