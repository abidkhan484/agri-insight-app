#!/usr/bin/env node
/**
 * Pre-tool-use hook: block writes containing hardcoded secrets.
 * Reads the file content from stdin (piped by Claude Code hook system).
 * Exits 1 (block) if a secret pattern is found.
 */

import { readFileSync } from 'fs';

const SECRET_PATTERNS = [
  /BOT_TOKEN\s*=\s*['"][0-9]{8,}:[A-Za-z0-9_-]{35,}['"]/,
  /api[_-]?key\s*[=:]\s*['"][A-Za-z0-9_\-]{20,}['"]/i,
  /password\s*[=:]\s*['"][^'"]{6,}['"]/i,
  /SUPABASE_SERVICE_KEY\s*=\s*['"]eyJ[A-Za-z0-9._-]+['"]/,
  /secret\s*[=:]\s*['"][^'"]{8,}['"]/i,
];

const SAFE_CONTEXT_PATTERNS = [
  /process\.env\./,
  /import\.meta\.env\./,
  /os\.getenv\(/,
  /getenv\(/,
  /\.env/,
];

let content = '';
try {
  content = readFileSync('/dev/stdin', 'utf8');
} catch {
  process.exit(0); // no stdin — allow
}

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const isSafe = SAFE_CONTEXT_PATTERNS.some((p) => p.test(line));
  if (isSafe) continue;

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(line)) {
      console.error(
        `\n❌ BLOCKED: Hardcoded secret detected at line ${i + 1}:\n  ${line.trim()}\n\n` +
        `Use process.env.VARIABLE_NAME instead.\n` +
        `All secrets must be loaded from .env via dotenv.\n`
      );
      process.exit(1);
    }
  }
}

process.exit(0);
