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
  // Station
  station: string;
  stationId: string;

  // Vehicle identity
  title: string;
  subline: string;
  acriss: string;
  groupType: string;
  bodyStyle: string;
  guaranteed: boolean;
  examples: string;
  imageUrl: string;

  // Vehicle specs
  passengers: number;
  bags: number;
  largeBags: number;
  smallBags: number;
  doors: number;
  automatic: boolean;
  navIncluded: boolean;

  // Powertrain
  electric: boolean;
  hybrid: boolean;
  luxury: boolean;
  range: number | null;
  chargingCable: string;

  // Driver requirements
  minAge: number;
  youngDriverFee: boolean;

  // Pricing
  priceDay: number;
  priceTotal: number;
  regularPriceDay: number | null;
  regularPriceTotal: number | null;
  deposit: number;
  mileage: string;
  extraKmPrice: number | null;
  unlimitedKmAvailable: boolean;
  unlimitedKmPriceTotal: number | null;

  // Presentation
  rentalDays: number;
  promoLabel: string;

  // Internal (stripped from JSON output)
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

/** Response from requestLoginOTP */
export interface OtpResponse {
  otpExpiryTime: string;
  channels: string[];
}

/** Response from verifyLoginOTP */
export interface AuthTokenResponse {
  accessToken: string;
  /** Absolute Unix timestamp (epoch seconds) when the token expires */
  expiresIn: number;
}

/** Decoded JWT payload (relevant fields only) */
export interface JwtPayload {
  user_id: string;
  mnum?: number;
  exp: number;
  [key: string]: unknown;
}
