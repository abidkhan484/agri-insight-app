# Community Farmer Network Codemap (P8)

**Last Updated:** 2025-05-23
**Entry Points:** 
- Bot: `src/bot/community.js`
- Map: `map-pwa/src/main.jsx`

## Architecture

```
Farmer A (Bot) ──▶ SQLite ──▶ Supabase (Pest Alerts) ──▶ Farmer B (Map/Bot)
                                      ▲
                                      │
Farmer C (Map) ──▶ Leaflet UI ──▶ Supabase (Cow Registry)
```

## Key Modules

| Module | Purpose | Location | Dependencies |
|--------|---------|----------|--------------|
| `FAQ Handler` | Keyword-based recipe responses | `src/bot/faq.js` | `data/faq.json` |
| `Pest Reporter` | Community-driven alert broadcasts | `src/bot/pest-report.js` | `Supabase Client`, `SQLite` |
| `Cow Registry` | Peer-to-peer organic input directory | `src/bot/cow-registry.js` | `Supabase Client` |
| `Farmer Map` | Visual map of ZBNF farms | `map-pwa/src/FarmerMap.jsx` | `Leaflet`, `Supabase Client` |

## Data Flow

### Community Pest Alert
1. Farmer reports pest via `/reportpest` in Telegram Bot.
2. Bot logs alert to Supabase `pest_alerts` table.
3. Bot queries SQLite for farmers in the same Upazila.
4. Bot broadcasts Telegram message to all relevant farmers with treatment advice.

### Farmer Map Visualization
1. `map-pwa` fetches farm locations and attributes from Supabase `farmers_map`.
2. Map filters results based on user selected crops or ZBNF methods.
3. User pins are rendered using Leaflet markers with custom icons.

## External Dependencies

- **Supabase** - PostgreSQL database with PostGIS for location storage.
- **Leaflet.js** - Open-source library for interactive maps.
- **OpenStreetMap** - Map tiles provider.

## Related Areas

- [Shared Foundation](../architecture.md) - Database connection strings and bot setup.
- [P1 — Farm Scheduler](./p1-scheduler.md) - Plot location data used for mapping.
- [P6 — ZBNF Knowledge](./p6-zbnf-knowledge.md) - Recipe data for FAQ responses.
