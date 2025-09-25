#!/bin/bash
set -e

echo "Building dsql_dump binaries for multiple platforms..."

# Extract version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "Using version: $VERSION"

# Clean existing binaries
echo "Cleaning existing binaries..."
rm -f packages/*/bin/dsql_dump packages/*/bin/dsql_dump.exe

# Build for linux-x64-gnu
echo "Building for linux-x64-gnu..."
bun build src/index.ts --compile --target=bun-linux-x64 --define BUILD_VERSION="\"$VERSION\"" --outfile packages/dsql_dump-linux-x64-gnu/bin/dsql_dump

# Build for linux-arm64-gnu
echo "Building for linux-arm64-gnu..."
bun build src/index.ts --compile --target=bun-linux-arm64 --define BUILD_VERSION="\"$VERSION\"" --outfile packages/dsql_dump-linux-arm64-gnu/bin/dsql_dump

# Build for darwin-arm64
echo "Building for darwin-arm64..."
bun build src/index.ts --compile --target=bun-darwin-arm64 --define BUILD_VERSION="\"$VERSION\"" --outfile packages/dsql_dump-darwin-arm64/bin/dsql_dump

# Build for darwin-x64
echo "Building for darwin-x64..."
bun build src/index.ts --compile --target=bun-darwin-x64 --define BUILD_VERSION="\"$VERSION\"" --outfile packages/dsql_dump-darwin-x64/bin/dsql_dump

# Build for windows-x64
echo "Building for windows-x64..."
bun build src/index.ts --compile --target=bun-windows-x64 --define BUILD_VERSION="\"$VERSION\"" --outfile packages/dsql_dump-windows-x64/bin/dsql_dump.exe

echo "Build completed successfully!"
echo "Binaries created:"
ls -la packages/*/bin/dsql_dump*