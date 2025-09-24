#!/bin/bash
set -e

echo "Publishing dsql_dump packages..."

# Get the version from the root package.json
VERSION=$(node -p "require('./package.json').version")
echo "Publishing version: $VERSION"

# Check that binaries exist
if [ ! -f packages/dsql_dump-linux-x64-gnu/bin/dsql_dump ]; then
    echo "Error: linux-x64-gnu binary not found. Run 'npm run release' first to build binaries."
    exit 1
fi

if [ ! -f packages/dsql_dump-linux-arm64-gnu/bin/dsql_dump ]; then
    echo "Error: linux-arm64-gnu binary not found. Run 'npm run release' first to build binaries."
    exit 1
fi

# Publish platform packages first
echo "Publishing platform packages..."
cd packages/dsql_dump-linux-x64-gnu && npm publish && cd ../..
cd packages/dsql_dump-linux-arm64-gnu && npm publish && cd ../..

# Publish meta package
echo "Publishing meta package..."
npm publish

echo "All packages published successfully!"
echo "Users can now install with: npm install dsql_dump"
