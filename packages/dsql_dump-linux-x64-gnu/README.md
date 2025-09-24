# About

`dsql_dump` is a utility to dump a DSQL schema as SQL, much like what
`pg_dump` does.

# Installation

```sh
npm i -g dsql_dump
```

# Usage

`dsql_dump` will always connect as the "admin" user. Make sure your
AWS credentials allow connecting as admin to the cluster.

Dump the default schema (public):

```sh
dsql_dump > dump.sql
```

Dump another schema:

```sh
dsql_dump > dump.sql
```

Supported options:

| -a, --data-only | Dump only the data, not the schema (data definitions). |
| -c, --clean | Output commands to DROP all the dumped database objects prior to outputting the commands for creating them. |
| --schema= | Dump a specific schema. |

# Working on this code

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.19. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
