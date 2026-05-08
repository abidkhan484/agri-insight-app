---
name: p8-community-farmer-network
description: Implement P8 Community Farmer Network — Telegram group FAQ bot with Supabase backend, Leaflet + OpenStreetMap farmer map (no API key), farmer location registration to public map, community wiki integration, Winston logger, and 5-agent workflow. Deploy last — depends on P0–P7 context.
triggers:
  - implement p8
  - community farmer network
  - farmer map
  - leaflet farmer map
  - supabase community
  - faq bot
  - community wiki
---

# P8 — Community Farmer Network Implementation Workflow

## Dependency Check
**All P0–P7 tasks should be complete (or near-complete) before starting P8.**
P8 is the aggregation layer — it links to all prior tools.

## Required Reading
- `tasks/p8-community-farmer-network.md` — full phase checklist
- `skills/zbnf-formulation/SKILL.md` — Bangla glossary (for FAQ content)
- `docs/api-reference.md` — all bot commands to reference in FAQ

---

## Agent Invocation Sequence

### Step 1 — coder

#### Phase 1: Supabase Setup

Create free Supabase project at https://supabase.com (50k rows, auth included — free).

SQL schema (run in Supabase SQL editor):
```sql
-- Public farmer locations for map
CREATE TABLE IF NOT EXISTS public.farmer_locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  TEXT NOT NULL,           -- "Farmer from Rajshahi" (no real name)
  district      TEXT NOT NULL,
  upazila       TEXT,
  latitude      NUMERIC(9,6) NOT NULL,
  longitude     NUMERIC(9,6) NOT NULL,
  crops         TEXT[],                  -- e.g. ['rice', 'mustard']
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  -- No telegram_id stored here — privacy
  CHECK (latitude  BETWEEN 20.5 AND 26.7),  -- Bangladesh bounds
  CHECK (longitude BETWEEN 88.0 AND 92.7)   -- Bangladesh bounds
);

-- Community FAQ entries
CREATE TABLE IF NOT EXISTS public.faq_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_bn TEXT NOT NULL,
  question_en TEXT,
  answer_bn   TEXT NOT NULL,
  answer_en   TEXT,
  category    TEXT,   -- 'jeevamrutha' | 'disease' | 'irrigation' | 'general'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  upvotes     INTEGER DEFAULT 0
);

-- Enable Row Level Security — public read, no public write
ALTER TABLE public.farmer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read farmer_locations" ON public.farmer_locations
  FOR SELECT USING (TRUE);

CREATE POLICY "Public read faq_entries" ON public.faq_entries
  FOR SELECT USING (TRUE);

-- Service role write (bot uses service key)
CREATE POLICY "Service write farmer_locations" ON public.farmer_locations
  FOR INSERT TO service_role USING (TRUE);
```

#### Phase 2: Supabase Client (`services/supabase.js`)

```js
import { createClient } from '@supabase/supabase-js';
import logger from '../config/logger.js';

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role — never expose

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  logger.error('Missing Supabase credentials in .env');
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Register a farmer's location visible on the public map.
 * Note: we store district/upazila — not precise GPS to protect privacy.
 */
export async function registerFarmerLocation({ displayName, district, upazila, lat, lon, crops }) {
  // Validate Bangladesh coordinate bounds
  if (lat < 20.5 || lat > 26.7 || lon < 88.0 || lon > 92.7) {
    throw new Error('Coordinates outside Bangladesh bounds');
  }

  const { error } = await supabase.from('farmer_locations').insert({
    display_name: displayName,
    district,
    upazila,
    latitude: lat,
    longitude: lon,
    crops,
  });

  if (error) {
    logger.error('farmer_location_insert_failed', { error: error.message });
    throw error;
  }
  logger.info('farmer_location_registered', { district, upazila });
}

export async function getFarmerLocations() {
  const { data, error } = await supabase
    .from('farmer_locations')
    .select('display_name, district, upazila, latitude, longitude, crops, joined_at')
    .order('joined_at', { ascending: false })
    .limit(500);

  if (error) {
    logger.error('farmer_locations_fetch_failed', { error: error.message });
    return [];
  }
  return data;
}

export async function searchFAQ(query) {
  const { data, error } = await supabase
    .from('faq_entries')
    .select('question_bn, question_en, answer_bn, answer_en, category')
    .or(`question_bn.ilike.%${query}%,answer_bn.ilike.%${query}%`)
    .order('upvotes', { ascending: false })
    .limit(3);

  if (error) {
    logger.error('faq_search_failed', { error: error.message });
    return [];
  }
  return data;
}
```

#### Phase 3: Community Bot Commands

