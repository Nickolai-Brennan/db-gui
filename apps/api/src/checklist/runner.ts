import type { Pool } from "pg";
import { createTargetPool } from "../targetDb";
import { query, queryOne } from "../sql";
import type { UUID } from "../types";
import { ensureInstanceResults } from "./ensureResults";
import { recomputeInstanceRollup } from "./rollup";

import { checkNoPrimaryKey } from "../checks/noPrimaryKey";
import { checkFkNotIndexed } from "../checks/fkNotIndexed";
import { getForeignKeys } from "../checks/fkMeta";
import { checkFkHasViolations } from "../checks/fkHasViolations";
import { runSqlCheck } from "../sqlrunner/runSqlCheck";

type RunInput = {
  instanceId: UUID;
  targetDatabaseUrl: string;
  schemas: string[];
  mode: "all" | "items";
  nodeIds?: UUID[];
};

function nowMs() {
  return Date.now();
}

function statusFor(severity: string, violationsCount: number) {
  if (violationsCount <= 0) return "pass";
  if (severity === "blocking") return "blocked";
  if (severity === "warning") return "warning";
  return "fail";
}

export async function runChecklist(input: RunInput) {
  const { instanceId, targetDatabaseUrl, schemas, mode, nodeIds } = input;

  await ensureInstanceResults(instanceId);

  // Try v2 first, fallback to v1
  let inst;
  try {
    inst = await queryOne<any>(
      `SELECT id, template_version_id FROM checklist_instances_v2 WHERE id=$1`,
      [instanceId]
    );
  } catch {
    inst = await queryOne<any>(
      `SELECT id, template_version_id FROM checklist_instances WHERE id=$1`,
      [instanceId]
    );
  }

  const params: any[] = [inst.template_version_id];
  let where = `WHERE n.template_version_id=$1 AND n.node_type='item'`;
  // Try v2 first, fall back to v1
  let inst;
  let items;
  
  try {
    inst = await queryOne<any>(
      `SELECT id, template_version_id, scope_ref FROM checklist_instances_v2 WHERE id=$1`,
      [instanceId]
    );

    const params: any[] = [inst.template_version_id];
    let where = `WHERE n.template_version_id=$1 AND n.node_type='item' AND (n.check_kind IS NOT NULL OR n.check_ref IS NOT NULL)`;

    if (mode === "items" && nodeIds && nodeIds.length > 0) {
      params.push(nodeIds);
      where += ` AND n.id = ANY($2::uuid[])`;
    }

    items = await query<any>(
      `
      SELECT n.id AS node_id, n.check_kind, n.check_ref, n.severity, 
             n.sql_template, n.result_mapping, n.pass_fail_rule
      FROM checklist_nodes_v2 n
      ${where}
      `,
      params
    );
  } catch (err: any) {
    // Log and fallback to v1 schema if v2 doesn't exist
    console.warn('Falling back to v1 schema:', err.message);
    
    inst = await queryOne<any>(
      `SELECT id, template_version_id FROM checklist_instances WHERE id=$1`,
      [instanceId]
    );

    const params: any[] = [inst.template_version_id];
    let where = `WHERE n.version_id=$1 AND n.node_type='check' AND n.check_code IS NOT NULL`;

  // Try v2 nodes first, fallback to v1
  let items;
  try {
    items = await query<any>(
      `
      SELECT n.id AS node_id, n.check_ref AS check_code, n.check_kind, n.severity, 
             n.sql_template, n.result_mapping, n.pass_fail_rule
      FROM checklist_nodes_v2 n
      ${where}
      `,
      params
    );
  } catch {
    // Fallback to v1 structure
    if (mode === "items" && nodeIds && nodeIds.length > 0) {
      params.push(nodeIds);
      where += ` AND n.id = ANY($2::uuid[])`;
    }

    items = await query<any>(
      `
      SELECT n.id AS node_id, n.check_code, n.severity
      FROM checklist_nodes n
      WHERE n.version_id=$1 AND n.node_type='check' AND n.check_code IS NOT NULL
      `,
      [inst.template_version_id]
      ${where}
      `,
      params
    );
  }

  const targetPool: Pool = createTargetPool(targetDatabaseUrl);

  try {
    const fks = await getForeignKeys(targetPool, schemas);

    for (const item of items) {
      const start = nowMs();
      const checkKind = item.check_kind as string | null;
      const checkRef = item.check_code as string | null;
      // Support both v1 (check_code) and v2 (check_kind/check_ref) schemas
      const checkKind = item.check_kind || 'BUILTIN';
      const checkRef = item.check_ref || item.check_code as string | null;
      const severity = (item.severity ?? "warning") as string;

      let violationsCount = 0;
      let outputSummary: string | null = null;
      let outputStats: any = null;
      let outputRows: any = null;
      let targetRefs: any[] = [];

      // Handle SQL-based checks
      if (checkKind === 'SQL' && item.sql_template) {
        const result = await runSqlCheck(targetPool, {
          sql_template: item.sql_template,
          result_mapping: item.result_mapping,
          pass_fail_rule: item.pass_fail_rule,
          severity: severity,
        }, {
          schemas: schemas,
          schema: schemas[0], // default to first schema
        });

        violationsCount = result.rowCount;
        outputSummary = result.error || `Found ${result.rowCount} issue(s)`;
        outputStats = { violationsCount: result.rowCount };
        outputRows = result.outputRows;
        targetRefs = result.targets;

        const status = result.status;
        const durationMs = result.duration;

        // Update result in v2 table
        try {
          await query(
            `
            UPDATE checklist_instance_results_v2 r
            SET
              status=$3,
              severity=$4,
              run_type='automatic',
              output_summary=$5,
              output_rows=$6,
              output_stats=$7,
              target_ref=$8,
              ran_at=now(),
              duration_ms=$9
            WHERE r.instance_id=$1 AND r.node_id=$2
            `,
            [
              instanceId,
              item.node_id,
              status,
              severity,
              outputSummary,
              JSON.stringify(outputRows),
              JSON.stringify(outputStats),
              JSON.stringify({ targets: targetRefs }),
              durationMs,
            ]
          );
        } catch {
          // Fallback to v1 table structure
          await query(
            `
            UPDATE checklist_instance_results r
            SET
              status=$3,
              output=$4,
              executed_at=now()
            WHERE r.instance_id=$1 AND r.node_id=$2
            `,
            [
              instanceId,
              item.node_id,
              status,
              {
                summary: outputSummary,
                stats: outputStats,
                rows: outputRows,
                targets: targetRefs,
                durationMs,
              },
            ]
          );
        }
        continue;
      }

      // Handle built-in checks (existing logic)
      if (!checkRef) continue;
      if (!checkRef && !item.sql_template) continue;

      // Handle SQL_TEMPLATE checks
      if (checkKind === 'SQL_TEMPLATE' && item.sql_template) {
        try {
          // Whitelist and validate scope_ref properties
          const allowedScopeKeys = ['schema', 'table', 'column', 'schemas', 'tables'];
          const scopeVars: Record<string, any> = {};
          
          if (inst.scope_ref && typeof inst.scope_ref === 'object') {
            for (const key of allowedScopeKeys) {
              if (key in inst.scope_ref) {
                scopeVars[key] = inst.scope_ref[key];
              }
            }
          }
          
          const vars = {
            schema: schemas[0] || '',
            schemas: schemas,
            ...scopeVars,
          };
          
          const result = await runSqlCheck(targetPool, {
            id: item.node_id,
            sql_template: item.sql_template,
            result_mapping: item.result_mapping,
            pass_fail_rule: item.pass_fail_rule,
            severity: severity,
          }, vars);
          
          violationsCount = result.status === 'pass' ? 0 : 1;
          outputSummary = `${result.outputStats.rowCount} rows returned`;
          outputStats = result.outputStats;
          outputRows = result.outputRows;
          targetRefs = result.targets;
        } catch (err: any) {
          outputSummary = `SQL execution error: ${err.message}`;
          violationsCount = 1;
          outputStats = { error: err.message };
        }
      }
      // Handle builtin checks
      else if (checkRef === "NO_PRIMARY_KEY") {
        const res = await checkNoPrimaryKey(targetPool, schemas);
        violationsCount = res.violations.length;
        outputSummary = `${violationsCount} tables missing primary key`;
        outputStats = { violationsCount };
        outputRows = res.violations.slice(0, 50);

        targetRefs = res.violations.map((v) => ({
          kind: "table",
          schema: v.schema,
          table: v.table,
        }));
      }

      if (checkRef === "FK_NOT_INDEXED") {
        const res = await checkFkNotIndexed(targetPool, schemas);
        violationsCount = res.violations.length;
        outputSummary = `${violationsCount} foreign keys missing a supporting index`;
        outputStats = { violationsCount };
        outputRows = res.violations.slice(0, 50);

        targetRefs = res.violations.map((v) => ({
          kind: "relationship",
          fkName: v.fk_name,
          childSchema: v.child_schema,
          childTable: v.child_table,
          childCols: v.child_cols,
        }));
      }

      if (checkRef === "FK_HAS_VIOLATIONS") {
        const res = await checkFkHasViolations(targetPool, fks, 25);
        violationsCount = res.violations.length;
        outputSummary = `${violationsCount} foreign keys have violating rows`;
        outputStats = {
          violatingRelationships: violationsCount,
          totalViolatingRows: res.violations.reduce((a, v) => a + v.violatingCount, 0),
        };
        outputRows = res.violations.slice(0, 20).map((v) => ({
          fk: v.fk,
          violatingCount: v.violatingCount,
          sample: v.sample,
        }));

        targetRefs = res.violations.map((v) => ({
          kind: "relationship",
          fkName: v.fk.fk_name,
          childSchema: v.fk.child_schema,
          childTable: v.fk.child_table,
          childCols: v.fk.child_cols,
          parentSchema: v.fk.parent_schema,
          parentTable: v.fk.parent_table,
          parentCols: v.fk.parent_cols,
        }));
      }

      const status = statusFor(severity, violationsCount);
      const durationMs = nowMs() - start;

      // Try v2 first, fall back to v1
      try {
        await query(
          `
          UPDATE checklist_instance_results_v2 r
          SET
            status=$3,
            severity=$4,
            run_type='automatic',
            target_ref=$5,
            output_summary=$6,
            output_rows=$7,
            output_stats=$8,
            ran_at=now(),
            duration_ms=$9,
            updated_at=now()
          WHERE r.instance_id=$1 AND r.node_id=$2
          `,
          [
            instanceId,
            item.node_id,
            status,
            severity,
            JSON.stringify({ targets: targetRefs }),
            outputSummary,
            JSON.stringify(outputRows),
            JSON.stringify(outputStats),
            durationMs,
          ]
        );
      } catch (err: any) {
        // Log and fallback to v1 schema
        console.warn('Falling back to v1 results schema:', err.message);
        
        await query(
          `
          UPDATE checklist_instance_results r
          SET
            status=$3,
            severity=$4,
            run_type='automatic',
            issue_count=$5,
            pass_count=$6,
            output=$7,
            executed_at=now()
          WHERE r.instance_id=$1 AND r.node_id=$2
          `,
          [
            instanceId,
            item.node_id,
            status,
            severity,
            violationsCount,
            violationsCount > 0 ? 0 : 1,
            {
              summary: outputSummary,
              stats: outputStats,
              rows: outputRows,
              targets: targetRefs,
              durationMs,
            },
          ]
        );
      }
    }

    const rollup = await recomputeInstanceRollup(instanceId);
    return { ok: true, rollup };
  } finally {
    await targetPool.end().catch(() => {});
  }
}
