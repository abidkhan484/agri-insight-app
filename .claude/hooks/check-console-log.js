#!/usr/bin/env node
/**
 * Post-tool-use hook: warn if console.log appears in a JS/TS file.
 * Reads filename from CLAUDE_TOOL_INPUT_PATH env var (set by Claude Code).
 * Exits 0 always (warn only — never blocks).
 */

import { readFileSync, existsSync } from 'fs';

const filePath = process.env.CLAUDE_TOOL_INPUT_PATH || '';
if (!filePath || !existsSync(filePath)) process.exit(0);

// Only check JS/TS files
if (!/\.(js|mjs|cjs|ts|tsx|jsx)$/.test(filePath)) process.exit(0);

const content = readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const violations = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Skip actual comment lines and test files
  if (/^\s*\/\//.test(line)) continue;
  if (/\.test\.|\.spec\./.test(filePath)) continue;
  if (/console\.log\s*\(/.test(line)) {
    violations.push({ line: i + 1, text: line.trim() });
  }
}

if (violations.length > 0) {
  console.warn(
    `\n⚠️  WARNING: console.log found in ${filePath}\n` +
    violations.map((v) => `  Line ${v.line}: ${v.text}`).join('\n') +
    `\n\nUse the Winston logger (import logger from '../config/logger.js') instead.\n` +
    `ESLint will block this before commit.\n`
  );
}

process.exit(0);