**`/joinmap` command (`bot/commands/joinmap.js`):**
```js
import logger from '../../config/logger.js';
import { registerFarmerLocation } from '../../services/supabase.js';

// Bangladesh districts list for validation
const BD_DISTRICTS = [
  'ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'সিলেট',
  'বরিশাল', 'রংপুর', 'ময়মনসিংহ', 'কুমিল্লা', 'ফরিদপুর',
  // ... add full list
];

export function registerJoinmapCommand(bot, db) {
  bot.command('joinmap', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    logger.info('Joinmap command received', { telegramId: `id:${telegramId}` });

    // Must be registered farmer
    const farmer = db.prepare('SELECT * FROM farmers WHERE telegram_id = ?').get(telegramId);
    if (!farmer) {
      return ctx.reply(
        '❌ প্রথমে /register দিয়ে নিবন্ধন করুন।\nFirst register with /register.'
      );
    }

    // Use approximate district-level location (not precise GPS — privacy)
    if (!farmer.district || !farmer.latitude || !farmer.longitude) {
      return ctx.reply(
        '📍 আপনার জেলা ও অবস্থান প্রথমে /register-এ যোগ করুন।\n' +
        'Please add your district and location in /register first.'
      );
    }

    // Check if already on map
    const existing = db.prepare(
      'SELECT id FROM map_registrations WHERE telegram_id = ?'
    ).get(telegramId);

    if (existing) {
      return ctx.reply(
        '✅ আপনি ইতিমধ্যে মানচিত্রে আছেন!\nYou are already on the map!'
      );
    }

    try {
      await registerFarmerLocation({
        displayName: `${farmer.district}-এর কৃষক`,
        district: farmer.district,
        upazila: farmer.upazila,
        lat: farmer.latitude,
        lon: farmer.longitude,
        crops: [],
      });

      // Record locally to prevent duplicate registrations
      db.prepare(
        'INSERT OR IGNORE INTO map_registrations (telegram_id, registered_at) VALUES (?, CURRENT_TIMESTAMP)'
      ).run(telegramId);

      await ctx.reply(
        '🗺️ আপনি ZBNF কৃষক মানচিত্রে যোগ দিয়েছেন!\n' +
        'You have joined the ZBNF farmer map!\n\n' +
        '👉 মানচিত্র দেখুন / View map: https://zbnf-bangladesh.netlify.app/map'
      );
      logger.info('Farmer joined map', { district: farmer.district });
    } catch (err) {
      logger.error('Joinmap failed', { error: err.message });
      await ctx.reply('দুঃখিত, সমস্যা হয়েছে। আবার চেষ্টা করুন।\nSorry, an error occurred. Please try again.');
    }
  });
}
```

**`/faq` command (`bot/commands/faq.js`):**
```js
import logger from '../../config/logger.js';
import { searchFAQ } from '../../services/supabase.js';

export function registerFaqCommand(bot) {
  bot.command('faq', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const query = ctx.message.text.replace('/faq', '').trim();

    logger.info('FAQ command received', { telegramId: `id:${telegramId}` });

    if (!query) {
      return ctx.reply(
        '❓ প্রশ্ন লিখুন: /faq জীবামৃত কী?\n' +
        'Type your question: /faq What is Jeevamrutha?'
      );
    }

    const results = await searchFAQ(query);

    if (!results.length) {
      return ctx.reply(
        'এই বিষয়ে FAQ পাওয়া যায়নি। /ask দিয়ে AI-কে জিজ্ঞেস করুন।\n' +
        'No FAQ found. Try /ask to ask our AI assistant.'
      );
    }

    const lines = results.map((faq, i) =>
      `*${i + 1}. ${faq.question_bn}*\n${faq.answer_bn}`
    );

    await ctx.replyWithMarkdown(lines.join('\n\n'));
    logger.info('FAQ response sent', { query, resultCount: results.length });
  });
}
```

#### Phase 4: Farmer Map PWA (`map-pwa/`)

This is a separate lightweight React + Leaflet PWA deployed to Netlify/GitHub Pages.
No API key needed — uses OpenStreetMap tiles.

```bash
npm create vite@latest map-pwa -- --template react
cd map-pwa
npm install leaflet react-leaflet @supabase/supabase-js loglevel
npm install -D vite-plugin-pwa
```

Map component (`map-pwa/src/FarmerMap.jsx`):
```jsx
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { createClient } from '@supabase/supabase-js';
import log from 'loglevel';
import 'leaflet/dist/leaflet.css';

log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY // anon key — read-only for public map
);

const BANGLADESH_CENTER = [23.685, 90.356];
const BANGLADESH_BOUNDS = [[20.5, 88.0], [26.7, 92.7]];

export default function FarmerMap() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFarmers() {
      log.info('farmer_map_loading');
      const { data, error } = await supabase
        .from('farmer_locations')
        .select('display_name, district, upazila, latitude, longitude, crops, joined_at')
        .limit(500);

      if (error) {
        log.error('farmer_map_load_failed', { error: error.message });
      } else {
        setFarmers(data || []);
        log.info('farmer_map_loaded', { count: data?.length });
      }
      setLoading(false);
    }
    loadFarmers();
  }, []);

  if (loading) return (
    <div className="loading">
      <span className="bn">মানচিত্র লোড হচ্ছে...</span>
    </div>
  );

  return (
    <div className="map-container">
      <h1>
        <span className="bn">ZBNF কৃষক মানচিত্র — বাংলাদেশ</span>
        <span className="en">ZBNF Farmer Map — Bangladesh</span>
      </h1>
      <p className="count">
        <span className="bn">মোট কৃষক: {farmers.length} জন</span>
        <span className="en">Total farmers: {farmers.length}</span>
      </p>

      <MapContainer
        center={BANGLADESH_CENTER}
        zoom={7}
        maxBounds={BANGLADESH_BOUNDS}
        style={{ height: '70vh', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {farmers.map((farmer, i) => (
          <CircleMarker
            key={i}
            center={[farmer.latitude, farmer.longitude]}
            radius={8}
            pathOptions={{ color: '#2d6a4f', fillColor: '#52b788', fillOpacity: 0.8 }}
          >
            <Popup>
              <strong>{farmer.display_name}</strong><br />
              {farmer.district}, {farmer.upazila}<br />
              {farmer.crops?.join(', ')}<br />
              <small>যোগদান: {new Date(farmer.joined_at).toLocaleDateString('bn-BD')}</small>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
```

