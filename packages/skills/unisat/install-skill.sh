#!/bin/bash
# UniSat Skill Installation Script
# This script installs the UniSat skill for Claude Code

set -e

echo "🚀 Installing UniSat Skill for Claude Code..."

# Detect OS
OS="$(uname -s)"
CLAUDE_CONFIG_DIR=""

case "$OS" in
  Darwin)
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
    ;;
  Linux)
    if [ -n "$XDG_CONFIG_HOME" ]; then
      CLAUDE_CONFIG_DIR="$XDG_CONFIG_HOME/Claude"
    else
      CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
    fi
    ;;
  *)
    echo "❌ Unsupported OS: $OS"
    exit 1
    ;;
esac

echo "📁 Claude config directory: $CLAUDE_CONFIG_DIR"

# Create skills directory
SKILL_DIR="$CLAUDE_CONFIG_DIR/skills/unisat"
echo "📦 Installing to: $SKILL_DIR"

# Remove old installation if exists
if [ -d "$SKILL_DIR" ]; then
  echo "🧹 Removing old installation..."
  rm -rf "$SKILL_DIR"
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create skill directory and copy files
mkdir -p "$SKILL_DIR"

# Copy skill files from local installation or download from GitHub
if [ -f "$SCRIPT_DIR/SKILL.md" ]; then
  echo "📋 Copying skill files..."
  cp "$SCRIPT_DIR/SKILL.md" "$SKILL_DIR/"
  cp "$SCRIPT_DIR/skill.json" "$SKILL_DIR/"
else
  echo "📥 Downloading skill files from GitHub..."
  SKILL_BASE_URL="https://raw.githubusercontent.com/unisat-wallet/unisat-ai/main/packages/skills/unisat"
  curl -fsSL "$SKILL_BASE_URL/SKILL.md" -o "$SKILL_DIR/SKILL.md"
  curl -fsSL "$SKILL_BASE_URL/skill.json" -o "$SKILL_DIR/skill.json"
fi

# Create package.json for npm package detection
cat > "$SKILL_DIR/package.json" << 'EOF'
{
  "name": "@unisat/skill",
  "version": "0.0.1",
  "description": "UniSat Skill for Claude Code",
  "private": true
}
EOF

echo "✅ UniSat Skill installed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Get your API key from https://developer.unisat.io"
echo "   2. Add to Claude Code Settings → Skills → unisat"
echo "   3. Set UNISAT_API_KEY environment variable"
echo ""
echo "💡 Usage in Claude Code:"
echo "   @unisat 当前比特币区块高度是多少？"
echo "   @unisat 查询 ORDI 的前10名持币地址"
echo "   @unisat bc1q... 余额是多少"
