#!/usr/bin/env bun

// Build-time constant injected during compilation
declare const BUILD_VERSION: string

// Function to get version (fallback to package.json in dev mode)
function getVersion(): string {
  try {
    // In compiled binaries, BUILD_VERSION will be defined
    return BUILD_VERSION
  } catch {
    // In development, read from package.json and add -dev suffix
    try {
      return `${packageJson.version}-dev`
    } catch {
      return "0.0.0-dev"
    }
  }
}

import { parseArgs } from "node:util"
import packageJson from "../package.json" with { type: "json" }
import { createConnection, type DatabaseConfig } from "./db"
import { OutputFormatter } from "./formatter"
import { ConstraintExtractor } from "./schema/constraints"
import { DataExtractor } from "./schema/data"
import { IndexExtractor } from "./schema/indexes"
import { TableExtractor } from "./schema/tables"

const HELP_TEXT = `Usage: dsql_dump [OPTIONS]

Dump a DSQL schema as SQL, similar to pg_dump

DSQL connection uses fixed values: database=postgres, username=admin, port=5432.
Authentication uses AWS credentials to generate auth token.

Options:
  -h, --host <host>                DSQL cluster hostname (default: PGHOST or localhost)
  -n, --schema <schema>            dump the named schema only (default: public)
  -a, --data-only                  dump only the data, not the schema
  -s, --schema-only                dump only the schema, not the data
  -c, --clean                      output commands to DROP objects before creating them
      --help                       display help for command
      --version                    display version number

Environment variables:
  PGHOST                           DSQL cluster hostname
  AWS_REGION                       AWS region (default: us-east-1)

Requires AWS credentials configured via AWS CLI, environment variables, or IAM role.`

async function main() {
  const { values: options } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "help": { type: "boolean" },
      "version": { type: "boolean" },
      "host": { type: "string", short: "h" },
      "schema": { type: "string", short: "n" },
      "data-only": { type: "boolean", short: "a" },
      "schema-only": { type: "boolean", short: "s" },
      "clean": { type: "boolean", short: "c" },
    },
    allowPositionals: false,
  })

  if (options.help) {
    console.log(HELP_TEXT)
    process.exit(0)
  }

  if (options.version) {
    console.log(getVersion())
    process.exit(0)
  }

  // Validate mutually exclusive options
  if (options["data-only"] && options["schema-only"]) {
    console.error("Error: --data-only and --schema-only are mutually exclusive")
    process.exit(1)
  }

  const config: DatabaseConfig = {
    host: options.host,
  }

  const sql = await createConnection(config)

  try {
    const formatter = new OutputFormatter(getVersion())
    const dumpOptions = {
      schema: options.schema || "public",
      clean: options.clean || false,
      dataOnly: options["data-only"] || false,
      schemaOnly: options["schema-only"] || false,
    }

    // Output header
    console.log(formatter.formatHeader(dumpOptions))

    const tableExtractor = new TableExtractor(sql)
    const dataExtractor = new DataExtractor(sql)

    // Extract tables (needed for both schema and data-only dumps)
    const tables = await tableExtractor.extractTables(dumpOptions.schema)

    if (!dumpOptions.dataOnly && !dumpOptions.schemaOnly) {
      // Normal dump: schema + data
      const indexExtractor = new IndexExtractor(sql)
      const constraintExtractor = new ConstraintExtractor(sql)

      // Extract remaining schema objects
      const [indexes, constraints] = await Promise.all([
        indexExtractor.extractIndexes(dumpOptions.schema),
        constraintExtractor.extractConstraints(dumpOptions.schema),
      ])

      // Output tables
      if (tables.length > 0) {
        console.log(formatter.formatSectionComment("Tables"))
        for (const table of tables) {
          console.log(tableExtractor.formatCreateTable(table, constraints, dumpOptions.clean))
        }
      }

      // Output table data after tables are created
      if (tables.length > 0) {
        console.log(formatter.formatSectionComment("Data"))
        for (const table of tables) {
          console.log(await dataExtractor.dumpTableData(table))
        }
      }

      // Output constraints that need to be added after tables
      const postTableConstraints = constraintExtractor.getPostTableConstraints(constraints)
      if (postTableConstraints.length > 0) {
        console.log(formatter.formatSectionComment("Constraints"))
        for (const constraint of postTableConstraints) {
          console.log(constraintExtractor.formatConstraint(constraint, dumpOptions.clean))
        }
      }

      // Output indexes (excluding those that back constraints)
      const standaloneIndexes = indexes.filter(idx => !idx.isConstraintIndex)
      if (standaloneIndexes.length > 0) {
        console.log(formatter.formatSectionComment("Indexes"))
        for (const index of standaloneIndexes) {
          const indexDdl = indexExtractor.formatCreateIndex(index, dumpOptions.clean)
          if (indexDdl.trim()) {
            console.log(indexDdl)
          }
        }
      }
    } else if (dumpOptions.dataOnly) {
      // Data-only dump
      if (tables.length > 0) {
        console.log(formatter.formatSectionComment("Data"))
        for (const table of tables) {
          console.log(await dataExtractor.dumpTableData(table))
        }
      }
    } else if (dumpOptions.schemaOnly) {
      // Schema-only dump
      const indexExtractor = new IndexExtractor(sql)
      const constraintExtractor = new ConstraintExtractor(sql)

      // Extract remaining schema objects
      const [indexes, constraints] = await Promise.all([
        indexExtractor.extractIndexes(dumpOptions.schema),
        constraintExtractor.extractConstraints(dumpOptions.schema),
      ])

      // Output tables
      if (tables.length > 0) {
        console.log(formatter.formatSectionComment("Tables"))
        for (const table of tables) {
          console.log(tableExtractor.formatCreateTable(table, constraints, dumpOptions.clean))
        }
      }

      // Output constraints that need to be added after tables
      const postTableConstraints = constraintExtractor.getPostTableConstraints(constraints)
      if (postTableConstraints.length > 0) {
        console.log(formatter.formatSectionComment("Constraints"))
        for (const constraint of postTableConstraints) {
          console.log(constraintExtractor.formatConstraint(constraint, dumpOptions.clean))
        }
      }

      // Output indexes (excluding those that back constraints)
      const standaloneIndexes = indexes.filter(idx => !idx.isConstraintIndex)
      if (standaloneIndexes.length > 0) {
        console.log(formatter.formatSectionComment("Indexes"))
        for (const index of standaloneIndexes) {
          const indexDdl = indexExtractor.formatCreateIndex(index, dumpOptions.clean)
          if (indexDdl.trim()) {
            console.log(indexDdl)
          }
        }
      }
    }

    // Output footer
    console.log(formatter.formatFooter())

  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

// Run main function if this file is executed directly
if (require.main === module) {
  main().catch(console.error)
}
