# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`dsql_dump` is a CLI utility for dumping DSQL schemas as SQL, similar to what `pg_dump` does for PostgreSQL. The project implements a **meta-package architecture** for cross-platform binary distribution, allowing users to install via `npm i -g dsql_dump` and automatically get the correct platform-specific binary.

## Meta-Package Architecture

This project uses a sophisticated distribution pattern:

- **Root meta package**: Contains `optionalDependencies` for platform packages, users install this
- **Platform packages**: `packages/dsql_dump-linux-{x64,arm64}-gnu/` contain actual binaries
- **Automatic selection**: npm installs only the compatible platform package based on `os`/`cpu`/`libc` fields
- **Cross-compilation**: Uses Bun's `--compile` with `--target` flags for platform-specific binaries

## Development Commands

- `bun install` - Install dependencies
- `bun run index.ts` - Run during development
- `npm run build` - Build all platform binaries (calls `scripts/build.sh`)
- `npm run build:linux-x64` - Build only x64 binary
- `npm run build:linux-arm64` - Build only ARM64 binary
- `npm run eslint` - Lint TypeScript code
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

## Build System

Cross-platform binary compilation using Bun:
- `bun build src/index.ts --compile --target=bun-linux-x64 --outfile packages/dsql_dump-linux-x64-gnu/bin/dsql_dump`
- `bun build src/index.ts --compile --target=bun-linux-arm64 --outfile packages/dsql_dump-linux-arm64-gnu/bin/dsql_dump`
- Build script (`scripts/build.sh`) cleans existing binaries and builds both platforms
- Binaries are ~100MB and include the entire runtime

## Publishing Process

The `scripts/publish.sh` workflow:
1. Validates binaries exist for both platforms
2. Publishes platform packages first (`packages/dsql_dump-linux-{x64,arm64}-gnu/`)
3. Publishes meta package last (contains only `optionalDependencies`)
4. Version synchronization is handled by `commit-and-tag-version` via `.versionrc.json`