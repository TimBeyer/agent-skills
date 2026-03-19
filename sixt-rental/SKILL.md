---
name: sixt-rental
description: Search Sixt car rental availability and prices across stations. Use when the user asks about renting a car, car rental prices, Sixt availability, comparing rental stations, finding electric/premium/family cars for rent, or weekend car rental options. NOT for: other rental companies (Europcar, Hertz, etc.), car purchases, or ride-hailing.
compatibility: Requires Bun runtime (bun.sh).
---

# Sixt Rental Search

Search Sixt car rental availability via their unauthenticated gRPC-web API. Scripts output JSON to stdout by default (for agent consumption) and support `--table` for human-readable output.

## Scripts

### Search offers

```bash
<skill-dir>/scripts/sixt-search --pickup "2026-04-01T10:00" --return "2026-04-03T18:00" --city Berlin
```

| Flag | Default | Description |
|------|---------|-------------|
| `--pickup` | required | Pickup datetime (YYYY-MM-DDTHH:MM) |
| `--return` | required | Return datetime |
| `--city` | Berlin | City name for station search |
| `--station` | — | Specific station ID (skips city search) |
| `--country` | DE | 2-letter country code (affects API params, currency, booking domain) |
| `--electric` | false | Show only electric vehicles |
| `--family` | false | Filter: 5+ seats, 3+ bags, automatic |
| `--protection` | — | Fetch protection pricing: `basic` / `smart` / `allinclusive` |
| `--limit` | 5 | Max offers to fetch protection for (0 = all) |
| `--rate` | — | Corporate customer number |
| `--campaign` | — | Partner campaign code |
| `--table` | false | Human-readable table output |

### Generate booking URL

```bash
<skill-dir>/scripts/sixt-booking-url --pickup "2026-04-01T10:00" --return "2026-04-03T18:00" --station 8
```

| Flag | Default | Description |
|------|---------|-------------|
| `--pickup` | required | Pickup datetime |
| `--return` | required | Return datetime |
| `--station` | required | Station branch ID |
| `--country` | DE | Country code |
| `--campaign` | — | Partner campaign code |
| `--station-name` | auto | Override station display name |
| `--table` | false | Output just the URL string |

### Look up stations

```bash
<skill-dir>/scripts/sixt-stations --query Berlin
```

| Flag | Default | Description |
|------|---------|-------------|
| `--query` | required | City or location to search |
| `--country` | DE | Country code |
| `--table` | false | Human-readable table output |

## Campaign codes

| Code | Includes | Best for |
|------|----------|----------|
| `partner-Travelsales_wdmobility_Holiday` | Zero deductible, extra driver, unlimited km, free cancellation | International trips (all-inclusive) |
| `partner-wdmobility_public_special` | Discounted base rate | Domestic trips (pick own insurance) |

Holiday rate prices include all insurance — compare the Holiday total against public base + protection to see real savings.

## Common workflows

**Compare stations in a city:**
```bash
<skill-dir>/scripts/sixt-search --pickup "2026-04-01T10:00" --return "2026-04-03T18:00" --city Berlin --table
```

**Compare Holiday vs public rate:**
```bash
# All-inclusive Holiday rate
<skill-dir>/scripts/sixt-search --pickup "2026-04-01T10:00" --return "2026-04-03T18:00" --station 8 --campaign "partner-Travelsales_wdmobility_Holiday"

# Public rate + Smart protection
<skill-dir>/scripts/sixt-search --pickup "2026-04-01T10:00" --return "2026-04-03T18:00" --station 8 --protection smart
```

**Find electric cars in Lisbon:**
```bash
<skill-dir>/scripts/sixt-search --pickup "2026-05-16T09:00" --return "2026-05-30T09:00" --city Lisbon --country PT --electric
```

## Reference files

Load these when you need deeper context:

| File | When to load |
|------|-------------|
| `references/api.md` | Debugging API issues, understanding request/response fields |
| `references/pricing.md` | Advising on pricing strategy, explaining campaign codes |
| `references/stations.md` | Quick station ID lookup without running the stations script |
| `references/cross-border.md` | Which ACRISS categories can enter which countries (zone restrictions) |

## Compiled binaries (optional)

From `scripts/src/`, run `./build.sh` to compile standalone executables via `bun build --compile`. The wrappers in `scripts/` will use the compiled binaries if present.
