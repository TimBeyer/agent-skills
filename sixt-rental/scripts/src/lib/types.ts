// Sixt rental skill — shared type definitions

/** Country configuration for API params, currency, and booking URL domain */
export interface CountryConfig {
  code: string;
  pointOfSale: string;
  currency: string;
  domain: string;
  locale: string;
}

/** A Sixt branch station returned from SuggestLocations */
export interface SixtStation {
  id: string;
  name: string;
}

/** A car rental offer from GetOfferRecommendationsV2 */
export interface SixtOffer {
  station: string;
  stationId: string;
  title: string;
  subline: string;
  electric: boolean;
  hybrid: boolean;
  automatic: boolean;
  passengers: number;
  bags: number;
  doors: number;
  priceDay: number;
  priceTotal: number;
  mileage: string;
  guaranteed: boolean;
  examples: string;
  acriss: string;
  offerId: string;
  offerMatrixId: string;
}

/** Enriched offer with protection pricing */
export interface SixtOfferWithProtection extends SixtOffer {
  protectionDay: number | null;
  protectionTotal: number | null;
  protectionName: string | null;
  totalWithProtection: number | null;
  dayWithProtection: number | null;
}

/** Protection package details from GetBookingForOffer */
export interface SixtProtection {
  name: string;
  pricePerDay: number;
  priceTotal: number;
  damageExcess: number | null;
  theftExcess: number | null;
}

/** Parsed CLI args for the search command */
export interface SearchArgs {
  pickup: string;
  return: string;
  city: string;
  station?: string;
  country: string;
  electric: boolean;
  family: boolean;
  protection?: string;
  rate: string;
  campaign: string;
  limit: number;
  table: boolean;
}

/** Parsed CLI args for the booking URL command */
export interface BookingUrlArgs {
  pickup: string;
  return: string;
  station: string;
  country: string;
  campaign: string;
  stationName: string;
  table: boolean;
}

/** Parsed CLI args for the stations command */
export interface StationsArgs {
  query: string;
  country: string;
  table: boolean;
}
