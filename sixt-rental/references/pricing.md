# Pricing Insights

## Station Pricing Patterns

- **Airport stations** have flat pricing regardless of day of week (leisure demand) — best for multi-day or mid-week rentals
- **City stations** offer cheap weekend (Fri–Mon) rates due to low business demand, but prices spike when the rental includes a weekday (business inventory pricing)
- **BER airport is cheapest** for Berlin rentals that include weekdays (e.g., Thu–Mon), but NOT always for pure weekend (Fri–Mon) rentals

**Rule of thumb:** always compare both airport and city stations. The cheapest option depends on the day mix.

## Dynamic Pricing

- Prices can jump 20–75% in 2 days near holidays
- Weekend rates at city stations can be significantly lower than weekday rates for the same car class
- Airport stations show less volatility since their demand is primarily leisure travelers

## Campaign Codes

Partner campaign codes unlock discounted or bundled rates via the `campaign` field in the API. These were discovered by reverse-engineering partner landing pages (`sixt.de/partners/...`).

| Code | What's Included | Best For |
|------|----------------|----------|
| `partner-Travelsales_wdmobility_Holiday` | Zero deductible, extra driver, unlimited km, free cancellation | International trips (prices look higher but include everything) |
| `partner-wdmobility_public_special` | Discounted base rate (extras bookable separately) | Domestic trips where you pick your own insurance |

### Comparing Campaign vs Public Rates

**Holiday rate** prices include all insurance/extras baked in. To compare fairly:
1. Search with `--campaign "partner-Travelsales_wdmobility_Holiday"` for the all-inclusive price
2. Search without campaign + `--protection smart` for public base + protection
3. Compare totals — the Holiday rate often wins for international trips

## Protection Levels

| Level | Typical Coverage |
|-------|-----------------|
| Basic | Reduced deductible for damage/theft |
| Smart | Lower deductible, glass/tire coverage |
| All Inclusive | Zero deductible, extra driver, full coverage |

Protection pricing varies per car class — a compact's Smart protection costs less than an SUV's. The search script fetches protection only for the cheapest offers by default (`--limit 5`) to avoid slow API round-trips.
