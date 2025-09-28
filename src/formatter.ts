import { quoteIdentifier } from "./utils/sql-utils"

export interface DumpOptions {
  schema: string;
  clean: boolean;
  dataOnly: boolean;
}

export class OutputFormatter {
  constructor(private version: string) {}

  formatHeader(options: DumpOptions): string {
    const lines: string[] = []

    lines.push("--")
    lines.push("-- DSQL database dump")
    lines.push("--")
    lines.push("")
    lines.push(`-- Dumped by dsql_dump version ${this.version}`)
    lines.push(`-- Dumped on ${new Date().toISOString()}`)
    lines.push("")
    lines.push("SET client_encoding = 'UTF8';")
    lines.push("SELECT pg_catalog.set_config('search_path', '', false);")
    lines.push("")

    // Set search path if not using public schema
    if (options.schema !== "public") {
      lines.push(`SET search_path = ${quoteIdentifier(options.schema)}, pg_catalog;`)
      lines.push("")
    }

    return lines.join("\n")
  }

  formatFooter(): string {
    const lines: string[] = []

    lines.push("--")
    lines.push("-- DSQL database dump complete")
    lines.push("--")

    return lines.join("\n")
  }

  formatSectionComment(sectionName: string): string {
    const lines: string[] = []

    lines.push("--")
    lines.push(`-- ${sectionName}`)
    lines.push("--")
    lines.push("")

    return lines.join("\n")
  }


}
