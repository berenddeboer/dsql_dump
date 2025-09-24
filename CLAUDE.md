# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`dsql_dump` is a CLI utility for dumping DSQL schemas as SQL, similar to what `pg_dump` does for PostgreSQL. The project is currently in early development with a placeholder implementation.

## Development Commands

- `bun install` - Install dependencies
- `bun run index.ts` - Run the main application
- `bunx tsc --noEmit` - Type check without emitting files

## Architecture

This project uses Bun as the JavaScript runtime (not Node.js) and is configured with strict TypeScript settings. The main entry point is `index.ts`.

Key implementation areas to develop:
- CLI argument parsing for options: `--data-only`, `--clean`, `--schema=<name>`
- DSQL database connection and authentication
- Schema introspection to extract table definitions, indexes, constraints
- SQL generation that outputs to stdout (following pg_dump patterns)
- Data export functionality when `--data-only` is specified

## CLI Design

The tool should follow standard Unix conventions:
- Output SQL to stdout by default
- Use stderr for error messages and progress information
- Support piping output to files: `dsql_dump > dump.sql`
- Exit with appropriate status codes (0 for success, non-zero for errors)

## DSQL Integration

This tool targets DSQL databases specifically. Implementation will need to:
- Handle DSQL-specific connection parameters and authentication
- Map DSQL schema objects to standard SQL DDL statements
- Ensure generated SQL is compatible with the target database system