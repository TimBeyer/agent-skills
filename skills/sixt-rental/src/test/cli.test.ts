import { describe, test, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { validateIsoDatetime, validateDateOrder, validateCountryCode } from "../lib/cli";

describe("CLI validators", () => {
  let exitSpy: ReturnType<typeof spyOn>;
  let stderrSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Mock process.exit to throw instead of actually exiting
    exitSpy = spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    stderrSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  describe("validateIsoDatetime", () => {
    test("accepts valid ISO datetimes", () => {
      expect(() => validateIsoDatetime("2026-04-01T10:00", "pickup")).not.toThrow();
      expect(() => validateIsoDatetime("2026-12-31T23:59", "return")).not.toThrow();
      expect(() => validateIsoDatetime("2027-01-01T00:00", "pickup")).not.toThrow();
    });

    test("rejects wrong format", () => {
      expect(() => validateIsoDatetime("bad-date", "pickup")).toThrow("process.exit(1)");
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("ISO format"));
    });

    test("rejects date with seconds", () => {
      expect(() => validateIsoDatetime("2026-04-01T10:00:00", "pickup")).toThrow("process.exit(1)");
    });

    test("rejects date without time", () => {
      expect(() => validateIsoDatetime("2026-04-01", "pickup")).toThrow("process.exit(1)");
    });

    test("rejects empty string", () => {
      expect(() => validateIsoDatetime("", "pickup")).toThrow("process.exit(1)");
    });

    test("rejects date with timezone", () => {
      expect(() => validateIsoDatetime("2026-04-01T10:00Z", "pickup")).toThrow("process.exit(1)");
    });

    test("error message includes flag name", () => {
      try { validateIsoDatetime("nope", "pickup"); } catch {}
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("--pickup"));
    });
  });

  describe("validateDateOrder", () => {
    test("accepts return after pickup", () => {
      expect(() => validateDateOrder("2026-04-01T10:00", "2026-04-03T18:00")).not.toThrow();
    });

    test("rejects return before pickup", () => {
      expect(() => validateDateOrder("2026-04-03T18:00", "2026-04-01T10:00")).toThrow("process.exit(1)");
    });

    test("rejects equal dates", () => {
      expect(() => validateDateOrder("2026-04-01T10:00", "2026-04-01T10:00")).toThrow("process.exit(1)");
    });

    test("error message includes both dates", () => {
      try { validateDateOrder("2026-04-03T18:00", "2026-04-01T10:00"); } catch {}
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("2026-04-03T18:00"));
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("2026-04-01T10:00"));
    });
  });

  describe("validateCountryCode", () => {
    test("accepts valid 2-letter codes", () => {
      expect(() => validateCountryCode("DE")).not.toThrow();
      expect(() => validateCountryCode("pt")).not.toThrow();
      expect(() => validateCountryCode("Us")).not.toThrow();
    });

    test("rejects codes that are not 2 letters", () => {
      expect(() => validateCountryCode("DEU")).toThrow("process.exit(1)");
      expect(() => validateCountryCode("D")).toThrow("process.exit(1)");
      expect(() => validateCountryCode("")).toThrow("process.exit(1)");
      expect(() => validateCountryCode("123")).toThrow("process.exit(1)");
      expect(() => validateCountryCode("D1")).toThrow("process.exit(1)");
    });
  });
});
