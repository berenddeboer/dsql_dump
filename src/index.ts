#!/usr/bin/env bun

import { parseArgs } from 'node:util';
import { createConnection, type DatabaseConfig } from './db';
import { OutputFormatter } from './formatter';
import { ConstraintExtractor } from './schema/constraints';
import { IndexExtractor } from './schema/indexes';
import { TableExtractor } from './schema/tables';

const HELP_TEXT = `Usage: dsql_dump [OPTIONS]

Dump a DSQL schema as SQL, similar to pg_dump

Connection options fall back to standard PostgreSQL environment variables (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD).

Options:
  -h, --host <host>                database server host (default: PGHOST or localhost)
  -p, --port <port>                database server port (default: PGPORT or 5432)
  -d, --database <database>        database name (default: PGDATABASE)
  -U, --username <username>        database user name (default: PGUSER)
  -W, --password <password>        database password (default: PGPASSWORD)
      --connection-string <string> PostgreSQL connection string
  -n, --schema <schema>            dump the named schema only (default: public)
  -a, --data-only                  dump only the data, not the schema
  -c, --clean                      output commands to DROP objects before creating them
      --help                       display help for command
      --version                    display version number`;

async function main() {
  const { values: options } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      'help': { type: 'boolean' },
      'version': { type: 'boolean' },
      'host': { type: 'string', short: 'h' },
      'port': { type: 'string', short: 'p' },
      'database': { type: 'string', short: 'd' },
      'username': { type: 'string', short: 'U' },
      'password': { type: 'string', short: 'W' },
      'connection-string': { type: 'string' },
      'schema': { type: 'string', short: 'n' },
      'data-only': { type: 'boolean', short: 'a' },
      'clean': { type: 'boolean', short: 'c' },
    },
    allowPositionals: false,
  });

  if (options.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  if (options.version) {
    console.log('0.0.0');
    process.exit(0);
  }


  const config: DatabaseConfig = {
    host: options.host,
    port: options.port ? parseInt(options.port) : undefined,
    database: options.database,
    username: options.username,
    password: options.password,
    connectionString: options['connection-string'],
  };

  const sql = createConnection(config);

  try {
    const formatter = new OutputFormatter();
    const dumpOptions = {
      schema: options.schema || 'public',
      clean: options.clean || false,
      dataOnly: options['data-only'] || false,
    };

    // Output header
    console.log(formatter.formatHeader(dumpOptions));

    if (!dumpOptions.dataOnly) {
      const tableExtractor = new TableExtractor(sql);
      const indexExtractor = new IndexExtractor(sql);
      const constraintExtractor = new ConstraintExtractor(sql);

      // Extract all schema objects
      const [tables, indexes, constraints] = await Promise.all([
        tableExtractor.extractTables(dumpOptions.schema),
        indexExtractor.extractIndexes(dumpOptions.schema),
        constraintExtractor.extractConstraints(dumpOptions.schema),
      ]);

      // Output tables
      if (tables.length > 0) {
        console.log(formatter.formatSectionComment('Tables'));
        for (const table of tables) {
          console.log(tableExtractor.formatCreateTable(table, dumpOptions.clean));
        }
      }

      // Output constraints that need to be added after tables
      const postTableConstraints = constraintExtractor.getPostTableConstraints(constraints);
      if (postTableConstraints.length > 0) {
        console.log(formatter.formatSectionComment('Constraints'));
        for (const constraint of postTableConstraints) {
          console.log(constraintExtractor.formatConstraint(constraint, dumpOptions.clean));
        }
      }

      // Output indexes (excluding those that back constraints)
      const standaloneIndexes = indexes.filter(idx => !idx.isConstraintIndex);
      if (standaloneIndexes.length > 0) {
        console.log(formatter.formatSectionComment('Indexes'));
        for (const index of standaloneIndexes) {
          const indexDdl = indexExtractor.formatCreateIndex(index, dumpOptions.clean);
          if (indexDdl.trim()) {
            console.log(indexDdl);
          }
        }
      }
    }

    // Output footer
    console.log(formatter.formatFooter());

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run main function if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
