import type { Sql } from '../db';
import type { Table } from './tables';

export class DataExtractor {
  constructor(private sql: Sql) {}

  async dumpTableData(table: Table): Promise<string> {
    const lines: string[] = [];

    // Add pg_dump style comment
    lines.push('--');
    lines.push(`-- Data for Name: ${table.name}; Type: TABLE DATA; Schema: ${table.schema}; Owner: ${table.owner}`);
    lines.push('--');
    lines.push('');

    const tableName = `${this.quoteIdentifier(table.schema)}.${this.quoteIdentifier(table.name)}`;
    const columnList = table.columns.map(col => this.quoteIdentifier(col.name)).join(', ');

    lines.push(`COPY ${tableName} (${columnList}) FROM stdin;`);

    try {
      // Select all data from the table
      const selectQuery = `SELECT ${columnList} FROM ${tableName}`;
      const rows = await this.sql.unsafe(selectQuery);

      // Convert each row to COPY format
      for (const row of rows) {
        const values = table.columns.map(col => {
          const value = (row as any)[col.name];
          return this.formatCopyValue(value);
        }).join('\t');
        lines.push(values);
      }
    } catch (error) {
      // If table has no data or SELECT fails, just continue
      console.error(`Warning: Could not dump data for table ${table.name}:`, error);
    }

    // Add COPY terminator
    lines.push('\\.');
    lines.push('');

    return lines.join('\n');
  }

  private formatCopyValue(value: any): string {
    if (value === null || value === undefined) {
      return '\\N';
    }

    // Handle Date objects and JavaScript date strings
    if (value instanceof Date) {
      return this.formatDateForCopy(value);
    }

    // Handle JavaScript date string format like "Tue Sep 23 2025 01:20:37 GMT+1200 (New Zealand Standard Time)"
    if (typeof value === 'string' && value.match(/^\w{3} \w{3} \d{1,2} \d{4} \d{2}:\d{2}:\d{2}/)) {
      try {
        return this.formatDateForCopy(new Date(value));
      } catch {
        // If parsing fails, fall through to string handling
      }
    }

    const str = String(value);

    // Escape special characters for COPY format
    return str
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/\t/g, '\\t') // Escape tabs
      .replace(/\n/g, '\\n') // Escape newlines
      .replace(/\r/g, '\\r'); // Escape carriage returns
  }

  private formatDateForCopy(date: Date): string {
    // Format to match pg_dump: YYYY-MM-DD HH:MM:SS.ffffff
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    const microseconds = String(date.getMilliseconds() * 1000).padStart(6, '0');

    return `${year}-${month}-${day} ${hour}:${minute}:${second}.${microseconds}`;
  }

  private quoteIdentifier(identifier: string): string {
    // Quote identifier if it contains uppercase, spaces, or is a reserved word
    if (/[A-Z\s]/.test(identifier) || this.isReservedWord(identifier)) {
      return `"${identifier.replace(/"/g, '""')}"`;
    }
    return identifier;
  }

  private isReservedWord(word: string): boolean {
    // Simplified list of PostgreSQL reserved words - could be expanded
    const reserved = ['table', 'select', 'insert', 'update', 'delete', 'from', 'where', 'group', 'order', 'by'];
    return reserved.includes(word.toLowerCase());
  }
}