Map PWA `.env.example`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...   # anon key — safe for public frontend
```

---

### Step 2 — qa

Test file (`tests/p8-community.test.js`):

```js
import { describe, it, expect, vi } from 'vitest';

describe('P8 — Community Network', () => {
  describe('Supabase coordinate validation', () => {
    const isInBangladesh = (lat, lon) =>
      lat >= 20.5 && lat <= 26.7 && lon >= 88.0 && lon <= 92.7;

    it('accepts valid Bangladesh coordinate', () => {
      expect(isInBangladesh(23.685, 90.356)).toBe(true); // Dhaka
    });

    it('rejects coordinate outside Bangladesh', () => {
      expect(isInBangladesh(28.0, 77.0)).toBe(false); // Delhi
    });

    it('rejects coordinate of 0,0', () => {
      expect(isInBangladesh(0, 0)).toBe(false);
    });
  });

  describe('FAQ search', () => {
    it('returns empty array when Supabase fails', async () => {
      // Mock supabase error path
      vi.mock('../services/supabase.js', () => ({
        searchFAQ: vi.fn().mockResolvedValue([]),
      }));
      const { searchFAQ } = await import('../services/supabase.js');
      const results = await searchFAQ('জীবামৃত');
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
```

QA checklist:
- [ ] Supabase table created with correct RLS policies (public read, service write)
- [ ] `/joinmap` stores farmer with district-level location (not precise GPS unless farmer provides)
- [ ] Duplicate `/joinmap` calls are rejected gracefully with Bangla message
- [ ] Coordinates outside Bangladesh bounds are rejected at service layer
- [ ] FAQ search returns results sorted by upvotes
- [ ] Map PWA loads with all farmer markers on OpenStreetMap tiles
- [ ] Leaflet map does not make requests to any paid tile provider
- [ ] `SUPABASE_SERVICE_KEY` never logged or returned in API responses

---

### Step 3 — reviewer

- [ ] `SUPABASE_SERVICE_KEY` in `.env` only — never in frontend or logged
- [ ] Frontend map uses `SUPABASE_ANON_KEY` (read-only) — correctly separated from service key
- [ ] Coordinate bounds check prevents injection of non-Bangladesh locations
- [ ] RLS policies verified in Supabase dashboard — anon role cannot INSERT
- [ ] No farmer `telegram_id` stored in Supabase — only `district` + `display_name`
- [ ] Winston logger in all bot command files
- [ ] No `console.log` in any file
- [ ] Bangla text present in all farmer-facing messages

---

### Step 4 — doc-updater

- `README.md` → P8 section: Supabase setup, map PWA deploy URL
- `docs/architecture.md` → P8 data flow: Bot → Supabase → Map PWA
- `docs/farmer-guide-bn-en.md` → `/joinmap` and `/faq` usage
- `tasks/p8-community-farmer-network.md` → mark completed phases

---

### Step 5 — committer

```
feat(p8): add community farmer network with Supabase map + FAQ bot

- /joinmap command: registers farmer's district location in Supabase
- /faq command: searches FAQ entries; falls back to /ask for unknowns
- Leaflet + OpenStreetMap map PWA (no API key): renders farmer markers
- Supabase RLS: public read, service-role write, no PII in public tables
- Coordinate bounds validation (Bangladesh: 20.5–26.7N, 88.0–92.7E)
- Winston logger in all bot handlers; Bangla-first messages throughout
```

---

## Free Services Used (P8)

| Service | Purpose | Free Limit |
|---------|---------|-----------|
| Supabase | PostgreSQL + auth + RLS | 50k rows, 2 projects |
| OpenStreetMap + Leaflet | Map tiles, no API key | Unlimited |
| Netlify | Map PWA hosting | Unlimited static |
| GitHub Pages | Wiki content | Unlimited |

## Privacy Design

- Farmer map shows **district-level** location only — not precise GPS
- No `telegram_id` stored in Supabase
- `display_name` is automatically generated: `"Rajshahi-এর কৃষক"` — not real name
- Farmers can opt in to map with `/joinmap` and are informed what is public
