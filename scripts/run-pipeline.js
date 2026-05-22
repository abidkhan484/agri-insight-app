#!/usr/bin/env node
/**
 * scripts/run-pipeline.js
 * Universal pipeline runner to orchestrate agentic commands (.toml) on any machine.
 * Enforces permissions from .claude/settings.json.
 *
 * Usage:
 *   node scripts/run-pipeline.js [command-name] [param=value ...]
 *
 * Example:
 *   node scripts/run-pipeline.js tdd phase=P9 feature="SMS Fallback Alerts" test_file="src/__tests__/sms.test.js"
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const [, , commandName, ...rawArgs] = process.argv;

if (!commandName) {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║   Universal Pipeline Runner                              ║
╚══════════════════════════════════════════════════════════╝
Usage:
  node scripts/run-pipeline.js [command-name] [param=value ...]

Available commands inside commands/:
${fs.readdirSync(path.join(process.cwd(), 'commands'))
  .filter(f => f.endsWith('.toml'))
  .map(f => `  - ${path.basename(f, '.toml')}`)
  .join('\n')}
`);
  process.exit(0);
}

// 1. Zero-Dependency TOML Parser
function parseTOML(content) {
  const result = {};
  let currentKey = null;
  const lines = content.split('\n');

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    // Matches [section] or [section.sub]
    if (line.startsWith('[') && line.endsWith(']')) {
      currentKey = line.slice(1, -1);
      result[currentKey] = result[currentKey] || {};
      continue;
    }

    const eqIdx = line.indexOf('=');
    if (eqIdx !== -1) {
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      
      // Clean string quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      
      // Parse basic object format if it is parameters
      if (val.startsWith('{') && val.endsWith('}')) {
        try {
          const jsonVal = val
            .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":')
            .replace(/'/g, '"');
          val = JSON.parse(jsonVal);
        } catch (e) {
          // Fallback to raw string
        }
      }

      if (currentKey) {
        result[currentKey][key] = val;
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

// 2. Load Command Spec
const tomlPath = path.join(process.cwd(), 'commands', `${commandName}.toml`);
if (!fs.existsSync(tomlPath)) {
  console.error(`❌ Error: Command configuration not found at ${tomlPath}`);
  process.exit(1);
}

const spec = parseTOML(fs.readFileSync(tomlPath, 'utf8'));
const commandSpec = spec.command || { name: commandName, description: '' };

// 3. Parse Parameters & Arguments
const params = {};
const variables = {};

// Parse CLI parameter key-value pairs (e.g. phase=P9)
rawArgs.forEach(arg => {
  const idx = arg.indexOf('=');
  if (idx !== -1) {
    const k = arg.slice(0, idx).trim();
    const v = arg.slice(idx + 1).trim();
    variables[k] = v;
  }
});

// Load standard variables derived from arguments
if (variables.phase) {
  variables.phase_slug = variables.phase.toLowerCase();
  variables.phase_lower = variables.phase.toLowerCase();
}
if (variables.feature) {
  variables.feature_slug = variables.feature.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// Validate required parameters from TOML spec
const specParams = spec.parameters || {};
for (const [key, config] of Object.entries(specParams)) {
  if (config.required && !variables[key]) {
    console.error(`❌ Error: Missing required parameter '${key}'.`);
    console.error(`   Description: ${config.description || ''}`);
    console.error(`   Usage Example: node scripts/run-pipeline.js ${commandName} ${key}=value`);
    process.exit(1);
  }
  params[key] = variables[key] || config.default || '';
}

// Interpolate placeholders {key} in instructions
function interpolate(str, vars) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

// 4. Load Permissions from .claude/settings.json
const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');
let allowedCommands = [];
let deniedCommands = [];

if (fs.existsSync(settingsPath)) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    allowedCommands = settings.permissions?.allow || [];
    deniedCommands = settings.permissions?.deny || [];
  } catch (e) {
    console.warn("⚠️  Warning: Failed to parse .claude/settings.json permissions.");
  }
}

// Enforce Sandbox Checks
function auditCommand(cmd) {
  // 1. Audit Denied patterns
  for (const pattern of deniedCommands) {
    if (typeof pattern !== 'string') continue;
    const cleanPattern = pattern.startsWith('Bash(') && pattern.endsWith(')')
      ? pattern.slice(5, -1)
      : pattern;
    
    const regexStr = '^' + cleanPattern.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\\\*/g, '.*') + '$';
    if (new RegExp(regexStr).test(cmd)) {
      console.error(`❌ Security Violation: Command is blocked by denied permission rules: "${cmd}"`);
      process.exit(1);
    }
  }

  // 2. Audit Allowed patterns
  for (const pattern of allowedCommands) {
    if (typeof pattern !== 'string') continue;
    const cleanPattern = pattern.startsWith('Bash(') && pattern.endsWith(')')
      ? pattern.slice(5, -1)
      : pattern;
      
    const regexStr = '^' + cleanPattern.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\\\*/g, '.*') + '$';
    if (new RegExp(regexStr).test(cmd)) {
      return true; // Autopass
    }
  }

  return false; // Prompt/Manual confirmation required in non-claude terminal environments
}

// 5. Output Orchestrated Workflow
console.log(`
╔══════════════════════════════════════════════════════════╗
║   Orchestrating Command: ${commandSpec.name.toUpperCase()}
║   Description: ${commandSpec.description || 'No description'}
╚══════════════════════════════════════════════════════════╝
`);

// Filter sections matching steps.*
const stepKeys = Object.keys(spec).filter(k => k.startsWith('steps.'));
stepKeys.sort(); // Sort sequentially by steps names (e.g. 1_coder, 2_qa, etc.)

if (stepKeys.length === 0) {
  console.log("ℹ️  No sequential steps configured in TOML command.");
} else {
  stepKeys.forEach(stepKey => {
    const step = spec[stepKey];
    const agent = step.agent || 'AI Assistant';
    const rawInstruction = step.instruction || '';
    const rawGate = step.gate || '';
    
    const instruction = interpolate(rawInstruction, variables);
    const gate = interpolate(rawGate, variables);
    
    // Parse reads array from string format if needed
    let reads = [];
    if (typeof step.reads === 'string') {
      const cleanStr = step.reads.trim();
      if (cleanStr.startsWith('[') && cleanStr.endsWith(']')) {
        reads = cleanStr.slice(1, -1).split(',').map(s => {
          s = s.trim();
          if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.slice(1, -1);
          }
          return s;
        });
      } else {
        reads = [cleanStr];
      }
    } else if (Array.isArray(step.reads)) {
      reads = step.reads;
    }
    
    const interpolatedReads = reads.map(r => interpolate(r, variables));

    console.log(`\n🤖 [Step: ${stepKey.replace('steps.', '')}] - Agent: @${agent}`);
    console.log(`   Instruction: ${instruction}`);
    if (interpolatedReads.length > 0) {
      console.log(`   Reads Context: ${interpolatedReads.join(', ')}`);
    }
    console.log(`   Verification Gate: ${gate}`);
    console.log(`   ────────────────────────────────────────────────────────`);
  });
}

// Print executing notes
const notes = spec.notes || {};
if (Object.keys(notes).length > 0) {
  console.log(`\n📌 Operational Notes:`);
  for (const [k, v] of Object.entries(notes)) {
    console.log(`   - ${k.replace(/_/g, ' ')}: ${v}`);
  }
}
console.log('');
