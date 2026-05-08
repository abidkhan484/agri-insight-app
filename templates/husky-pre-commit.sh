#!/bin/sh
# templates/husky-pre-commit.sh
# Copy to .husky/pre-commit in your project:
#   mkdir -p .husky && cp templates/husky-pre-commit.sh .husky/pre-commit && chmod +x .husky/pre-commit
#
# Pre-commit gate: TypeScript check → ESLint → Prettier → Tests
# ALL must pass with zero errors/warnings before commit is allowed.

set -e

echo "🔍 Pre-commit checks starting..."

# 1. TypeScript type check (if tsconfig.json exists)
if [ -f tsconfig.json ]; then
  echo "⏳ Running TypeScript check..."
  npx tsc --noEmit
  echo "✅ TypeScript OK"
fi

# 2. ESLint — zero warnings allowed
echo "⏳ Running ESLint..."
npx eslint . --max-warnings 0
echo "✅ ESLint OK"

# 3. Prettier format check
echo "⏳ Running Prettier check..."
npx prettier --check .
echo "✅ Prettier OK"

# 4. Run tests (if Vitest or Jest configured)
if grep -q '"test"' package.json; then
  echo "⏳ Running tests..."
  npm test -- --run 2>/dev/null || npm test
  echo "✅ Tests OK"
fi

echo "🚀 All pre-commit checks passed!"
