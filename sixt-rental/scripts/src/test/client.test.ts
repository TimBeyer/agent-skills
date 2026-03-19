import { describe, test, expect } from "bun:test";
import { findProtection } from "../lib/client";

// Helper to build a fake booking response matching the getBookingForOffer return type
function makeBookingResponse(packages: Array<{
  name?: string;
  additionalName?: string;
  pricePerDay?: number;
  priceTotal?: number;
  damageExcess?: number;
  theftExcess?: number;
}>) {
  return {
    booking: {
      selected: {
        available_add_ons: {
          packages: packages.map((p) => ({
            description: {
              name: p.name || "",
              additional_info: p.additionalName ? { name: p.additionalName } : undefined,
            },
            actual_price: { gross: { value: p.pricePerDay ?? 0 } },
            actual_total_price: { gross: { value: p.priceTotal ?? 0 } },
            damage_excess: p.damageExcess != null ? { value: p.damageExcess } : undefined,
            theft_excess: p.theftExcess != null ? { value: p.theftExcess } : undefined,
          })),
        },
      },
    },
  };
}

describe("findProtection", () => {
  const fullBooking = makeBookingResponse([
    {
      additionalName: "Basic Protection",
      pricePerDay: 8.99,
      priceTotal: 26.97,
      damageExcess: 1500,
      theftExcess: 1500,
    },
    {
      additionalName: "Smart Protection",
      pricePerDay: 14.99,
      priceTotal: 44.97,
      damageExcess: 450,
      theftExcess: 450,
    },
    {
      additionalName: "All Inclusive Protection",
      pricePerDay: 24.99,
      priceTotal: 74.97,
      damageExcess: 0,
      theftExcess: 0,
    },
  ]);

  test("finds basic protection", () => {
    const result = findProtection(fullBooking, "basic");
    expect(result).not.toBeNull();
    expect(result!.name).toContain("Basic");
    expect(result!.pricePerDay).toBe(8.99);
    expect(result!.priceTotal).toBe(26.97);
    expect(result!.damageExcess).toBe(1500);
  });

  test("finds smart protection", () => {
    const result = findProtection(fullBooking, "smart");
    expect(result).not.toBeNull();
    expect(result!.name).toContain("Smart");
    expect(result!.pricePerDay).toBe(14.99);
    expect(result!.priceTotal).toBe(44.97);
  });

  test("finds all inclusive protection", () => {
    const result = findProtection(fullBooking, "allinclusive");
    expect(result).not.toBeNull();
    expect(result!.name).toContain("All Inclusive");
    expect(result!.pricePerDay).toBe(24.99);
    expect(result!.damageExcess).toBe(0);
    expect(result!.theftExcess).toBe(0);
  });

  test("returns null for unknown protection level", () => {
    expect(findProtection(fullBooking, "premium")).toBeNull();
    expect(findProtection(fullBooking, "")).toBeNull();
    expect(findProtection(fullBooking, "gold")).toBeNull();
  });

  test("returns null when no packages available", () => {
    const empty = makeBookingResponse([]);
    expect(findProtection(empty, "smart")).toBeNull();
  });

  test("returns null for empty booking response", () => {
    expect(findProtection({} as any, "smart")).toBeNull();
    expect(findProtection({ booking: {} } as any, "smart")).toBeNull();
    expect(findProtection({ booking: { selected: {} } } as any, "smart")).toBeNull();
  });

  test("prefers additional_info.name over description.name", () => {
    const booking = makeBookingResponse([
      { name: "Protection Package", additionalName: "Smart Protection", pricePerDay: 10 },
    ]);
    const result = findProtection(booking, "smart");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Smart Protection");
  });

  test("falls back to description.name when additional_info.name is missing", () => {
    const booking = {
      booking: {
        selected: {
          available_add_ons: {
            packages: [{
              description: { name: "Smart Protection" },
              actual_price: { gross: { value: 10 } },
              actual_total_price: { gross: { value: 30 } },
            }],
          },
        },
      },
    };
    const result = findProtection(booking as any, "smart");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Smart Protection");
  });

  test("matching is case insensitive", () => {
    const booking = makeBookingResponse([
      { additionalName: "SMART PROTECTION PLUS", pricePerDay: 15 },
    ]);
    const result = findProtection(booking, "smart");
    expect(result).not.toBeNull();
  });

  test("handles missing price fields gracefully", () => {
    const booking = {
      booking: {
        selected: {
          available_add_ons: {
            packages: [{
              description: { additional_info: { name: "Smart" } },
              // no price fields
            }],
          },
        },
      },
    };
    const result = findProtection(booking as any, "smart");
    expect(result).not.toBeNull();
    expect(result!.pricePerDay).toBe(0);
    expect(result!.priceTotal).toBe(0);
    expect(result!.damageExcess).toBeNull();
    expect(result!.theftExcess).toBeNull();
  });
});
