#!/bin/bash
# Build all games and copy to assets

# Enable error handling
set -e

GAMES=(
  "pigs-vs-wolf_-wall-builder"
  "hood fighter forest dash"
  "red riding hood 1"
  "tortoise and hare 2"
  "cinderella's-midnight-dash"
)

BASE_DIR=$(pwd)

for game in "${GAMES[@]}"; do
  echo "--------------------------------------------------"
  echo "Processing $game..."
  echo "--------------------------------------------------"
  
  GAME_DIR="$BASE_DIR/games/$game"
  
  if [ ! -d "$GAME_DIR" ]; then
    echo "Error: Directory $GAME_DIR does not exist."
    continue
  fi

  cd "$GAME_DIR"
  
  # Check if node_modules exists, if not install
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
  else
    echo "Dependencies already installed."
  fi

  echo "Building..."
  npm run build
  
  DEST="$BASE_DIR/assets/games/$game"
  mkdir -p "$DEST"
  
  if [ -f "dist/index.html" ]; then
    cp dist/index.html "$DEST/index.html"
    echo "Successfully copied $game index.html to $DEST"
  else
    echo "Error: Build failed or dist/index.html not found for $game"
    exit 1
  fi
done

echo "All games built and copied successfully!"
