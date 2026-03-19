import { describe, test, expect } from "bun:test";
import { formatCurrency, formatTable } from "../lib/format";
import type { SixtOfferWithProtection } from "../lib/types";

function makeOffer(overrides: Partial<SixtOfferWithProtection> = {}): SixtOfferWithProtection {
  return {
    station: "Berlin BER",
    stationId: "8",
    title: "VW Golf",
    subline: "Compact",
    electric: false,
    hybrid: false,
    automatic: true,
    passengers: 5,
    bags: 3,
    doors: 4,
    priceDay: 49.99,
    priceTotal: 149.97,
    mileage: "750 km",
    guaranteed: false,
    examples: "VW Golf or similar",
    acriss: "CDAR",
    offerId: "offer-1",
    offerMatrixId: "matrix-1",
    protectionDay: null,
    protectionTotal: null,
    protectionName: null,
    totalWithProtection: null,
    dayWithProtection: null,
    ...overrides,
  };
}

describe("formatCurrency", () => {
  test("formats number with 2 decimals and currency", () => {
    expect(formatCurrency(123.4, "EUR")).toBe("123.40 EUR");
    expect(formatCurrency(0, "USD")).toBe("0.00 USD");
    expect(formatCurrency(99.999, "GBP")).toBe("100.00 GBP");
  });

  test("returns n/a for null or undefined", () => {
    expect(formatCurrency(null, "EUR")).toBe("n/a");
    expect(formatCurrency(undefined, "EUR")).toBe("n/a");
  });
});

describe("formatTable", () => {
  test("renders header, separator, and data rows", () => {
    const offers = [makeOffer()];
    const result = formatTable(offers, "EUR", false);
    const lines = result.split("\n");

    expect(lines.length).toBe(3); // header + separator + 1 row
    expect(lines[0]).toContain("Station");
    expect(lines[0]).toContain("Car");
    expect(lines[0]).toContain("EUR/day");
    expect(lines[0]).toContain("Total");
    expect(lines[0]).toContain("Bags");
    expect(lines[0]).toContain("Flags");
    expect(lines[1]).toMatch(/^[-+]+$/); // separator line
    expect(lines[2]).toContain("Berlin BER");
    expect(lines[2]).toContain("VW Golf");
  });

  test("includes protection column when hasProtection is true", () => {
    const offer = makeOffer({
      protectionDay: 12.5,
      protectionTotal: 37.5,
      protectionName: "Smart",
      totalWithProtection: 187.47,
      dayWithProtection: 62.49,
    });
    const result = formatTable([offer], "EUR", true);
    const header = result.split("\n")[0];

    expect(header).toContain("Prot/day");
    expect(result).toContain("+12.50");
    expect(result).toContain("62.49"); // dayWithProtection
    expect(result).toContain("187.47"); // totalWithProtection
  });

  test("omits protection column when hasProtection is false", () => {
    const result = formatTable([makeOffer()], "EUR", false);
    expect(result.split("\n")[0]).not.toContain("Prot/day");
  });

  test("shows base price when protection not fetched for an offer", () => {
    const offer = makeOffer(); // no protection fields set
    const result = formatTable([offer], "EUR", true);

    expect(result).toContain("49.99"); // priceDay
    expect(result).toContain("149.97"); // priceTotal
    expect(result).toContain("n/a"); // protectionDay
  });

  test("renders ASCII flags correctly", () => {
    const ev = makeOffer({ electric: true, automatic: true });
    const hybrid = makeOffer({ hybrid: true, automatic: true });
    const manual = makeOffer({ automatic: false });
    const guaranteed = makeOffer({ guaranteed: true });
    const evManual = makeOffer({ electric: true, automatic: false });

    expect(formatTable([ev], "EUR", false)).toContain("EV");
    expect(formatTable([hybrid], "EUR", false)).toContain("HYB");
    expect(formatTable([manual], "EUR", false)).toContain("MAN");
    expect(formatTable([guaranteed], "EUR", false)).toContain("[G]");

    // EV + manual
    const evManResult = formatTable([evManual], "EUR", false);
    expect(evManResult).toContain("EV");
    expect(evManResult).toContain("MAN");
  });

  test("electric takes precedence over hybrid in flags", () => {
    const both = makeOffer({ electric: true, hybrid: true });
    const result = formatTable([both], "EUR", false);
    expect(result).toContain("EV");
    expect(result).not.toContain("HYB");
  });

  test("expands columns to fit long station and car names", () => {
    const offer = makeOffer({
      station: "Berlin Alexanderplatz Zentrum Mitte",
      title: "Mercedes-Benz GLC 300 Coupe AMG Line",
    });
    const result = formatTable([offer], "EUR", false);
    const dataLine = result.split("\n")[2];

    // Columns should be wide enough for full names
    expect(dataLine).toContain("Berlin Alexanderplatz Zentrum Mitte");
    expect(dataLine).toContain("Mercedes-Benz GLC 300 Coupe AMG Line");
  });

  test("handles multiple rows", () => {
    const offers = [
      makeOffer({ title: "VW Golf", priceTotal: 150 }),
      makeOffer({ title: "BMW 3er", priceTotal: 300 }),
      makeOffer({ title: "Audi A6", priceTotal: 400 }),
    ];
    const lines = formatTable(offers, "EUR", false).split("\n");
    expect(lines.length).toBe(5); // header + separator + 3 rows
  });

  test("handles empty offers array", () => {
    const result = formatTable([], "EUR", false);
    const lines = result.split("\n");
    expect(lines.length).toBe(2); // header + separator only
  });
});
