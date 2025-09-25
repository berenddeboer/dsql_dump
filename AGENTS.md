# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`dsql_dump` is a CLI utility for dumping DSQL schemas as SQL, similar to what `pg_dump` does for PostgreSQL. The project implements a **meta-package architecture** for cross-platform binary distribution, allowing users to install via `npm i -g dsql_dump` and automatically get the correct platform-specific binary.

## Meta-Package Architecture

This project uses a sophisticated distribution pattern:

- **Root meta package**: Contains `optionalDependencies` for platform packages, users install this
- **Platform packages**: `packages/dsql_dump-{linux-{x64,arm64}-gnu,darwin-{arm64,x64},windows-x64}/` contain actual binaries
- **Automatic selection**: npm installs only the compatible platform package based on `os`/`cpu`/`libc` fields
- **Cross-compilation**: Uses Bun's `--compile` with `--target` flags for platform-specific binaries

## Development Commands

- `bun install` - Install dependencies
- `bun run index.ts` - Run during development
- `bun run build` - Build all platform binaries (calls `scripts/build.sh`)
- `npm run build:linux-x64` - Build Linux x64 binary
- `npm run build:linux-arm64` - Build Linux ARM64 binary
- `npm run build:darwin-arm64` - Build macOS ARM64 binary
- `npm run build:darwin-x64` - Build macOS x64 binary
- `npm run build:windows-x64` - Build Windows x64 binary
- `bun run lint` - Lint TypeScript code
- `bun run lint --fix src/**/*.ts` - Lint and auto-fix TypeScript code in src directory
- `bun run typecheck` - Typecheck TypeScript code
- `npm run release` - Version bump, changelog, git tag, and build (uses commit-and-tag-version)
- `npm run publish-all` - Publish all packages to npm (calls `scripts/publish.sh`)

## Release Workflow

The project uses `commit-and-tag-version` for automated releases:

1. Make changes with conventional commit messages (`feat:`, `fix:`, etc.)
2. Run `npm run release` - automatically builds binaries, bumps versions in all packages, updates changelog, creates git tag
3. Run `npm run publish-all` - publishes platform packages first, then meta package
4. Users install with `npm install dsql_dump`

## Architecture & Implementation

**Runtime**: Bun (not Node.js) with strict TypeScript configuration

**Source Structure** (`src/`):
- `index.ts` - CLI entry point with argument parsing
- `db.ts` - DSQL connection using AWS SDK signer
- `formatter.ts` - SQL output formatting following pg_dump conventions
- `schema/tables.ts` - Table definition extraction
- `schema/constraints.ts` - Foreign keys, checks, unique constraints
- `schema/indexes.ts` - Index definitions
- `schema/data.ts` - Table data extraction using COPY format

**CLI Features**:
- Options: `--data-only`, `--clean`, `--schema=<name>`, `--host`
- Environment variables: `PGHOST`, `AWS_REGION`
- DSQL specifics: connects as "admin" user, requires AWS credentials, uses SSL
- Unix conventions: SQL to stdout, errors to stderr, proper exit codes

**DSQL Integration**:
- Uses `@aws-sdk/dsql-signer` for authentication token generation
- Connects via `postgres` driver with DSQL-specific authentication
- Fixed values: `database=postgres`, `username=admin`, `port=5432`
- Schema introspection extracts tables, constraints, indexes as standard SQL DDL
- Use the `bin/dsql-psql` utility to interact with a known DSQL cluster.
- This supports things like: `./bin/dsql-psql -c 'select 1'`

## Build System

**Important**: When adding new platforms, update `bin/dsql_dump.js` with the new platform mappings in the `platformPackages` object.

Cross-platform binary compilation using Bun:
- `bun build src/index.ts --compile --target=bun-linux-x64 --outfile packages/dsql_dump-linux-x64-gnu/bin/dsql_dump`
- `bun build src/index.ts --compile --target=bun-linux-arm64 --outfile packages/dsql_dump-linux-arm64-gnu/bin/dsql_dump`
- `bun build src/index.ts --compile --target=bun-darwin-arm64 --outfile packages/dsql_dump-darwin-arm64/bin/dsql_dump`
- `bun build src/index.ts --compile --target=bun-darwin-x64 --outfile packages/dsql_dump-darwin-x64/bin/dsql_dump`
- `bun build src/index.ts --compile --target=bun-windows-x64 --outfile packages/dsql_dump-windows-x64/bin/dsql_dump.exe`
- Build script (`scripts/build.sh`) cleans existing binaries and builds all supported platforms
- Binaries are ~100MB and include the entire runtime
- **Note**: Windows ARM64 is not yet supported by Bun's cross-compilation

## Commits
- use conventional commit messages

## Publishing Process

The `scripts/publish.sh` workflow:
1. Validates binaries exist for all platforms
2. Publishes platform packages first (`packages/dsql_dump-linux-{x64,arm64}-gnu/`, `packages/dsql_dump-darwin-{arm64,x64}/`, `packages/dsql_dump-windows-x64/`)
3. Publishes meta package last (contains only `optionalDependencies`)
4. Version synchronization is handled by `commit-and-tag-version` via `.versionrc.json`

**Supported Platforms:**
- Linux x64 (glibc)
- Linux ARM64 (glibc)
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Windows x64
- Windows ARM64 (not yet supported - Bun limitation)
