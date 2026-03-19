import { describe, test, expect, spyOn, afterEach } from "bun:test";
import { getCountry } from "../lib/countries";

describe("getCountry", () => {
  const stderrSpy = spyOn(console, "error");

  afterEach(() => {
    stderrSpy.mockClear();
  });

  test("returns correct config for known country codes", () => {
    const de = getCountry("DE");
    expect(de.code).toBe("DE");
    expect(de.currency).toBe("EUR");
    expect(de.domain).toBe("sixt.de");
    expect(de.pointOfSale).toBe("DE");

    const pt = getCountry("PT");
    expect(pt.currency).toBe("EUR");
    expect(pt.domain).toBe("sixt.pt");

    const us = getCountry("US");
    expect(us.currency).toBe("USD");
    expect(us.domain).toBe("sixt.com");

    const gb = getCountry("GB");
    expect(gb.currency).toBe("GBP");
    expect(gb.domain).toBe("sixt.co.uk");

    const ch = getCountry("CH");
    expect(ch.currency).toBe("CHF");
  });

  test("is case insensitive", () => {
    expect(getCountry("de")).toEqual(getCountry("DE"));
    expect(getCountry("pt")).toEqual(getCountry("PT"));
    expect(getCountry("Us")).toEqual(getCountry("US"));
  });

  test("falls back to DE for unknown codes", () => {
    const result = getCountry("XX");
    expect(result.code).toBe("DE");
    expect(result.domain).toBe("sixt.de");
  });

  test("prints stderr warning for unknown codes", () => {
    getCountry("ZZ");
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('unknown country "ZZ"'),
    );
  });

  test("does not warn for known codes", () => {
    getCountry("DE");
    expect(stderrSpy).not.toHaveBeenCalled();
  });
});
