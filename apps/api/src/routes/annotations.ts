import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../sql';

const UUIDSchema = z.string().uuid();

function sevRank(sev: string) {
  return sev === 'blocking' ? 3 : sev === 'error' ? 2 : sev === 'warning' ? 1 : 0;
}

export async function annotationsRoutes(app: FastifyInstance) {
  app.get('/api/v1/checklist-instances/:instanceId/annotations', async (req) => {
    const instanceId = UUIDSchema.parse((req.params as any).instanceId);

    const rows = await query<any>(
      `
      SELECT status, severity, output
      FROM checklist_instance_results
      WHERE instance_id = $1
        AND status IN ('blocked','fail','warning')
      `,
      [instanceId],
    );

    const tableMap = new Map<string, { severity: string; count: number }>();
    const relMap = new Map<string, { severity: string; count: number; ref: any }>();

    for (const r of rows) {
      const targets = r.output?.targets ?? [];
      for (const t of targets) {
        if (t.kind === 'table') {
          const key = `${t.schema}.${t.table}`;
          const existing = tableMap.get(key);
          if (!existing) {
            tableMap.set(key, { severity: r.severity, count: 1 });
          } else {
            if (sevRank(r.severity) > sevRank(existing.severity)) existing.severity = r.severity;
            existing.count += 1;
          }
        }

        if (t.kind === 'relationship') {
          const childCols = (t.childCols ?? []).join(',');
          const parentCols = (t.parentCols ?? []).join(',');
          const key = `${t.childSchema}.${t.childTable}(${childCols})->${t.parentSchema ?? ''}.${t.parentTable ?? ''}(${parentCols})`;

          const existing = relMap.get(key);
          const ref = {
            childSchema: t.childSchema,
            childTable: t.childTable,
            childCols: t.childCols ?? [],
            parentSchema: t.parentSchema,
            parentTable: t.parentTable,
            parentCols: t.parentCols ?? [],
            fkName: t.fkName,
          };

          if (!existing) {
            relMap.set(key, { severity: r.severity, count: 1, ref });
          } else {
            if (sevRank(r.severity) > sevRank(existing.severity)) existing.severity = r.severity;
            existing.count += 1;
          }
        }
      }
    }

    const tables = Array.from(tableMap.entries()).map(([k, v]) => {
      const [schema, table] = k.split('.');
      return { schema, table, severity: v.severity, count: v.count };
    });

    const relationships = Array.from(relMap.values()).map((v) => ({
      ...v.ref,
      severity: v.severity,
      count: v.count,
    }));

    return { instanceId, tables, relationships };
  });
}
