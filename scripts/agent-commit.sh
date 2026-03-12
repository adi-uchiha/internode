#!/bin/bash

# Exit on any error
set -e

# Support for commit message and description
MESSAGE=$1
DESCRIPTION=$2

if [ -z "$MESSAGE" ]; then
  echo "Usage: bun run agent:commit \"commit title\" \"[commit description]\""
  exit 1
fi

echo "🚀 Starting agent commit process..."

# 1. Run ESLint auto-fix
echo "🔍 Running ESLint auto-fix..."
bun run lint:eslint

# 2. Strict ESLint check (no warnings allowed)
echo "🔒 Verifying clean slate (no warnings allowed)..."
bun x turbo lint:eslint -- --max-warnings 0

# 3. Build project
echo "🏗️  Building project..."
bun run build

# 4. Git Commit
echo "💾 Adding files and committing..."
git add .

if [ -n "$DESCRIPTION" ]; then
  git commit -m "$MESSAGE" -m "$DESCRIPTION"
else
  git commit -m "$MESSAGE"
fi

echo "✅ Commit successful!"
