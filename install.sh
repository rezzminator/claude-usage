#!/usr/bin/env bash
# Install claude-gauge as a Claude Code skill in the current project.
# Run from the root of any Claude Code project.
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/mreza0100/claude-gauge/main/install.sh)

set -euo pipefail

SKILL_DIR=".claude/skills/claude-gauge"
REPO_URL="https://raw.githubusercontent.com/mreza0100/claude-gauge/main"

echo ""
echo "Installing claude-gauge skill..."

if [[ ! -d ".claude" ]]; then
  echo "Error: no .claude/ directory found. Run this from the root of a Claude Code project."
  exit 1
fi

mkdir -p "$SKILL_DIR"
curl -fsSL "$REPO_URL/SKILL.md"   -o "$SKILL_DIR/SKILL.md"
curl -fsSL "$REPO_URL/usage.mjs"  -o "$SKILL_DIR/usage.mjs"
chmod +x "$SKILL_DIR/usage.mjs"

echo "✓ Installed to $SKILL_DIR/"
echo ""
echo "Test it now:"
echo "  node $SKILL_DIR/usage.mjs"
echo ""
echo "Then ask Claude: \"how much of my limit is left?\""
echo ""
