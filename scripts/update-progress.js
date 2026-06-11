#!/usr/bin/env node
/**
 * scripts/update-progress.js
 * Read/write .session/progress.json to track implementation progress.
 *
 * Usage:
 *   node scripts/update-progress.js                    — print current status
 *   node scripts/update-progress.js --completed P0     — mark P0 complete
 *   node scripts/update-progress.js --current P1       — set current task
 *   node scripts/update-progress.js --note "message"   — add a note
 *   node scripts/update-progress.js --auto             — auto-save on Stop hook
 *
 * Called automatically by .claude/hooks/hooks.json Stop event.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SESSION_DIR  = join(process.cwd(), '.session');
const PROGRESS_FILE = join(SESSION_DIR, 'progress.json');

function loadProgress() {
  if (!existsSync(PROGRESS_FILE)) {
    return {
      completed: [],
      current: '',
      last_updated: new Date().toISOString(),
      notes: '',
    };
  }
  try {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
  } catch {
    console.error('⚠️  progress.json is malformed — resetting to defaults.');
    return { completed: [], current: '', last_updated: new Date().toISOString(), notes: '' };
  }
}

function saveProgress(progress) {
  mkdirSync(SESSION_DIR, { recursive: true });
  progress.last_updated = new Date().toISOString();
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2) + '\n', 'utf8');
}

function printStatus(progress) {
  console.log(`
╔══════════════════════════════════════════╗
║   ZBNF Project Progress                  ║
╚══════════════════════════════════════════╝

Completed: ${progress.completed.length > 0 ? progress.completed.join(', ') : 'none'}
Current:   ${progress.current || 'not set'}
Updated:   ${new Date(progress.last_updated).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })} BDT
Notes:     ${progress.notes || '—'}
`);
}

// Parse CLI arguments
const args = process.argv.slice(2);
const progress = loadProgress();

if (args.length === 0) {
  printStatus(progress);
  process.exit(0);
}

if (args.includes('--auto')) {
  // Auto-save from Stop hook — just update timestamp, no other changes
  saveProgress(progress);
  process.exit(0);
}

let changed = false;

// --completed [feature]
const completedIdx = args.indexOf('--completed');
if (completedIdx !== -1) {
  const item = args[completedIdx + 1];
  if (!item) {
    console.error(`❌ Please specify a feature or module name after --completed.`);
    process.exit(1);
  }
  if (!progress.completed.includes(item)) {
    progress.completed.push(item);
    progress.completed.sort();
    console.log(`✅ Marked "${item}" as complete.`);
    changed = true;
  } else {
    console.log(`ℹ️  "${item}" was already marked complete.`);
  }
}

// --current [feature]
const currentIdx = args.indexOf('--current');
if (currentIdx !== -1) {
  const item = args[currentIdx + 1];
  if (!item) {
    console.error(`❌ Please specify a feature or module name after --current.`);
    process.exit(1);
  }
  progress.current = item;
  console.log(`🔧 Set current task/feature to "${item}".`);
  changed = true;
}

// --note "message"
const noteIdx = args.indexOf('--note');
if (noteIdx !== -1) {
  const note = args[noteIdx + 1];
  if (!note) {
    console.error('❌ --note requires a message argument.');
    process.exit(1);
  }
  progress.notes = note;
  console.log(`📝 Note saved: ${note}`);
  changed = true;
}

if (changed) {
  saveProgress(progress);
  printStatus(progress);
} else {
  console.log('ℹ️  No changes made.');
  printStatus(progress);
}

