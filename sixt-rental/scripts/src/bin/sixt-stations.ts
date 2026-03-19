#!/usr/bin/env bun
// Sixt station lookup — search for station IDs by city/query

import { parse, stationsOptions, validateCountryCode, type StationsValues } from "../lib/cli";
import { suggestLocations } from "../lib/client";
import type { SixtStation } from "../lib/types";

const { values } = parse<StationsValues>(stationsOptions);

if (values.help) {
  console.error(`Usage: bun sixt-stations.ts --query <city> [--country CC] [--table]

Search for Sixt rental stations by city or location name.

Options:
  --query    City or location to search for (required)
  --country  2-letter country code for API context (default: DE)
  --table    Output as human-readable table instead of JSON
  -h, --help Show this help`);
  process.exit(0);
}

if (!values.query) {
  console.error("Error: --query is required");
  process.exit(1);
}

validateCountryCode(values.country!);

const result = await suggestLocations(values.query!);

if (!result.suggestions?.length) {
  console.error(`No stations found for "${values.query}"`);
  process.exit(1);
}

const stations: SixtStation[] = result.suggestions
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

if (values.table) {
  const idWidth = Math.max(2, ...stations.map((s) => s.id.length));
  console.log(`${"ID".padEnd(idWidth)}  Station`);
  console.log(`${"-".repeat(idWidth)}  ${"-".repeat(30)}`);
  for (const s of stations) {
    console.log(`${s.id.padEnd(idWidth)}  ${s.name}`);
  }
} else {
  console.log(JSON.stringify(stations, null, 2));
}
