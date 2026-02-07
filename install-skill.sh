#!/bin/bash
# UniSat Skill One-Click Installer for Claude Code
# This script downloads and installs the UniSat skill from GitHub

set -e

echo "🚀 Installing UniSat Skill for Claude Code..."
echo ""

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
echo ""

# Create skills directory
SKILL_DIR="$CLAUDE_CONFIG_DIR/skills/unisat"
echo "📦 Installing to: $SKILL_DIR"

# Remove old installation if exists
if [ -d "$SKILL_DIR" ]; then
  echo "🧹 Removing old installation..."
  rm -rf "$SKILL_DIR"
fi

# Create skill directory
mkdir -p "$SKILL_DIR"

# Download from GitHub
SKILL_BASE_URL="https://raw.githubusercontent.com/unisat-wallet/unisat-ai/main/packages/skills/unisat"

echo "📥 Downloading skill files..."
curl -fsSL "$SKILL_BASE_URL/SKILL.md" -o "$SKILL_DIR/SKILL.md"
curl -fsSL "$SKILL_BASE_URL/skill.json" -o "$SKILL_DIR/skill.json"
curl -fsSL "$SKILL_BASE_URL/README.md" -o "$SKILL_DIR/README.md"

echo ""
echo "✅ UniSat Skill installed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Get your API key from https://developer.unisat.io"
echo "   2. Open Claude Code Settings → Skills"
echo "   3. Configure UNISAT_API_KEY environment variable"
echo ""
echo "💡 Usage examples:"
echo "   @unisat What's the current Bitcoin block height?"
echo "   @unisat Check ORDI top holders"
echo "   @unisat Get current network fees"
echo "   @unisat Show balance for bc1q..."
echo ""
