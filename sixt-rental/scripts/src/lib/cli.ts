// Shared CLI argument parsing and validation using util.parseArgs

import { parseArgs, type ParseArgsConfig } from "node:util";

/** Validate ISO datetime format (YYYY-MM-DDTHH:MM) */
export function validateIsoDatetime(value: string, name: string): void {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    console.error(`Error: --${name} must be ISO format YYYY-MM-DDTHH:MM, got "${value}"`);
    process.exit(1);
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    console.error(`Error: --${name} is not a valid date: "${value}"`);
    process.exit(1);
  }
}

/** Validate return date is after pickup date */
export function validateDateOrder(pickup: string, ret: string): void {
  if (new Date(ret) <= new Date(pickup)) {
    console.error(`Error: --return (${ret}) must be after --pickup (${pickup})`);
    process.exit(1);
  }
}

/** Validate 2-letter country code */
export function validateCountryCode(code: string): void {
  if (!/^[A-Za-z]{2}$/.test(code)) {
    console.error(`Error: --country must be a 2-letter code, got "${code}"`);
    process.exit(1);
  }
}

// --- Option schemas for each command ---

export const searchOptions: ParseArgsConfig["options"] = {
  pickup:     { type: "string" },
  return:     { type: "string" },
  city:       { type: "string", default: "Berlin" },
  station:    { type: "string" },
  country:    { type: "string", default: "DE" },
  filter:     { type: "string", multiple: true },
  electric:   { type: "boolean", default: false },  // alias for --filter "electric"
  family:     { type: "boolean", default: false },   // alias for --filter "passengers>=5" --filter "bags>=3" --filter "automatic"
  protection: { type: "string" },
  rate:       { type: "string", default: "" },
  campaign:   { type: "string", default: "" },
  limit:      { type: "string", default: "5" },
  token:      { type: "string" },
  table:      { type: "boolean", default: false },
  help:       { type: "boolean", short: "h", default: false },
};

export const bookingUrlOptions: ParseArgsConfig["options"] = {
  pickup:        { type: "string" },
  return:        { type: "string" },
  station:       { type: "string" },
  country:       { type: "string", default: "DE" },
  campaign:      { type: "string", default: "" },
  "station-name": { type: "string", default: "" },
  token:         { type: "string" },
  table:         { type: "boolean", default: false },
  help:          { type: "boolean", short: "h", default: false },
};

export const stationsOptions: ParseArgsConfig["options"] = {
  query:   { type: "string" },
  country: { type: "string", default: "DE" },
  token:   { type: "string" },
  table:   { type: "boolean", default: false },
  help:    { type: "boolean", short: "h", default: false },
};

export const loginOptions: ParseArgsConfig["options"] = {
  email: { type: "string" },
  help:  { type: "boolean", short: "h", default: false },
};

// --- Typed value shapes for each command ---

export interface SearchValues {
  help: boolean;
  pickup?: string;
  return?: string;
  city: string;
  station?: string;
  country: string;
  filter?: string[];
  electric: boolean;
  family: boolean;
  protection?: string;
  rate: string;
  campaign: string;
  limit: string;
  token?: string;
  table: boolean;
}

export interface BookingUrlValues {
  help: boolean;
  pickup?: string;
  return?: string;
  station?: string;
  country: string;
  campaign: string;
  "station-name": string;
  token?: string;
  table: boolean;
}

export interface StationsValues {
  help: boolean;
  query?: string;
  country: string;
  token?: string;
  table: boolean;
}

export interface LoginValues {
  help: boolean;
  email?: string;
}

/** Parse args with the given options config. Exits on unknown flags. */
export function parse<T = Record<string, string | boolean | undefined>>(
  options: ParseArgsConfig["options"],
) {
  return parseArgs({ options, strict: true, args: Bun.argv.slice(2) }) as unknown as {
    values: T;
    positionals: string[];
  };
}
