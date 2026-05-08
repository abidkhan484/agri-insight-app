#!/usr/bin/env node
/**
 * Post-tool-use hook: warn if a farmer-facing file lacks Bangla Unicode text.
 * Farmer-facing files: bot/commands/, bot/messages/, any file with sendMessage/ctx.reply.
 * Exits 0 always (warn only).
 */

import { readFileSync, existsSync } from 'fs';

const filePath = process.env.CLAUDE_TOOL_INPUT_PATH || '';
if (!filePath || !existsSync(filePath)) process.exit(0);

// Only check JS files
if (!/\.(js|mjs|cjs|jsx)$/.test(filePath)) process.exit(0);

const content = readFileSync(filePath, 'utf8');

// Farmer-facing: files that call Telegram send methods
const IS_FARMER_FACING = /ctx\.reply|sendMessage|replyWithMarkdown|bot\.telegram/.test(content);
if (!IS_FARMER_FACING) process.exit(0);

// Check for Bangla Unicode range (U+0980–U+09FF)
const HAS_BANGLA = /[\u0980-\u09FF]/.test(content);

if (!HAS_BANGLA) {
  console.warn(
    `\n⚠️  WARNING: ${filePath} sends Telegram messages but contains no Bangla text.\n` +
    `All farmer-facing Telegram messages must have Bangla (primary) + English (secondary).\n` +
    `Example: ctx.reply('জীবামৃত প্রয়োগের সময় হয়েছে\\nJeevamrutha application due')\n` +
    `\nSee CLAUDE.md → 'Bangla UI Requirements' section.\n`
  );
}

process.exit(0);
