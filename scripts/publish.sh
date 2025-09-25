#!/bin/bash
set -e

echo "Publishing dsql_dump packages..."

# Get the version from the root package.json
VERSION=$(node -p "require('./package.json').version")
echo "Publishing version: $VERSION"

# Detect if running in CI
if [ "${CI:-}" = "true" ]; then
    echo "Running in CI environment"
    # In CI, we want provenance and ensure packages are public
    PUBLISH_FLAGS="--provenance --access public"
else
    echo "Running locally"
    # Locally, just ensure packages are public (needed for first-time publishing)
    PUBLISH_FLAGS="--access public"
fi

# Check that binaries exist
if [ ! -f packages/dsql_dump-linux-x64-gnu/bin/dsql_dump ]; then
    echo "Error: linux-x64-gnu binary not found. Run 'npm run release' first to build binaries."
    exit 1
fi

if [ ! -f packages/dsql_dump-linux-arm64-gnu/bin/dsql_dump ]; then
    echo "Error: linux-arm64-gnu binary not found. Run 'npm run release' first to build binaries."
    exit 1
fi

if [ ! -f packages/dsql_dump-darwin-arm64/bin/dsql_dump ]; then
    echo "Error: darwin-arm64 binary not found. Run 'npm run release' first to build binaries."
    exit 1
fi

if [ ! -f packages/dsql_dump-darwin-x64/bin/dsql_dump ]; then
    echo "Error: darwin-x64 binary not found. Run 'npm run release' first to build binaries."
    exit 1
fi

if [ ! -f packages/dsql_dump-windows-x64/bin/dsql_dump.exe ]; then
    echo "Error: windows-x64 binary not found. Run 'npm run release' first to build binaries."
    exit 1
fi


# Publish platform packages first
echo "Publishing platform packages..."
cd packages/dsql_dump-linux-x64-gnu
echo "Publishing dsql_dump-linux-x64-gnu@$VERSION"
npm publish $PUBLISH_FLAGS
cd ../..

cd packages/dsql_dump-linux-arm64-gnu
echo "Publishing dsql_dump-linux-arm64-gnu@$VERSION"
npm publish $PUBLISH_FLAGS
cd ../..

cd packages/dsql_dump-darwin-arm64
echo "Publishing dsql_dump-darwin-arm64@$VERSION"
npm publish $PUBLISH_FLAGS
cd ../..

cd packages/dsql_dump-darwin-x64
echo "Publishing dsql_dump-darwin-x64@$VERSION"
npm publish $PUBLISH_FLAGS
cd ../..

cd packages/dsql_dump-windows-x64
echo "Publishing dsql_dump-windows-x64@$VERSION"
npm publish $PUBLISH_FLAGS
cd ../..


# Publish meta package
echo "Publishing meta package..."
echo "Publishing dsql_dump@$VERSION"
npm publish $PUBLISH_FLAGS

echo "All packages published successfully!"
echo "Users can now install with: npm install -g dsql_dump"
