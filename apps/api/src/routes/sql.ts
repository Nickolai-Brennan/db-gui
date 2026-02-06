import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createTargetPool } from "../targetDb";

export async function sqlRoutes(app: FastifyInstance) {
  app.post("/api/v1/sql/test", async (req) => {
    const Body = z.object({
      targetDatabaseUrl: z.string().min(10),
      sql: z.string().min(1),
      rowCap: z.number().int().default(25),
      timeoutMs: z.number().int().default(2500),
    });
    const body = Body.parse(req.body);

    const pool = createTargetPool(body.targetDatabaseUrl);

    try {
      const result: any = await Promise.race([
        pool.query(body.sql),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout exceeded")), body.timeoutMs)
        ),
      ]);

      const rows = result.rows.slice(0, body.rowCap);
      const columns = result.fields.map((f: any) => ({ name: f.name, type: f.dataTypeID }));

      // Suggest mapping based on column names
      const mappingSuggestions = guessMappingFromColumns(columns);

      return { rows, columns, mappingSuggestions };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        rows: [],
        columns: [],
      };
    } finally {
      await pool.end().catch(() => {});
    }
  });
}

function guessMappingFromColumns(columns: { name: string; type: number }[]) {
  const names = columns.map((c) => c.name.toLowerCase());

  // Check for table target
  if (names.includes("schema") && names.includes("table")) {
    return {
      targetKind: "table",
      fields: ["schema", "table"],
    };
  }

  // Check for column target
  if (names.includes("schema") && names.includes("table") && names.includes("column")) {
    return {
      targetKind: "column",
      fields: ["schema", "table", "column"],
    };
  }

  // Check for relationship target
  if (
    names.includes("child_schema") &&
    names.includes("child_table") &&
    names.includes("parent_table")
  ) {
    return {
      targetKind: "relationship",
      fields: ["child_schema", "child_table", "parent_schema", "parent_table"],
    };
  }

  return null;
}
