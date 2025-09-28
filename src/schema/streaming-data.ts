import type { Sql } from "../db"
import type { Table } from "./tables"
import { quoteIdentifier } from "../utils/sql-utils"

export class StreamingDataExtractor {
  constructor(private sql: Sql) {}

  async streamTableData(table: Table, output: NodeJS.WritableStream): Promise<void> {
    // Write header comments for pg_dump compatibility
    const header = `--
-- Data for Name: ${table.name}; Type: TABLE DATA; Schema: ${table.schema}; Owner: ${table.owner}
--

`
    output.write(header)

    // Build column list for COPY statement - just use column names directly
    const columnList = table.columns.map(col => quoteIdentifier(col.name)).join(", ")

    // Write COPY header using proper identifier quoting
    const tableName = `${quoteIdentifier(table.schema)}.${quoteIdentifier(table.name)}`
    const copyHeader = `COPY ${tableName} (${columnList}) FROM stdin;\n`
    output.write(copyHeader)

    // Use PostgreSQL's native COPY TO STDOUT - no data transformation needed
    const copyQuery = this.sql.unsafe(`COPY ${tableName} TO STDOUT`)
    const readableStream = await copyQuery.readable()

    return new Promise<void>((resolve, reject) => {
      readableStream.on("data", (chunk) => {
        output.write(chunk)
      })

      readableStream.on("end", () => {
        // Write COPY terminator
        output.write("\\.\n\n")
        resolve()
      })

      readableStream.on("error", (error) => {
        reject(error)
      })
    })
  }
}
