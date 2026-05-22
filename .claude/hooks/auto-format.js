#!/usr/bin/env node
/**
 * Post-tool-use hook: automatically format JS/TS/JSX/JSON/CSS/MD files with Prettier.
 * Reads edited/written filename from CLAUDE_TOOL_INPUT_PATH env var (set by Claude Code).
 * Exits 0 always.
 */

import { existsSync } from 'fs';
import { execSync } from 'child_process';

const filePath = process.env.CLAUDE_TOOL_INPUT_PATH || '';
if (!filePath || !existsSync(filePath)) process.exit(0);

// Auto-format common code and doc formats
if (/\.(js|mjs|cjs|ts|tsx|jsx|json|css|md)$/.test(filePath)) {
  try {
    // Run local prettier via npx write to auto-format files
    execSync(`npx prettier --write "${filePath}"`, { stdio: 'ignore' });
  } catch (e) {
    // Fail silently during editing if prettier check fails (e.g. malformed syntax)
  }
}

process.exit(0);
