import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createTargetPool } from "../targetDb";
import { validateReadOnly } from "../sqlrunner/readonly";
import { executeWithLimits } from "../sqlrunner/limits";
import { suggestMapping } from "../sqlrunner/suggestMapping";

export async function sqlRoutes(app: FastifyInstance) {
  // TODO: Add rate limiting for production use - this endpoint accesses target databases
  app.post("/api/v1/sql/test", async (req) => {
    const Body = z.object({
      targetDatabaseUrl: z.string().min(10),
      sql: z.string().min(1),
      rowCap: z.number().int().default(25),
      timeoutMs: z.number().int().default(2500),
      variables: z.record(z.any()).optional(),
    });
    const body = Body.parse(req.body);

    try {
      // Validate read-only
      validateReadOnly(body.sql);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        rows: [],
        columns: [],
      };
    }

    const pool = createTargetPool(body.targetDatabaseUrl);

    try {
      const { rows, fields, duration } = await executeWithLimits(pool, body.sql, {
        timeoutMs: body.timeoutMs,
        rowCap: body.rowCap,
      });

      const columns = fields.map((f: any) => ({ name: f.name, type: f.dataTypeID }));
      const mappingSuggestions = suggestMapping(columns);

      return {
        rows,
        columns,
        mappingSuggestions,
        duration,
      };
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
