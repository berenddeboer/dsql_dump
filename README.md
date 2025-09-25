# About

`dsql_dump` is a utility to dump your DSQL database as SQL, much like
what `pg_dump` does. It allows you to take a DSQL database, and
restore it to local postgres database for example.

If you find this utility useful, please [star it on github](https://github.com/berenddeboer/dsql_dump).

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
dsql_dump --schema test > dump.sql
```

Supported options:

| Option                    | Description                                                                                                 |
|---------------------------|-------------------------------------------------------------------------------------------------------------|
| -h, --host <host>         | DSQL cluster hostname (default: PGHOST or localhost)                                                       |
| -n, --schema <schema>     | Dump the named schema only (default: public)                                                               |
| -a, --data-only           | Dump only the data, not the schema (data definitions)                                                      |
| -s, --schema-only         | Dump only the schema (data definitions), not the data                                                       |
| -c, --clean               | Output commands to DROP all the dumped database objects prior to outputting the commands for creating them |
| --help                    | Display help for command                                                                                    |
| --version                 | Display version number                                                                                      |

# Status

This package is in its works for me
days. [Contributions](./CONTRIBUTION.md) greatly appreciated!
