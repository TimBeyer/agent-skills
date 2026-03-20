// Table formatting and currency display utilities

import type { SixtOfferWithProtection } from "./types";

/** Column definition for formatTable */
interface Column {
  header: string;
  align: "left" | "right";
  width: number;
  value: (row: SixtOfferWithProtection) => string;
}

/** Format a value as currency string (e.g., "123.45 EUR") */
export function formatCurrency(value: number | null | undefined, currency: string): string {
  if (value == null) return "n/a";
  return `${value.toFixed(2)} ${currency}`;
}

/** Replace emoji flags with fixed-width ASCII equivalents */
function asciiFlags(offer: SixtOfferWithProtection): string {
  const parts: string[] = [];
  if (offer.electric) parts.push("EV");
  else if (offer.hybrid) parts.push("HYB");
  if (offer.guaranteed) parts.push("[G]");
  if (!offer.automatic) parts.push("MAN");
  return parts.join(" ");
}

/** Truncate or pad a string to exactly `width` visible columns */
function fitWidth(str: string, width: number, align: "left" | "right"): string {
  const sw = Bun.stringWidth(str);
  if (sw > width) {
    // Truncate character by character until it fits
    let result = "";
    let w = 0;
    for (const ch of str) {
      const cw = Bun.stringWidth(ch);
      if (w + cw > width) break;
      result += ch;
      w += cw;
    }
    return result;
  }
  const pad = " ".repeat(width - sw);
  return align === "right" ? pad + str : str + pad;
}

/** Compute the minimum column width to fit the header and all data values */
function autoWidth(header: string, offers: SixtOfferWithProtection[], value: (r: SixtOfferWithProtection) => string): number {
  let max = Bun.stringWidth(header);
  for (const o of offers) {
    const w = Bun.stringWidth(value(o));
    if (w > max) max = w;
  }
  return max;
}

/** Format offers as a fixed-width ASCII table */
export function formatTable(
  offers: SixtOfferWithProtection[],
  currency: string,
  hasProtection: boolean,
): string {
  const stationVal = (r: SixtOfferWithProtection) => r.station;
  const carVal = (r: SixtOfferWithProtection) => r.title;

  const cols: Column[] = [
    { header: "Station", align: "left", width: autoWidth("Station", offers, stationVal), value: stationVal },
    { header: "Car", align: "left", width: autoWidth("Car", offers, carVal), value: carVal },
    {
      header: `${currency}/day`,
      align: "right",
      width: 10,
      value: (r) =>
        hasProtection && r.dayWithProtection != null
          ? r.dayWithProtection.toFixed(2)
          : (r.priceDay?.toFixed(2) ?? "n/a"),
    },
    {
      header: "Total",
      align: "right",
      width: 10,
      value: (r) =>
        hasProtection && r.totalWithProtection != null
          ? r.totalWithProtection.toFixed(2)
          : (r.priceTotal?.toFixed(2) ?? "n/a"),
    },
  ];

  if (hasProtection) {
    cols.push({
      header: "Prot/day",
      align: "right",
      width: 10,
      value: (r) => (r.protectionDay != null ? `+${r.protectionDay.toFixed(2)}` : "n/a"),
    });
  }

  cols.push(
    { header: "ACRISS", align: "left", width: 6, value: (r) => r.acriss || "" },
    { header: "Bags", align: "right", width: 4, value: (r) => String(r.bags) },
    { header: "Pax", align: "right", width: 3, value: (r) => String(r.passengers) },
    { header: "Flags", align: "left", width: 10, value: (r) => asciiFlags(r) },
  );

  // Header row
  const headerLine = cols.map((c) => fitWidth(c.header, c.width, c.align)).join(" | ");
  const separator = cols.map((c) => "-".repeat(c.width)).join("-+-");

  // Data rows
  const rows = offers.map((offer) =>
    cols.map((c) => fitWidth(c.value(offer), c.width, c.align)).join(" | "),
  );

  return [headerLine, separator, ...rows].join("\n");
}
