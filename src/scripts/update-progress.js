/* eslint-disable no-console */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');
const PROGRESS_FILE = join(PROJECT_ROOT, '.session', 'progress.json');

const args = process.argv.slice(2);

// Robust argument parsing
const getArgValue = (prefix) => {
  const arg = args.find((a) => a.startsWith(prefix));
  if (!arg) return null;
  const parts = arg.split('=');
  return parts.slice(1).join('=');
};

const completedArgs = args.filter((a) => a.startsWith('--completed=')).map((a) => a.split('=')[1]);
const currentArg = getArgValue('--current=');
const noteArg = getArgValue('--note=');

mkdirSync(join(PROJECT_ROOT, '.session'), { recursive: true });

let progress = { completed: [], current: 'P0', notes: [] };
try {
  progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
} catch {
  // File might not exist or be invalid, using default progress
}

// Ensure notes is an array
if (!Array.isArray(progress.notes)) {
  progress.notes =
    typeof progress.notes === 'string'
      ? [{ ts: progress.last_updated || new Date().toISOString(), note: progress.notes }]
      : [];
}

completedArgs.forEach((c) => {
  if (!progress.completed.includes(c)) {
    progress.completed.push(c);
  }
});

if (currentArg) {
  progress.current = currentArg;
}

if (noteArg) {
  progress.notes.push({ ts: new Date().toISOString(), note: noteArg });
}
progress.last_updated = new Date().toISOString();

writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2) + '\n');
console.log('Progress saved:', progress);
