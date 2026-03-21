---
name: sixt-rental
description: Search Sixt car rental availability and prices across stations. Use when the user asks about renting a car, car rental prices, Sixt availability, comparing rental stations, finding electric/premium/family cars for rent, or weekend car rental options. NOT for: other rental companies (Europcar, Hertz, etc.), car purchases, or ride-hailing.
compatibility: Requires Bun runtime (bun.sh).
---

# Sixt Rental Search

Search Sixt car rental availability via their gRPC-web API. Always use the default JSON output — parse it and format results yourself based on what the user asked. `--table` exists for developers running scripts by hand; do not use it. Supports optional authenticated mode for member/Platinum pricing via `--token`.

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
| `--country` | DE | 2-letter country code (affects API params and currency) |
| `--filter` | — | Filter expression (repeatable, AND'd). See examples below |
| `--electric` | false | Shortcut for `--filter "electric"` |
| `--family` | false | Shortcut for `--filter "passengers>=5" "bags>=3" "automatic"` |
| `--protection` | — | Fetch protection pricing: `basic` / `smart` / `allinclusive` |
| `--limit` | 5 | Max offers to fetch protection for (0 = all) |
| `--rate` | — | Corporate customer number |
| `--campaign` | — | Partner campaign code |
| `--token` | — | JWT auth token for member/Platinum pricing (from `sixt-login`) |
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
| `--country` | DE | Country code (point of sale only; URL always uses sixt.de) |
| `--campaign` | — | Partner campaign code |
| `--station-name` | auto | Override station display name |
| `--token` | — | JWT auth token (from `sixt-login`) |
| `--table` | false | Output just the URL string |

### Look up stations

```bash
<skill-dir>/scripts/sixt-stations --query Berlin
```

| Flag | Default | Description |
|------|---------|-------------|
| `--query` | required | City or location to search |
| `--country` | DE | Country code |
| `--token` | — | JWT auth token (from `sixt-login`) |
| `--table` | false | Human-readable table output |

### Authenticate (member pricing)

Two-step non-interactive OTP login. The token is a short-lived JWT (~5 min TTL).

```bash
# Step 1: Request OTP (outputs session handle)
<skill-dir>/scripts/sixt-login --email user@example.com
# → prints session handle to stdout, sends OTP to email
# → ask user for the 6-digit code

# Step 2: Verify OTP (outputs JWT token)
<skill-dir>/scripts/sixt-login --email user@example.com --otp 123456 --session "<session from step 1>"
# → prints token to stdout — hold in context, pass via --token

# Step 3: Use token
<skill-dir>/scripts/sixt-search --pickup "2026-04-01T10:00" --return "2026-04-03T18:00" --station 8 --token "<token from step 2>"
```

| Flag | Default | Description |
|------|---------|-------------|
| `--email` | required | Sixt account email address |
| `--otp` | — | 6-digit OTP code (triggers verify step) |
| `--session` | — | Session handle from step 1 (required with `--otp`) |

All three scripts (`sixt-search`, `sixt-booking-url`, `sixt-stations`) accept `--token`.

When authenticated, offers include `regularPriceDay`/`regularPriceTotal` (the public price) alongside the discounted member price. The `promoLabel` field shows the tier (e.g. "PLATINUM Member Rate"). Discounts scale with car class: ~5% economy, ~10% mid-range, ~15% luxury.

#### Token handling rules

- **Prefer a secret manager** if one is available (e.g. `op`, `aws secretsmanager`, 1Password CLI) to store and retrieve the token rather than holding it in context. This keeps the token out of conversation history.
- **Otherwise, hold the token in context** and pass it literally via `--token`. Do not write it to disk or persist it to files.
- **Reuse the token** for follow-up searches within the ~5 min TTL. If the user asks "what about next weekend?", just run another search with the same `--token` value — do not request a new OTP.
- **OTP requests are rate-limited** (3 per window). Exceeding this blocks the account temporarily. Only request a new OTP when the previous token has expired.

## Campaign codes

| Code | Includes | Best for |
|------|----------|----------|
| `partner-Travelsales_wdmobility_Holiday` | Zero deductible, extra driver, unlimited km, free cancellation | International trips (all-inclusive); requires sixt.de domain |
| `partner-wdmobility_public_special` | Discounted base rate | Domestic trips (pick own insurance) |

Holiday rate prices include all insurance — compare the Holiday total against public base + protection to see real savings.

## Booking link domains

The domain in a Sixt booking URL controls the website locale (language, currency display) — it does not affect where the car is rented. The rental location is determined by the station. Booking URLs always generate with the `sixt.de` domain because the Holiday rate is pinned to the German market.

- **Holiday rate** (`partner-Travelsales_wdmobility_Holiday`): keep `.de` — changing it breaks the campaign pricing.
- **Other rates**: you may swap the domain to match the user's locale for a localized booking experience (e.g. `sixt.de` → `sixt.es` for a Spanish-speaking user). This changes the website language, not the rental location. The URL parameters stay valid across domains.

## Filtering

`--filter` takes an expression. Repeatable — multiple filters are AND'd.

```bash
# Boolean filters
--filter "electric"              # electric vehicles only
--filter "!hybrid"               # exclude hybrids
--filter "automatic"             # automatic transmission
--filter "luxury"                # luxury class

# Numeric comparisons
--filter "passengers>=5"         # 5+ seats
--filter "range>=400"            # EV range ≥ 400 km
--filter "priceTotal<=500"       # max total price
--filter "minAge<=21"            # available for young drivers

# String equality (case-insensitive)
--filter "groupType=SUV"         # SUVs only (SEDAN, VAN, CONVERTIBLE, STATION_WAGON)
--filter "bodyStyle!=Van"        # exclude vans
```

All offer fields are filterable. See `references/api.md` for the complete field list with types and examples.

## Common workflows

**Compare stations in a city:**
```bash
<skill-dir>/scripts/sixt-search --pickup "2026-04-01T10:00" --return "2026-04-03T18:00" --city Berlin --table
```

**Automatic SUVs with 5+ seats:**
```bash
<skill-dir>/scripts/sixt-search --pickup "2026-04-01T10:00" --return "2026-04-03T18:00" --station 8 --filter "groupType=SUV" --filter "automatic" --filter "passengers>=5"
```

**Electric cars with decent range in Lisbon:**
```bash
<skill-dir>/scripts/sixt-search --pickup "2026-05-16T09:00" --return "2026-05-30T09:00" --city Lisbon --country PT --filter "electric" --filter "range>=300"
```

**Authenticated search:**
```bash
<skill-dir>/scripts/sixt-search --pickup "2026-04-01T10:00" --return "2026-04-03T18:00" --station 8 --token "<token>" --table
```

**Compare Holiday vs public rate:**
```bash
# All-inclusive Holiday rate
<skill-dir>/scripts/sixt-search --pickup "2026-04-01T10:00" --return "2026-04-03T18:00" --station 8 --campaign "partner-Travelsales_wdmobility_Holiday"

# Public rate + Smart protection
<skill-dir>/scripts/sixt-search --pickup "2026-04-01T10:00" --return "2026-04-03T18:00" --station 8 --protection smart
```

## Reference files

Load these when you need deeper context:

| File | When to load |
|------|-------------|
| `references/api.md` | Full offer field reference (types, examples), `--filter` syntax, API endpoints |
| `references/pricing.md` | Advising on pricing strategy, explaining campaign codes |
| `references/stations.md` | Quick station ID lookup without running the stations script |
| `references/cross-border.md` | Which ACRISS categories can enter which countries (zone restrictions) |

## Compiled binaries (optional)

From `scripts/src/`, run `./build.sh` to compile standalone executables via `bun build --compile`. The wrappers in `scripts/` will use the compiled binaries if present.
