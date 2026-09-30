#!/bin/bash
# Double-click on a Mac to preview the website at http://127.0.0.1:8000 (close this window to stop).
cd "$(dirname "$0")"
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
if ! command -v uv >/dev/null 2>&1; then
  echo "uv is not installed yet. Paste this into Terminal once, then double-click preview.command again:"
  echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
  read -n 1 -s -r -p "Press any key to close…"; exit 1
fi
echo "Building the website (the first time takes a minute or two)…"
( sleep 8; open "http://127.0.0.1:8000" ) &
uv run mkdocs serve --dirtyreload
