import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPgSnapshot } from "../introspect/pgSnapshot";
import { createTargetPool } from "../targetDb";
import { qColumns, qIndexes } from "../introspect/pgQueries";

export async function introspectRoutes(app: FastifyInstance) {
  // TODO: Add rate limiting for production use
  // These endpoints access target databases and should be rate-limited to prevent abuse
  app.post("/api/v1/introspect/postgres/snapshot", async (req) => {
    const Body = z.object({
      targetDatabaseUrl: z.string().min(10),
      schemas: z.array(z.string().min(1)).min(1),
    });
    const body = Body.parse(req.body);

    const snapshot = await getPgSnapshot(body.targetDatabaseUrl, body.schemas);
    return { snapshot };
  });

  app.post("/api/v1/introspect/postgres/table-detail", async (req) => {
    const Body = z.object({
      targetDatabaseUrl: z.string().min(10),
      schema: z.string().min(1),
      table: z.string().min(1),
    });
    const body = Body.parse(req.body);

    const pool = createTargetPool(body.targetDatabaseUrl);
    try {
      const schemas = [body.schema];

      const [colsRes, idxRes] = await Promise.all([
        pool.query(qColumns, [schemas]),
        pool.query(qIndexes, [schemas]),
      ]);

      const columns = colsRes.rows.filter(
        (r: any) => r.schema === body.schema && r.table === body.table
      );
      const indexes = idxRes.rows.filter(
        (r: any) => r.schema === body.schema && r.table === body.table
      );

      return { schema: body.schema, table: body.table, columns, indexes };
    } finally {
      await pool.end().catch(() => {});
    }
  });
}
