# Sixt API Reference

Base URL: `https://grpc-prod.orange.sixt.com`
Protocol: JSON over gRPC-web (POST, Content-Type: application/json)
Auth: None required

## Endpoints

### 1. SuggestLocations

`/com.sixt.service.rent_booking.api.SearchService/SuggestLocations`

Search for rental stations by city or location name.

**Request:**
```json
{
  "query": "Berlin",
  "auto_complete_session_id": "<random-uuid>",
  "vehicle_type": "1",
  "user_profile_id": "",
  "location_purpose": 1,
  "include_fastlane": null
}
```

**Response:** `suggestions[]` array with:
- `location.title` — Station display name
- `location.is_sixt_branch` — Whether it's a Sixt-operated branch
- `location.branch.id` — Branch ID (used for SelectLocation)
- `location.branch.vehicle_types` — Available vehicle categories (`"PASSENGER"`, `"E_CARS"`)

### 2. SelectLocation

`/com.sixt.service.rent_booking.api.SearchService/SelectLocation`

Resolve a branch ID to a `location_selection_id` (required for offer queries).

**Request:**
```json
{
  "user_profile_id": "",
  "location_purpose": 1,
  "vehicle_type": 1,
  "auto_complete_session_id": "<random-uuid>",
  "location_id": "BRANCH:<branch-id>",
  "include_fastlane": null,
  "sim_card_country_code": "DE"
}
```

**Response:**
- `location_selection_id` — Ephemeral UUID, must be obtained fresh each session
- `selected_location.title` — Human-readable station name

### 3. GetOfferRecommendationsV2

`/com.sixt.service.rent_booking.api.BookingService/GetOfferRecommendationsV2`

Fetch available rental offers for a location and date range.

**Request:**
```json
{
  "offer_matrix_id": "<random-uuid>",
  "currency": "EUR",
  "trip_spec": {
    "pickup_datetime": { "value": "2026-04-01T10:00" },
    "pickup_location_selection_id": "<location-selection-id>",
    "return_location_selection_id": "<location-selection-id>",
    "point_of_sale": "DE",
    "return_datetime": { "value": "2026-04-03T18:00" },
    "vehicle_type": 10,
    "user_profile_id": "",
    "corporate_customer_number": "",
    "sim_card_country_code": "DE",
    "device_location_country_code": "DE",
    "campaign": ""
  },
  "enable_b2b_fallback": true
}
```

**Key response fields:**
- `offers[].offer_id` — Unique offer identifier
- `offers[].offer_matrix_id` — Matrix ID (needed for GetBookingForOffer)
- `offers[].car_info.title` — Car model name
- `offers[].car_info.subline` — Class description
- `offers[].car_info.is_electric` / `is_hybrid`
- `offers[].car_info.passengers_count` / `bags_count` / `doors_count`
- `offers[].car_info.transmission_type` — `"TRANSMISSION_TYPE_AUTOMATIC"` or `"TRANSMISSION_TYPE_MANUAL"`
- `offers[].car_info.guaranteed_model` — Whether exact model is guaranteed
- `offers[].car_info.example_make_model` — Example make/model text
- `offers[].price_per_day.gross.value` — Daily price
- `offers[].price_total.gross.value` — Total price
- `offers[].mileage_included_formatted` — Included mileage text

### 4. GetBookingForOffer

`/com.sixt.service.rent_booking.api.BookingService/GetBookingForOffer`

Fetch full booking details including protection packages for a specific offer.

**Request:**
```json
{
  "booking_id": "<random-uuid>",
  "offer_matrix_id": "<from-offer>",
  "offer_id": "<from-offer>",
  "currency": "EUR"
}
```

**Protection packages** at `booking.selected.available_add_ons.packages[]`:
- `description.name` / `description.additional_info.name` — Package name (e.g., "Smart Protection")
- `actual_price.gross.value` — Price per day
- `actual_total_price.gross.value` — Total protection price
- `damage_excess.value` — Damage deductible
- `theft_excess.value` — Theft deductible

