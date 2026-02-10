#!/bin/bash

# Exit on error
set -e

# Directory containing games
GAMES_DIR="games"
ASSETS_DIR="assets/games"

# Create assets directory if it doesn't exist
mkdir -p "$ASSETS_DIR"

# Loop through each game directory
for game in "$GAMES_DIR"/*; do
  if [ -d "$game" ]; then
    game_name=$(basename "$game")
    echo "Building $game_name..."

    # Navigate to game directory
    pushd "$game"

    # Install dependencies and build with relative base path
    npm install
    npm run build -- --base=./

    # Create destination directory
    dest_dir="../../$ASSETS_DIR/$game_name"
    mkdir -p "$dest_dir"

    # Copy build artifacts (assuming Vite defaults to 'dist')
    if [ -d "dist" ]; then
      cp -r dist/* "$dest_dir/"
      echo "Successfully built and copied $game_name to $dest_dir"
    else
      echo "Error: 'dist' directory not found for $game_name"
    fi

    # Return to root
    popd
  fi
done

echo "All games built and assets updated."
