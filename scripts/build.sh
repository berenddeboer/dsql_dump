#!/bin/bash
set -e

echo "Building dsql_dump binaries for multiple platforms..."

# Clean existing binaries
echo "Cleaning existing binaries..."
rm -f packages/*/bin/dsql_dump

# Build for linux-x64-gnu
echo "Building for linux-x64-gnu..."
npm run build:linux-x64

# Build for linux-arm64-gnu
echo "Building for linux-arm64-gnu..."
npm run build:linux-arm64

echo "Build completed successfully!"
echo "Binaries created:"
ls -la packages/*/bin/dsql_dump