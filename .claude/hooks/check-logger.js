#!/usr/bin/env node
/**
 * Post-tool-use hook: warn if a new Node.js file with side effects
 * is missing a logger import.
 * Exits 0 always (warn only).
 */

import { readFileSync, existsSync } from 'fs';

const filePath = process.env.CLAUDE_TOOL_INPUT_PATH || '';
if (!filePath || !existsSync(filePath)) process.exit(0);

// Only check JS files (not test files, not config files)
if (!/\.(js|mjs|cjs)$/.test(filePath)) process.exit(0);
if (/\.(test|spec)\.|\.config\.|eslint|prettier|\.claude/.test(filePath)) process.exit(0);

const content = readFileSync(filePath, 'utf8');

// Files with side effects — check for logger
const HAS_SIDE_EFFECTS = /\b(bot\.|db\.|fetch\(|cron|sendMessage|telegram|mqtt|supabase)\b/i.test(content);
if (!HAS_SIDE_EFFECTS) process.exit(0);

// Check for any logger import (Winston, loglevel, structlog reference)
const HAS_LOGGER = /import\s+logger\s+from|import\s+log\s+from\s+'loglevel'|from\s+'winston'/.test(content);

if (!HAS_LOGGER) {
  console.warn(
    `\n⚠️  WARNING: ${filePath} has side effects but no logger import.\n` +
    `Node.js files with bot/DB/fetch/MQTT operations must import Winston logger:\n` +
    `  import logger from '../config/logger.js';\n` +
    `\nSee templates/logger.js for the canonical logger config.\n`
  );
}

process.exit(0);
