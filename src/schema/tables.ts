import type { Sql } from "../db"
import type { Constraint } from "./constraints"

export interface Column {
  name: string;
  dataType: string;
  notNull: boolean;
  defaultValue?: string;
  comment?: string;
}

export interface Table {
  name: string;
  schema: string;
  owner: string;
  comment?: string;
  columns: Column[];
}

export class TableExtractor {
  constructor(private sql: Sql) {}

  async extractTables(schemaName: string): Promise<Table[]> {
    const rows = await this.sql`
      SELECT
        c.relname as table_name,
        n.nspname as schema_name,
        pg_get_userbyid(c.relowner) as owner,
        obj_description(c.oid, 'pg_class') as table_comment,
        a.attname as column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
        a.attnotnull as not_null,
        pg_get_expr(d.adbin, d.adrelid) as default_value,
        col_description(c.oid, a.attnum) as column_comment,
        a.attnum as column_number
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE c.relkind = 'r'
        AND n.nspname = ${schemaName}
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY c.relname, a.attnum
    `

    const tableMap = new Map<string, Table>()

    for (const row of rows) {
      const tableName = row.table_name as string

      if (!tableMap.has(tableName)) {
        tableMap.set(tableName, {
          name: tableName,
          schema: row.schema_name as string,
          owner: row.owner as string,
          comment: row.table_comment as string | undefined,
          columns: [],
        })
      }

      const table = tableMap.get(tableName)!
      table.columns.push({
        name: row.column_name as string,
        dataType: row.data_type as string,
        notNull: row.not_null as boolean,
        defaultValue: row.default_value as string | undefined,
        comment: row.column_comment as string | undefined,
      })
    }

    return Array.from(tableMap.values())
  }

  formatCreateTable(table: Table, constraints: Constraint[] = [], clean: boolean = false): string {
    const lines: string[] = []

    // Add pg_dump style comment
    lines.push("--")
    lines.push(`-- Name: ${table.name}; Type: TABLE; Schema: ${table.schema}; Owner: ${table.owner}`)
    lines.push("--")
    lines.push("")

    // Add DROP statement if clean option is enabled
    if (clean) {
      lines.push(`DROP TABLE IF EXISTS ${this.quoteIdentifier(table.schema)}.${this.quoteIdentifier(table.name)};`)
      lines.push("")
    }

    // Create table statement
    lines.push(`CREATE TABLE ${this.quoteIdentifier(table.schema)}.${this.quoteIdentifier(table.name)} (`)

    const columnDefinitions = table.columns.map(col => {
      let def = `    ${this.quoteIdentifier(col.name)} ${col.dataType}`

      if (col.defaultValue) {
        def += ` DEFAULT ${col.defaultValue}`
      }

      if (col.notNull) {
        def += " NOT NULL"
      }

      return def
    })

    // Filter for inline constraints (primary keys and non-deferred unique constraints)
    const inlineConstraints = constraints.filter(c =>
      c.tableName === table.name &&
      (c.type === "p" || c.type === "u") &&
      !c.definition.toLowerCase().includes("deferrable"),
    )

    // Add constraints if any exist
    if (inlineConstraints.length > 0) {
      const constraintDefinitions = inlineConstraints.map(constraint =>
        `    CONSTRAINT ${this.quoteIdentifier(constraint.name)} ${constraint.definition}`,
      )
      lines.push(columnDefinitions.join(",\n") + ",")
      lines.push(constraintDefinitions.join(",\n"))
    } else {
      lines.push(columnDefinitions.join(",\n"))
    }

    lines.push(");")

    // Add table comment if present
    if (table.comment) {
      lines.push("")
      lines.push(`COMMENT ON TABLE ${this.quoteIdentifier(table.schema)}.${this.quoteIdentifier(table.name)} IS ${this.quoteLiteral(table.comment)};`)
    }

    // Add column comments if present
    for (const col of table.columns) {
      if (col.comment) {
        lines.push(`COMMENT ON COLUMN ${this.quoteIdentifier(table.schema)}.${this.quoteIdentifier(table.name)}.${this.quoteIdentifier(col.name)} IS ${this.quoteLiteral(col.comment)};`)
      }
    }

    lines.push("")
    return lines.join("\n")
  }

  private quoteIdentifier(identifier: string): string {
    // Quote identifier if it contains uppercase, spaces, or is a reserved word
    if (/[A-Z\s]/.test(identifier) || this.isReservedWord(identifier)) {
      return `"${identifier.replace(/"/g, '""')}"`
    }
    return identifier
  }

  private quoteLiteral(value: string): string {
    return `'${value.replace(/'/g, "''")}'`
  }

  private isReservedWord(word: string): boolean {
    // Simplified list of PostgreSQL reserved words - could be expanded
    const reserved = ["table", "select", "insert", "update", "delete", "from", "where", "group", "order", "by"]
    return reserved.includes(word.toLowerCase())
  }
}
