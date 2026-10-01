# Hotel Offer Orchestrator

A small take-home style service built with Node.js, TypeScript, Express, Temporal, Redis and Docker Compose.

## What it does

- Calls two mock hotel suppliers in parallel through Temporal Activities.
- Deduplicates hotels by normalized hotel name.
- Keeps the cheaper offer when both suppliers return the same hotel.
- Stores the final list in a Redis Sorted Set using price as the score.
- Filters by `minPrice` and/or `maxPrice` directly in Redis.
- Includes a health endpoint for both mock suppliers.

## Run with Docker

```bash
docker compose up --build
```

API: `http://localhost:3000`

Temporal UI: `http://localhost:8080`

## Endpoints

```text
GET /api/hotels?city=delhi
GET /api/hotels?city=delhi&minPrice=5000&maxPrice=6000
GET /supplierA/hotels?city=delhi
GET /supplierB/hotels?city=delhi
GET /health
```

## Example

`GET /api/hotels?city=delhi`

```json
[
  { "name": "The Grand", "price": 4500, "supplier": "Supplier B", "commissionPct": 11 },
  { "name": "Holtin", "price": 5340, "supplier": "Supplier B", "commissionPct": 20 },
  { "name": "Radison", "price": 5900, "supplier": "Supplier A", "commissionPct": 13 },
  { "name": "Taj Palace", "price": 8500, "supplier": "Supplier A", "commissionPct": 15 }
]
```

## Redis design

Each city uses a sorted set named `hotels:<city>`. The score is the hotel price and the member is serialized JSON. Price ranges are queried with Redis sorted-set score ranges.

## Notes

The Docker Compose Temporal setup is intended for local development/take-home evaluation, not a production Temporal deployment. Docker image versions should be pinned before a real production release.

## Web UI

The project now includes a lightweight responsive UI served directly by Express.

Open:

```text
http://localhost:3000/
```

The UI supports city search, optional minimum/maximum price filters, hotel result cards, summary statistics, supplier health indicators, and a shortcut to Temporal UI. It calls the same `/api/hotels` and `/health` endpoints used by Postman/browser tests, so no separate frontend container is required.
