# sixt-rental

Give your AI agent the ability to search Sixt rental cars — across every station in a city, all at once.

```
You:   "I need a car in Berlin next weekend. Something electric, under €100/day."

Agent:  Found 4 electric cars at Berlin Flughafen:

        Citroen e-C3              €66.65/day   326 km range
        Citroen e-C3 Aircross    €84.32/day   400 km range
        Skoda Elroq             €111.99/day   360 km range

        Want me to check other Berlin stations too, or generate a booking link?
```

## Why this skill

**Your agent searches like you can't.** On sixt.de you pick one station and scroll through results. This skill searches every station in a city simultaneously and compares prices side by side. Berlin has 15 Sixt stations — the price difference between airport and city center can be 30-40% for the same car.

**It knows about discounts you don't.** Built-in partner campaign codes bundle zero-deductible insurance, extra driver, unlimited kilometers, and free cancellation into the price. Your agent can compare the all-inclusive deal against the public rate plus add-on insurance to show you which actually costs less.

**It filters by what you actually care about.** Need 5+ seats with room for luggage? Only electric cars with 300+ km range? SUVs under €150/day? Automatic only? The agent narrows results down instead of making you scroll.

**It handles the insurance question.** Rental car insurance is confusing. The skill can fetch exact protection pricing — basic, smart, or all-inclusive — so your agent can compare total cost, not just the sticker price.

## What your agent can do with it

| Capability | Example |
|---|---|
| **Search a city** | "Find rental cars in Lisbon for May 16-30" |
| **Filter results** | "Only SUVs with 5+ passengers and automatic" |
| **Compare stations** | "Which Berlin station has the cheapest compact?" |
| **Find electric cars** | "Electric cars with at least 300km range" |
| **Apply discounts** | "Check the Holiday rate vs public price" |
| **Get member pricing** | "Log in to my Sixt account for Platinum rates" |
| **Generate booking links** | "Give me a link to book that VW Golf" |
| **Multi-country** | Works across Sixt markets — Germany, Portugal, Spain, and more |

## Install

```bash
npx skills add TimBeyer/agent-skills --skill sixt-rental
```

Requires [Bun](https://bun.sh). Dependencies install automatically on first run.

---

<details>
<summary><strong>For contributors</strong></summary>

TypeScript + Bun. Four scripts behind shell wrappers in `scripts/`. Shared library in `src/lib/` talks to Sixt's gRPC-web API. 65 tests.

See [src/README.md](src/README.md) for architecture, API flow, and development setup.

</details>

## License

MIT