## Offer output fields

The search script wraps the raw API response in a clean camelCase model. Every field below is available in the JSON output and as a `--filter` target.

### Vehicle identity

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `title` | string | `"VW Golf"` | Vehicle name |
| `subline` | string | `"Compact Limousine Automatic"` | Class description |
| `acriss` | string | `"CDAR"` | ACRISS code (brackets stripped) |
| `groupType` | string | `"SEDAN"`, `"SUV"`, `"VAN"`, `"CONVERTIBLE"`, `"STATION_WAGON"` | Body classification |
| `bodyStyle` | string | `"Limousine"`, `"SUV"`, `"Van"`, `"Cabrio"`, `"Kombi"` | Localized body label |
| `guaranteed` | boolean | `false` | Whether exact model is guaranteed (vs. Glücksauto surprise) |
| `examples` | string[] | `["VW Golf", "Opel Astra"]` | Example make/model alternatives |
| `imageUrl` | string | `"https://..."` | Vehicle image URL (medium size) |

### Vehicle specs

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `passengers` | number | `5` | Passenger capacity |
| `bags` | number | `3` | Total bag count |
| `largeBags` | number | `2` | Large suitcase slots |
| `smallBags` | number | `1` | Small bag slots |
| `doors` | number | `5` | Door count |
| `automatic` | boolean | `true` | Automatic transmission |
| `navIncluded` | boolean | `false` | Built-in navigation |

### Powertrain

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `electric` | boolean | `true` | Electric vehicle |
| `hybrid` | boolean | `false` | Hybrid vehicle |
| `luxury` | boolean | `false` | Luxury class |
| `range` | number \| null | `306` | EV range in km (null for non-EVs) |
| `chargingCable` | string | `"Type 2 and domestic cables"` | Charging cable info (empty for non-EVs) |

### Driver requirements

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `minAge` | number | `18` | Minimum driver age |
| `youngDriverFee` | boolean | `false` | Whether young driver surcharge applies |

### Pricing

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `priceDay` | number | `80.32` | Gross price per day |
| `priceTotal` | number | `240.95` | Gross total price |
| `deposit` | number | `300` | Required deposit |
| `mileage` | string | `"900 kilometers included"` | Included mileage text |
| `extraKmPrice` | number \| null | `0.35` | Cost per extra km beyond included |
| `unlimitedKmAvailable` | boolean | `true` | Whether unlimited-km plan exists |
| `unlimitedKmPriceTotal` | number \| null | `252.95` | Total price with unlimited km |

### Presentation

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `rentalDays` | number | `3` | Calculated rental duration in days |
| `promoLabel` | string | `"Frühbucher Special"` | Promotional label (empty if none) |

### Station

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `station` | string | `"Berlin Flughafen"` | Resolved station name |
| `stationId` | string | `"8"` | Branch ID |

### Filter syntax

Use `--filter` to filter offers before output. Multiple filters are AND'd.

| Syntax | Meaning | Example |
|--------|---------|---------|
| `field` | Boolean true | `--filter "electric"` |
| `!field` | Boolean false | `--filter "!hybrid"` |
| `field=value` | String equality (case-insensitive) | `--filter "groupType=SUV"` |
| `field!=value` | String inequality | `--filter "bodyStyle!=Van"` |
| `field>=N` | Numeric >= | `--filter "passengers>=5"` |
| `field<=N` | Numeric <= | `--filter "priceTotal<=500"` |
| `field>N` | Numeric > | `--filter "range>300"` |
| `field<N` | Numeric < | `--filter "minAge<25"` |

## Notes

- `offer_matrix_id` can be any random UUID — server generates a new matrix per request
- `location_selection_id` is ephemeral and must be obtained fresh via SelectLocation
- `vehicle_type: 10` = passenger cars; `vehicle_type: 1` also works for location search
- The `campaign` field in `trip_spec` activates partner rates (discovered via browser interception of partner page flows)
- No rate limiting observed, but be respectful
- Prices vary significantly by station — always compare multiple
