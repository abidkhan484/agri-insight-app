---
name: security-review
description: Directs security audits covering secrets, input validation, SQL injection prevention, Row-Level Security (RLS) configuration, Winston logger compliance, and Bangla UI validation.
triggers:
  - security review
  - security audit
  - check security
  - review code security
---

# Security Review Checklist & Best Practices

This skill outlines mandatory security protocols for the ZBNF Farming Assistant to ensure farmer privacy and platform resilience.

---

## 1. Secrets & Configurations

*   ❌ **NEVER Hardcode Secrets**: Do not write `BOT_TOKEN`, Supabase service keys, API passwords, or tokens in your source code.
*   ✅ **Reference `.env`**: Always load configurations from environment variables.

```js
// config/index.js
import dotenv from 'dotenv';
dotenv.config();

export const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('FATAL: BOT_TOKEN is missing in the environment');
}
```

*   **Verification**:
    - [ ] `.env` is listed inside `.gitignore` and never committed.
    - [ ] The model scans all modifications for token strings prior to staging.

---

## 2. Parameterized Queries (No SQL Injection)

*   ❌ **NEVER Concatenate SQL**: Do not interpolate user inputs directly inside query strings.
*   ✅ **Use Parameterized SQL or DB abstraction Layer (`dbService`)**:

```js
// ❌ DANGEROUS
const query = `SELECT * FROM plots WHERE farmer_id = '${farmerInput}'`;

// ✅ SAFE (Parameterized better-sqlite3)
const stmt = db.prepare('SELECT * FROM plots WHERE farmer_id = ?');
const results = stmt.all(farmerInput);

// ✅ SAFE (Supabase SDK client abstraction)
const { data, error } = await dbService
  .from('plots')
  .select('*')
  .eq('farmer_id', farmerInput);
```

---

## 3. Row-Level Security (RLS) in Supabase

Every table added to Supabase database (`schema.sql`) **must** enforce RLS to ensure farmers can only access their own plots, schedules, and yields.

```sql
-- schema.sql
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can only read their own plots"
  ON plots FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can only write their own plots"
  ON plots FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);
```

---

## 4. Winston/Loglevel Logging (No PII Leakage)

*   ❌ **NEVER Log Raw PII**: Do not output raw farmer telephone numbers, home addresses, or Telegram IDs in raw JSON format to log files.
*   ✅ **Label Context Correctly**: Redact or tag context in logs.

```js
// ❌ WRONG: console.log leaks telegram data
console.log('Registered user', telegramUser);

// ✅ CORRECT: Winston logger with tag-redaction
logger.info('Plot registered successfully', {
  plotId: plot.id,
  ctx: 'farmer:' + telegramUser.id // Tagged instead of dumping raw profile object
});
```

---

## 5. Security Unit Tests

Write assertions ensuring protected operations are shielded behind proper authentication/authorization gates:

```js
// __tests__/auth.test.js
import { describe, it, expect } from 'vitest';
import { getFarmerProfile } from '../services/dbService.js';

describe('Profile Access Authorization', () => {
  it('should deny profile retrieval for unregistered IDs', async () => {
    const unregisteredId = 'unknown-telegram-id';
    await expect(getFarmerProfile(unregisteredId)).rejects.toThrow(/Unauthorized/);
  });
});
```
