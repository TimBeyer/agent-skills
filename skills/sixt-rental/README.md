# sixt-rental

An [Agent Skill](https://agentskills.io) that lets AI agents search Sixt car rental availability, compare prices across stations, and generate booking links. The agent gets structured JSON with 30+ fields per offer — vehicle specs, pricing, powertrain, mileage limits — and can filter, sort, and reason over the results.

```
User: "Find me an electric car in Berlin for next weekend, under €100/day"

Agent: searches 15 stations, filters by electric + priceDay<=100, returns:

  Citroen e-C3         €66.65/day  326km range  Berlin Flughafen
  Citroen e-C3 Aircross  €84.32/day  400km range  Berlin Flughafen
```

## What the agent can do

**Search and compare** — query by city (searches all stations) or specific station ID. Every offer comes back as a JSON object with vehicle details, pricing, specs, and availability:

```json
{
  "title": "Citroen e-C3",
  "priceDay": 66.65,
  "priceTotal": 199.96,
  "electric": true,
  "range": 326,
  "passengers": 5,
  "automatic": true,
  "deposit": 300,
  "mileage": "900 kilometers included",
  "station": "Berlin Flughafen"
}
```

**Filter** — offers are filterable with expressions: `"electric"`, `"passengers>=5"`, `"groupType=SUV"`, `"priceTotal<=500"`, `"!hybrid"`. Multiple filters AND together. All 30+ offer fields are filterable.

**Protection pricing** — fetch insurance package costs (basic, smart, all-inclusive) with deductibles, so the agent can compare total cost of ownership, not just the base rate.

**Campaign codes** — apply partner discount codes that bundle insurance, extra driver, and unlimited km into the price. The agent can compare bundled vs. base+extras to find real savings.

**Member pricing** — authenticate via email OTP to get Platinum/Gold member rates. Discounts scale with car class: ~5% economy, ~10% mid-range, ~15% luxury.

**Booking links** — generate pre-filled Sixt booking URLs with station, dates, and campaign baked in. Hand the user a link they can click to book.

**Multi-country** — works across Sixt markets (DE, PT, ES, etc.) with localized currency and booking domains.

## Install

```bash
npx skills add TimBeyer/agent-skills --skill sixt-rental
```

Requires [Bun](https://bun.sh). Dependencies auto-install on first run — no setup needed.

## Scripts

| Script | What the agent gets |
|--------|-------------------|
| `sixt-search` | JSON array of offers with pricing, vehicle specs, powertrain, mileage, deposit, station |
| `sixt-stations` | JSON array of `{id, name}` for all stations matching a city query |
| `sixt-booking-url` | JSON with a pre-filled Sixt booking URL and metadata |
| `sixt-login` | Two-step email OTP flow → JWT token for member pricing |

All scripts output JSON to stdout. Pass `--table` for human-readable output. Run any script with `--help` for full usage.

## How it works

The scripts talk to Sixt's gRPC-web API (`grpc-prod.orange.sixt.com`). A city search resolves station IDs, then fetches offers from each station in parallel. No API key needed — the same endpoints that power sixt.de.

For internals — API flow, module architecture, and development setup — see [src/README.md](src/README.md).

## License

MIT
