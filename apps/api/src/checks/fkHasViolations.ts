import type { Pool } from "pg";
import type { FkMeta } from "./fkMeta";

export type FkViolation = {
  fk: FkMeta;
  violatingCount: number;
  sample: Record<string, any>[];
};

function qIdent(s: string) {
  return '"' + s.replace(/"/g, '""') + '"';
}

export async function checkFkHasViolations(
  pool: Pool,
  fks: FkMeta[],
  sampleLimit = 25
): Promise<{ violations: FkViolation[] }> {
  const out: FkViolation[] = [];

  for (const fk of fks) {
    const child = `${qIdent(fk.child_schema)}.${qIdent(fk.child_table)}`;
    const parent = `${qIdent(fk.parent_schema)}.${qIdent(fk.parent_table)}`;

    const joinPred = fk.child_cols
      .map((c, i) => `c.${qIdent(c)} = p.${qIdent(fk.parent_cols[i]!)}`)
      .join(" AND ");

    const notNullPred = fk.child_cols.map((c) => `c.${qIdent(c)} IS NOT NULL`).join(" AND ");
    const isOrphanPred = `p.${qIdent(fk.parent_cols[0]!)} IS NULL`;

    const countSql = `
      SELECT COUNT(*)::bigint AS cnt
      FROM ${child} c
      LEFT JOIN ${parent} p ON ${joinPred}
      WHERE (${notNullPred})
        AND ${isOrphanPred};
    `;

    const sampleSql = `
      SELECT c.*
      FROM ${child} c
      LEFT JOIN ${parent} p ON ${joinPred}
      WHERE (${notNullPred})
        AND ${isOrphanPred}
      LIMIT $1;
    `;

    const cntRes = await pool.query<{ cnt: string }>(countSql);
    const cnt = Number(cntRes.rows[0]?.cnt ?? 0);

    if (cnt > 0) {
      const sampleRes = await pool.query(sampleSql, [sampleLimit]);
      out.push({
        fk,
        violatingCount: cnt,
        sample: sampleRes.rows,
      });
    }
  }

  return { violations: out };
}
