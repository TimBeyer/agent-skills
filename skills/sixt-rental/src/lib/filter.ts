// Generic offer filter — parses expressions like "electric", "!hybrid", "passengers>=5", "groupType=SUV"

import type { SixtOffer } from "./types";

type Operator = "=" | "!=" | ">=" | "<=" | ">" | "<";
type FilterableField = keyof SixtOffer;

interface Filter {
  field: FilterableField;
  op: Operator | "bool";
  value: string | number | boolean;
}

/** Fields on SixtOffer that can be filtered, with their runtime types */
const FIELD_TYPES: Partial<Record<FilterableField, "string" | "number" | "boolean">> = {
  // Vehicle identity
  title: "string",
  subline: "string",
  acriss: "string",
  groupType: "string",
  bodyStyle: "string",
  guaranteed: "boolean",
  imageUrl: "string",

  // Vehicle specs
  passengers: "number",
  bags: "number",
  largeBags: "number",
  smallBags: "number",
  doors: "number",
  automatic: "boolean",
  navIncluded: "boolean",

  // Powertrain
  electric: "boolean",
  hybrid: "boolean",
  luxury: "boolean",
  range: "number",
  chargingCable: "string",

  // Driver requirements
  minAge: "number",
  youngDriverFee: "boolean",

  // Pricing
  priceDay: "number",
  priceTotal: "number",
  deposit: "number",
  mileage: "string",
  extraKmPrice: "number",
  unlimitedKmAvailable: "boolean",
  unlimitedKmPriceTotal: "number",

  // Presentation
  rentalDays: "number",
  promoLabel: "string",

  // Station
  station: "string",
  stationId: "string",
};

/** Parse a single filter expression. Exits with helpful error on bad input. */
export function parseFilter(expr: string): Filter {
  // Boolean negation: "!electric"
  if (expr.startsWith("!")) {
    const field = expr.slice(1);
    validateField(field, expr);
    return { field, op: "bool", value: false };
  }

  // Comparison operators (check two-char operators first)
  for (const op of [">=", "<=", "!=", ">", "<", "="] as const) {
    const idx = expr.indexOf(op);
    if (idx > 0) {
      const field = expr.slice(0, idx);
      const raw = expr.slice(idx + op.length);
      validateField(field, expr);
      const fieldType = FIELD_TYPES[field];

      if (fieldType === "number") {
        const num = Number(raw);
        if (isNaN(num)) {
          console.error(`Error: filter "${expr}" — expected a number after "${op}", got "${raw}"`);
          process.exit(1);
        }
        return { field, op, value: num };
      }
      if (fieldType === "boolean") {
        return { field, op, value: raw === "true" };
      }
      // String comparison
      return { field, op, value: raw };
    }
  }

  // Bare name = boolean true: "electric", "automatic"
  validateField(expr, expr);
  return { field: expr, op: "bool", value: true };
}

/** Apply an array of filters to offers. All filters must match (AND). */
export function applyFilters(offers: SixtOffer[], filters: Filter[]): SixtOffer[] {
  if (filters.length === 0) return offers;
  return offers.filter((offer) => filters.every((f) => matchFilter(offer, f)));
}

function matchFilter(offer: SixtOffer, filter: Filter): boolean {
  const actual = offer[filter.field];

  // Null values never match comparison filters
  if (actual == null) {
    return filter.op === "bool" && filter.value === false;
  }

  if (filter.op === "bool") {
    return Boolean(actual) === filter.value;
  }

  const expected = filter.value;

  if (typeof actual === "number" && typeof expected === "number") {
    switch (filter.op) {
      case "=": return actual === expected;
      case "!=": return actual !== expected;
      case ">=": return actual >= expected;
      case "<=": return actual <= expected;
      case ">": return actual > expected;
      case "<": return actual < expected;
    }
  }

  // String comparison (case-insensitive for = and !=)
  const a = String(actual).toLowerCase();
  const e = String(expected).toLowerCase();
  switch (filter.op) {
    case "=": return a === e;
    case "!=": return a !== e;
    case ">=": return a >= e;
    case "<=": return a <= e;
    case ">": return a > e;
    case "<": return a < e;
  }
}

function validateField(field: string, expr: string): asserts field is FilterableField {
  if (!FIELD_TYPES[field as FilterableField]) {
    const known = Object.keys(FIELD_TYPES).sort().join(", ");
    console.error(`Error: unknown filter field "${field}" in "${expr}"`);
    console.error(`Known fields: ${known}`);
    process.exit(1);
  }
}

/** Get all known filterable field names (for --help output) */
export function getFilterableFields(): Partial<Record<FilterableField, string>> {
  return { ...FIELD_TYPES };
}
