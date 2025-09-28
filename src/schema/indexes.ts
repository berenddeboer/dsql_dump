import type { Sql } from "../db"
import { quoteIdentifier } from "../utils/sql-utils"

export interface Index {
  name: string;
  schema: string;
  tableName: string;
  owner: string;
  definition: string;
  isUnique: boolean;
  isPrimaryKey: boolean;
  isConstraintIndex: boolean; // True if this index backs a constraint
}

export class IndexExtractor {
  constructor(private sql: Sql) {}

  async extractIndexes(schemaName: string): Promise<Index[]> {
    const rows = await this.sql`
      SELECT
        i.relname as index_name,
        n.nspname as schema_name,
        t.relname as table_name,
        pg_get_userbyid(i.relowner) as owner,
        pg_get_indexdef(i.oid) as definition,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary,
        -- Check if this index is backing a constraint
        CASE
          WHEN c.conindid IS NOT NULL THEN true
          ELSE false
        END as is_constraint_index
      FROM pg_class i
      JOIN pg_namespace n ON n.oid = i.relnamespace
      JOIN pg_index ix ON ix.indexrelid = i.oid
      JOIN pg_class t ON t.oid = ix.indrelid
      LEFT JOIN pg_constraint c ON c.conindid = i.oid
      WHERE i.relkind = 'i'
        AND n.nspname = ${schemaName}
        AND t.relkind = 'r'
      ORDER BY t.relname, i.relname
    `

    return rows.map(row => ({
      name: row.index_name as string,
      schema: row.schema_name as string,
      tableName: row.table_name as string,
      owner: row.owner as string,
      definition: row.definition as string,
      isUnique: row.is_unique as boolean,
      isPrimaryKey: row.is_primary as boolean,
      isConstraintIndex: row.is_constraint_index as boolean,
    }))
  }

  formatCreateIndex(index: Index, clean: boolean = false): string {
    const lines: string[] = []

    // Skip indexes that back constraints - they will be created by the constraints
    if (index.isConstraintIndex) {
      return ""
    }

    // Add pg_dump style comment
    lines.push("--")
    lines.push(`-- Name: ${index.name}; Type: INDEX; Schema: ${index.schema}; Owner: ${index.owner}`)
    lines.push("--")
    lines.push("")

    // Add DROP statement if clean option is enabled
    if (clean) {
      lines.push(`DROP INDEX IF EXISTS ${quoteIdentifier(index.schema)}.${quoteIdentifier(index.name)};`)
      lines.push("")
    }

    // Reformat the index definition with quoted identifiers
    const quotedDefinition = this.reformatIndexDefinition(index.definition)
    lines.push(`${quotedDefinition};`)
    lines.push("")

    return lines.join("\n")
  }

  private reformatIndexDefinition(definition: string): string {
    // Parse the CREATE INDEX statement and quote all identifiers
    // Example: "CREATE INDEX index_name ON schema.table (col1, col2)"
    // Becomes: "CREATE INDEX \"index_name\" ON \"schema\".\"table\" (\"col1\", \"col2\")"

    // Remove DSQL-specific USING clause first
    let cleanDef = definition.replace(/ USING btree_index /, " ")

    // Pattern to match CREATE [UNIQUE] INDEX index_name ON schema.table (columns)
    const createIndexPattern = /^(CREATE\s+(?:UNIQUE\s+)?INDEX\s+)(\w+)(\s+ON\s+)(\w+)\.(\w+)(\s*\([^(]+\))/i
    const match = cleanDef.match(createIndexPattern)

    if (match && match[2] && match[4] && match[5]) {
      const createPart = match[1] || ""
      const indexName = match[2]
      const onPart = match[3] || ""
      const schemaName = match[4]
      const tableName = match[5]
      const columnsPart = match[6] || ""

      // Quote the identifiers
      const quotedIndexName = quoteIdentifier(indexName)
      const quotedSchemaName = quoteIdentifier(schemaName)
      const quotedTableName = quoteIdentifier(tableName)

      // Handle column names in parentheses
      const columnsMatch = columnsPart.match(/\((.*)\)/)
      if (columnsMatch && columnsMatch[1]) {
        const columns = columnsMatch[1].split(",").map(col => {
          const trimmedCol = col.trim()
          // Don't quote if it's already an expression or function call
          if (trimmedCol.includes("(") || trimmedCol.includes(")")) {
            return trimmedCol
          }
          return quoteIdentifier(trimmedCol)
        }).join(", ")

        return `${createPart}${quotedIndexName}${onPart}${quotedSchemaName}.${quotedTableName} (${columns})`
      }

      return `${createPart}${quotedIndexName}${onPart}${quotedSchemaName}.${quotedTableName}${columnsPart}`
    }

    // If pattern doesn't match, return the original (shouldn't happen with standard index definitions)
    return cleanDef
  }


}
