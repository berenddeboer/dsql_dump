import type { Sql } from "../db"

export interface Constraint {
  name: string;
  schema: string;
  tableName: string;
  owner: string;
  type: "p" | "u" | "f" | "c" | "x"; // primary, unique, foreign, check, exclusion
  definition: string;
}

export class ConstraintExtractor {
  constructor(private sql: Sql) {}

  async extractConstraints(schemaName: string): Promise<Constraint[]> {
    const rows = await this.sql`
      SELECT
        c.conname as constraint_name,
        n.nspname as schema_name,
        t.relname as table_name,
        pg_get_userbyid(t.relowner) as owner,
        c.contype as constraint_type,
        pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = ${schemaName}
        AND t.relkind = 'r'
      ORDER BY
        -- Order constraints by dependency: primary key, unique, check, foreign key
        CASE c.contype
          WHEN 'p' THEN 1
          WHEN 'u' THEN 2
          WHEN 'c' THEN 3
          WHEN 'f' THEN 4
          WHEN 'x' THEN 5
          ELSE 6
        END,
        t.relname,
        c.conname
    `

    return rows.map(row => ({
      name: row.constraint_name as string,
      schema: row.schema_name as string,
      tableName: row.table_name as string,
      owner: row.owner as string,
      type: row.constraint_type as "p" | "u" | "f" | "c" | "x",
      definition: row.definition as string,
    }))
  }

  formatConstraint(constraint: Constraint, clean: boolean = false): string {
    const lines: string[] = []

    // const constraintTypeNames = {
    //   'p': 'PRIMARY KEY',
    //   'u': 'UNIQUE',
    //   'f': 'FOREIGN KEY',
    //   'c': 'CHECK',
    //   'x': 'EXCLUSION'
    // };

    // const typeName = constraintTypeNames[constraint.type] || 'CONSTRAINT';

    // Add pg_dump style comment
    lines.push("--")
    lines.push(`-- Name: ${constraint.name}; Type: CONSTRAINT; Schema: ${constraint.schema}; Owner: ${constraint.owner}; Table: ${constraint.tableName}`)
    lines.push("--")
    lines.push("")

    // Add DROP statement if clean option is enabled
    if (clean) {
      lines.push(`ALTER TABLE IF EXISTS ${this.quoteIdentifier(constraint.schema)}.${this.quoteIdentifier(constraint.tableName)} DROP CONSTRAINT IF EXISTS ${this.quoteIdentifier(constraint.name)};`)
      lines.push("")
    }

    // Add the constraint
    lines.push(`ALTER TABLE ONLY ${this.quoteIdentifier(constraint.schema)}.${this.quoteIdentifier(constraint.tableName)}`)
    lines.push(`    ADD CONSTRAINT ${this.quoteIdentifier(constraint.name)} ${constraint.definition};`)
    lines.push("")

    return lines.join("\n")
  }

  /**
   * Get constraints that should be included in CREATE TABLE statements
   * (primary keys and unique constraints that are NOT deferred)
   */
  getInlineConstraints(constraints: Constraint[], tableName: string): Constraint[] {
    return constraints.filter(c =>
      c.tableName === tableName &&
      (c.type === "p" || c.type === "u") &&
      !c.definition.toLowerCase().includes("deferrable"),
    )
  }

  /**
   * Get constraints that should be added as separate ALTER TABLE statements
   * (foreign keys, check constraints, deferred constraints)
   */
  getPostTableConstraints(constraints: Constraint[]): Constraint[] {
    return constraints.filter(c =>
      c.type === "f" ||
      c.type === "c" ||
      c.type === "x" ||
      c.definition.toLowerCase().includes("deferrable"),
    )
  }

  private quoteIdentifier(identifier: string): string {
    // Quote identifier if it contains uppercase, spaces, or is a reserved word
    if (/[A-Z\s]/.test(identifier) || this.isReservedWord(identifier)) {
      return `"${identifier.replace(/"/g, '""')}"`
    }
    return identifier
  }

  private isReservedWord(word: string): boolean {
    // Simplified list of PostgreSQL reserved words
    const reserved = ["table", "select", "insert", "update", "delete", "from", "where", "group", "order", "by", "constraint"]
    return reserved.includes(word.toLowerCase())
  }
}
