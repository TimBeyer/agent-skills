// Country code → Sixt API config, currency, and booking domain

import type { CountryConfig } from "./types";

const countries: Record<string, CountryConfig> = {
  DE: { code: "DE", pointOfSale: "DE", currency: "EUR", domain: "sixt.de", locale: "de-DE" },
  AT: { code: "AT", pointOfSale: "AT", currency: "EUR", domain: "sixt.at", locale: "de-AT" },
  CH: { code: "CH", pointOfSale: "CH", currency: "CHF", domain: "sixt.ch", locale: "de-CH" },
  PT: { code: "PT", pointOfSale: "PT", currency: "EUR", domain: "sixt.pt", locale: "pt-PT" },
  ES: { code: "ES", pointOfSale: "ES", currency: "EUR", domain: "sixt.es", locale: "es-ES" },
  FR: { code: "FR", pointOfSale: "FR", currency: "EUR", domain: "sixt.fr", locale: "fr-FR" },
  IT: { code: "IT", pointOfSale: "IT", currency: "EUR", domain: "sixt.it", locale: "it-IT" },
  US: { code: "US", pointOfSale: "US", currency: "USD", domain: "sixt.com", locale: "en-US" },
  GB: { code: "GB", pointOfSale: "GB", currency: "GBP", domain: "sixt.co.uk", locale: "en-GB" },
  NL: { code: "NL", pointOfSale: "NL", currency: "EUR", domain: "sixt.nl", locale: "nl-NL" },
  BE: { code: "BE", pointOfSale: "BE", currency: "EUR", domain: "sixt.be", locale: "fr-BE" },
};

/**
 * Get country config by ISO 2-letter code.
 * Falls back to DE with a stderr warning for unknown codes.
 */
export function getCountry(code: string): CountryConfig {
  const upper = code.toUpperCase();
  const config = countries[upper];
  if (config) return config;

  console.error(`Warning: unknown country "${code}", falling back to DE`);
  return countries.DE;
}
