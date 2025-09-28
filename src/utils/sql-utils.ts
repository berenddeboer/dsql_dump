// Shared utility functions for SQL identifier and literal handling

export function quoteIdentifier(identifier: string): string {
  // Always quote identifiers - this is the safest approach
  // Escape any existing double quotes by doubling them
  return `"${identifier.replace(/"/g, '""')}"`
}

export function quoteLiteral(literal: string): string {
  // Escape single quotes by doubling them
  return `'${literal.replace(/'/g, "''")}'`
}
