import { describe, expect, test } from "bun:test"
import { IndexExtractor, type Index } from "./indexes"

const index: Index = {
  name: "student_school_email_unique",
  schema: "public",
  tableName: "student",
  owner: "admin",
  definition: "CREATE UNIQUE INDEX student_school_email_unique ON public.student (school_id, email)",
  isUnique: true,
  isPrimaryKey: false,
  isConstraintIndex: false,
}

describe("IndexExtractor", () => {
  test("formats regular index DDL by default", () => {
    const extractor = new IndexExtractor(null as never)

    expect(extractor.formatCreateIndex(index)).toContain(
      "CREATE UNIQUE INDEX \"student_school_email_unique\" ON \"public\".\"student\" (\"school_id\", \"email\");",
    )
  })

  test("formats DSQL-compatible index DDL", () => {
    const extractor = new IndexExtractor(null as never)

    expect(extractor.formatCreateIndex(index, false, true)).toContain(
      "CREATE UNIQUE INDEX ASYNC \"student_school_email_unique\" ON \"public\".\"student\" (\"school_id\", \"email\");",
    )
  })
})
