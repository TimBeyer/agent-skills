import { describe, test, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { parseFilter, applyFilters } from "../lib/filter";
import type { SixtOffer } from "../lib/types";

function makeOffer(overrides: Partial<SixtOffer> = {}): SixtOffer {
  return {
    station: "Berlin BER",
    stationId: "8",
    title: "VW Golf",
    subline: "Compact Limousine Automatic",
    acriss: "CDAR",
    groupType: "SEDAN",
    bodyStyle: "Limousine",
    guaranteed: false,
    examples: "VW Golf or similar",
    imageUrl: "",
    passengers: 5,
    bags: 3,
    largeBags: 2,
    smallBags: 1,
    doors: 5,
    automatic: true,
    navIncluded: false,
    electric: false,
    hybrid: false,
    luxury: false,
    range: null,
    chargingCable: "",
    minAge: 18,
    youngDriverFee: false,
    priceDay: 80,
    priceTotal: 240,
    deposit: 300,
    mileage: "900 km included",
    extraKmPrice: 0.35,
    unlimitedKmAvailable: true,
    unlimitedKmPriceTotal: 252,
    rentalDays: 3,
    promoLabel: "",
    offerId: "offer-1",
    offerMatrixId: "matrix-1",
    ...overrides,
  };
}

describe("parseFilter", () => {
  let exitSpy: ReturnType<typeof spyOn>;
  let stderrSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    exitSpy = spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    stderrSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  test("parses boolean true (bare name)", () => {
    const f = parseFilter("electric");
    expect(f).toEqual({ field: "electric", op: "bool", value: true });
  });

  test("parses boolean false (negation)", () => {
    const f = parseFilter("!hybrid");
    expect(f).toEqual({ field: "hybrid", op: "bool", value: false });
  });

  test("parses numeric comparisons", () => {
    expect(parseFilter("passengers>=5")).toEqual({ field: "passengers", op: ">=", value: 5 });
    expect(parseFilter("bags>2")).toEqual({ field: "bags", op: ">", value: 2 });
    expect(parseFilter("priceTotal<=500")).toEqual({ field: "priceTotal", op: "<=", value: 500 });
    expect(parseFilter("minAge<25")).toEqual({ field: "minAge", op: "<", value: 25 });
    expect(parseFilter("doors!=3")).toEqual({ field: "doors", op: "!=", value: 3 });
    expect(parseFilter("range>=400")).toEqual({ field: "range", op: ">=", value: 400 });
  });

  test("parses string equality", () => {
    const f = parseFilter("groupType=SUV");
    expect(f).toEqual({ field: "groupType", op: "=", value: "SUV" });
  });

  test("parses string inequality", () => {
    const f = parseFilter("bodyStyle!=Van");
    expect(f).toEqual({ field: "bodyStyle", op: "!=", value: "Van" });
  });

  test("exits on unknown field", () => {
    expect(() => parseFilter("color=red")).toThrow("process.exit(1)");
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('unknown filter field "color"'));
  });

  test("exits on non-numeric value for numeric field", () => {
    expect(() => parseFilter("passengers>=abc")).toThrow("process.exit(1)");
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("expected a number"));
  });
});

describe("applyFilters", () => {
  const sedan = makeOffer({ groupType: "SEDAN", electric: false, passengers: 5 });
  const suv = makeOffer({ groupType: "SUV", bodyStyle: "SUV", electric: false, passengers: 5, bags: 4 });
  const ev = makeOffer({ title: "Tesla Model 3", electric: true, range: 500, groupType: "SEDAN" });
  const evShort = makeOffer({ title: "Fiat 500e", electric: true, range: 200, groupType: "SEDAN", passengers: 4 });
  const van = makeOffer({ groupType: "VAN", passengers: 7, bags: 5, automatic: false });
  const luxurySedan = makeOffer({ groupType: "SEDAN", luxury: true, priceTotal: 800 });

  const all = [sedan, suv, ev, evShort, van, luxurySedan];

  test("returns all offers when no filters", () => {
    expect(applyFilters(all, [])).toEqual(all);
  });

  test("filters by boolean true", () => {
    const filters = [parseFilter("electric")];
    expect(applyFilters(all, filters)).toEqual([ev, evShort]);
  });

  test("filters by boolean false", () => {
    const filters = [parseFilter("!electric")];
    expect(applyFilters(all, filters)).toEqual([sedan, suv, van, luxurySedan]);
  });

  test("filters by string equality (case-insensitive)", () => {
    const filters = [parseFilter("groupType=suv")];
    expect(applyFilters(all, filters)).toEqual([suv]);
  });

  test("filters by numeric comparison", () => {
    const filters = [parseFilter("passengers>=5")];
    const result = applyFilters(all, filters);
    expect(result).toContain(sedan);
    expect(result).toContain(suv);
    expect(result).toContain(van);
    expect(result).not.toContain(evShort); // passengers: 4
  });

  test("combines multiple filters (AND)", () => {
    const filters = [parseFilter("electric"), parseFilter("range>=400")];
    expect(applyFilters(all, filters)).toEqual([ev]); // only Tesla has range >= 400
  });

  test("filters by price", () => {
    const filters = [parseFilter("priceTotal<=500")];
    const result = applyFilters(all, filters);
    expect(result).not.toContain(luxurySedan); // priceTotal: 800
  });

  test("null fields don't match numeric comparisons", () => {
    // sedan has range: null
    const filters = [parseFilter("range>=0")];
    expect(applyFilters([sedan], filters)).toEqual([]);
  });

  test("null fields match boolean false", () => {
    // An offer with range: null — "!range" should match (falsy)
    const filters = [parseFilter("!range")];
    expect(applyFilters([sedan], filters)).toEqual([sedan]);
  });

  test("replicates old --family filter", () => {
    const filters = [parseFilter("passengers>=5"), parseFilter("bags>=3"), parseFilter("automatic")];
    const result = applyFilters(all, filters);
    expect(result).toContain(sedan);
    expect(result).toContain(suv);
    expect(result).not.toContain(van); // not automatic
    expect(result).not.toContain(evShort); // passengers: 4
  });
});
