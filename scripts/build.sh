#!/bin/bash
set -e

echo "Building dsql_dump binaries for multiple platforms..."

# Clean existing binaries
echo "Cleaning existing binaries..."
rm -f packages/*/bin/dsql_dump packages/*/bin/dsql_dump.exe

# Build for linux-x64-gnu
echo "Building for linux-x64-gnu..."
npm run build:linux-x64

# Build for linux-arm64-gnu
echo "Building for linux-arm64-gnu..."
npm run build:linux-arm64

# Build for darwin-arm64
echo "Building for darwin-arm64..."
npm run build:darwin-arm64

# Build for darwin-x64
echo "Building for darwin-x64..."
npm run build:darwin-x64

# Build for win32-x64
echo "Building for win32-x64..."
npm run build:win32-x64

# Build for win32-arm64
echo "Building for win32-arm64..."
npm run build:win32-arm64

echo "Build completed successfully!"
echo "Binaries created:"
ls -la packages/*/bin/dsql_dump*