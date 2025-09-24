import type { Sql } from '../db';

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
    `;

    return rows.map(row => ({
      name: row.index_name as string,
      schema: row.schema_name as string,
      tableName: row.table_name as string,
      owner: row.owner as string,
      definition: row.definition as string,
      isUnique: row.is_unique as boolean,
      isPrimaryKey: row.is_primary as boolean,
      isConstraintIndex: row.is_constraint_index as boolean,
    }));
  }

  formatCreateIndex(index: Index, clean: boolean = false): string {
    const lines: string[] = [];

    // Skip indexes that back constraints - they will be created by the constraints
    if (index.isConstraintIndex) {
      return '';
    }

    // Add pg_dump style comment
    lines.push('--');
    lines.push(`-- Name: ${index.name}; Type: INDEX; Schema: ${index.schema}; Owner: ${index.owner}`);
    lines.push('--');
    lines.push('');

    // Add DROP statement if clean option is enabled
    if (clean) {
      lines.push(`DROP INDEX IF EXISTS ${this.quoteIdentifier(index.schema)}.${this.quoteIdentifier(index.name)};`);
      lines.push('');
    }

    // Use the definition returned by pg_get_indexdef
    lines.push(`${index.definition};`);
    lines.push('');

    return lines.join('\n');
  }

  private quoteIdentifier(identifier: string): string {
    // Quote identifier if it contains uppercase, spaces, or is a reserved word
    if (/[A-Z\s]/.test(identifier) || this.isReservedWord(identifier)) {
      return `"${identifier.replace(/"/g, '""')}"`;
    }
    return identifier;
  }

  private isReservedWord(word: string): boolean {
    // Simplified list of PostgreSQL reserved words
    const reserved = ['table', 'select', 'insert', 'update', 'delete', 'from', 'where', 'group', 'order', 'by', 'index'];
    return reserved.includes(word.toLowerCase());
  }
}