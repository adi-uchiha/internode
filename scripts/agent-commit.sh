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

# 1. Format and Lint (auto-fix)
echo "🧹 Formatting and fixing lint issues..."
bun run format
bun run lint

# 2. Strict ESLint check (no warnings allowed) - This is mostly redundant if lint check is in lint-staged
# but keeping a fast check here if needed.

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
