#!/usr/bin/env node
/**
 * SessionStart hook: load and display current project progress.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROGRESS_FILE = join(process.cwd(), '.session', 'progress.json');

if (!existsSync(PROGRESS_FILE)) {
  console.log('\n🌱 ZBNF Farming Assistant — No session progress found. Starting fresh.\n');
  process.exit(0);
}

try {
  const progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
  const completed = progress.completed || [];
  const current = progress.current || 'none';
  const notes = progress.notes || '';
  const updated = progress.last_updated
    ? new Date(progress.last_updated).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })
    : 'unknown';

  console.log(`
╔══════════════════════════════════════════╗
║   ZBNF Farming Assistant — Session State  ║
╚══════════════════════════════════════════╝

✅ Completed:  ${completed.length > 0 ? completed.join(', ') : 'none'}
🔧 Current:    ${current}
🕐 Updated:    ${updated} BDT
📝 Notes:      ${notes || '—'}
`);
} catch (err) {
  console.warn(`⚠️  Could not read session progress: ${err.message}`);
}

process.exit(0);
