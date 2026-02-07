import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query, queryOne } from "../sql";
import { buildTree } from "../checklist/tree";

const UUIDSchema = z.string().uuid();

// Helper function to check if version is mutable
async function assertVersionMutable(versionId: string) {
  const result = await query<any>(
    `SELECT status FROM checklist_template_versions_v2 WHERE id = $1`,
    [versionId]
  );
  
  if (result.length === 0) {
    throw new Error('VERSION_NOT_FOUND: Version does not exist');
  }
  
  if (result[0]?.status === 'published') {
    throw new Error('VERSION_IMMUTABLE: Cannot modify published version');
  }
}

// Helper functions
async function checkVersionMutable(versionId: string): Promise<void> {
  const result = await query<any>(
    `
    SELECT status FROM checklist_template_versions_v2 WHERE id = $1
    `,
    [versionId]
  );
  
  if (result[0]?.status === 'published') {
    throw new Error('VERSION_IMMUTABLE');
  }
}

async function checkForCycle(
  nodeId: string,
  newParentId: string
): Promise<boolean> {
  // Check if newParentId is a descendant of nodeId
  const result = await query<any>(
    `
    WITH RECURSIVE descendants AS (
      SELECT id FROM checklist_nodes_v2 WHERE id = $1
      UNION ALL
      SELECT n.id FROM checklist_nodes_v2 n
      JOIN descendants d ON n.parent_id = d.id
    )
    SELECT 1 FROM descendants WHERE id = $2
    `,
    [nodeId, newParentId]
  );
  
  return result.length > 0;
}

export async function nodesRoutes(app: FastifyInstance) {
  // Get nodes tree for a template version
  app.get("/api/v1/checklist-template-versions/:versionId/nodes/tree", async (req) => {
    const versionId = UUIDSchema.parse((req.params as any).versionId);

    const rows = await query<any>(
      `
      SELECT *
      FROM checklist_nodes_v2
      WHERE template_version_id = $1
      ORDER BY sort_order ASC
      `,
      [versionId]
    );

    const tree = buildTree(rows);
    return { tree };
  });

  // Create new node
  app.post("/api/v1/checklist-template-versions/:versionId/nodes", async (req) => {
    const versionId = UUIDSchema.parse((req.params as any).versionId);
    
    // Check if version is mutable
    await assertVersionMutable(versionId);

    // Check if version is published
    await checkVersionMutable(versionId);

    const Body = z.object({
      parentId: z.string().uuid().optional(),
      nodeType: z.enum(["group", "item"]),
      title: z.string().min(1),
      description: z.string().optional(),
      sortOrder: z.number().int().default(0),
      // Item-specific fields
      itemType: z.enum(["manual", "automatic", "hybrid"]).optional(),
      severity: z.enum(["info", "warning", "error", "blocking"]).optional(),
      blocksAction: z.boolean().optional(),
      required: z.boolean().optional(),
      scopeType: z
        .enum(["diagram", "schema", "table", "column", "relationship", "migration_step"])
        .optional(),
      targetSelector: z.any().optional(),
      checkKind: z.string().optional(),
      checkRef: z.string().optional(),
      sqlTemplate: z.string().optional(),
      resultMapping: z.any().optional(),
      passFailRule: z.any().optional(),
      fixKind: z.enum(["none", "manual", "auto_sql"]).optional(),
      fixInstructions: z.string().optional(),
      fixSqlTemplate: z.string().optional(),
    });
    const body = Body.parse(req.body);

    const rows = await query<any>(
      `
      INSERT INTO checklist_nodes_v2 (
        template_version_id, parent_id, node_type, title, description, sort_order,
        item_type, severity, blocks_action, required, scope_type, target_selector,
        check_kind, check_ref, sql_template, result_mapping, pass_fail_rule,
        fix_kind, fix_instructions, fix_sql_template
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
      `,
      [
        versionId,
        body.parentId || null,
        body.nodeType,
        body.title,
        body.description || null,
        body.sortOrder,
        body.itemType || null,
        body.severity || null,
        body.blocksAction || null,
        body.required || null,
        body.scopeType || null,
        body.targetSelector ? JSON.stringify(body.targetSelector) : null,
        body.checkKind || null,
        body.checkRef || null,
        body.sqlTemplate || null,
        body.resultMapping ? JSON.stringify(body.resultMapping) : null,
        body.passFailRule ? JSON.stringify(body.passFailRule) : null,
        body.fixKind || null,
        body.fixInstructions || null,
        body.fixSqlTemplate || null,
      ]
    );

    return { node: rows[0] };
  });

  // Update node
  app.patch("/api/v1/checklist-nodes/:nodeId", async (req) => {
    const nodeId = UUIDSchema.parse((req.params as any).nodeId);

    // Check version status
    const versionCheck = await query<any>(
      `SELECT template_version_id FROM checklist_nodes_v2 WHERE id = $1`,
      [nodeId]
    );
    
    if (versionCheck.length === 0) {
      throw new Error('NODE_NOT_FOUND: Node does not exist');
    }
    
    await assertVersionMutable(versionCheck[0].template_version_id);
    // Check version mutability
    const versionCheck = await query<any>(
      `
      SELECT v.status, v.id FROM checklist_template_versions_v2 v
      JOIN checklist_nodes_v2 n ON v.id = n.template_version_id
      WHERE n.id = $1
      `,
      [nodeId]
    );
    
    if (versionCheck[0]?.status === 'published') {
      throw new Error('Cannot modify nodes in published version');
    }

    const Body = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      sortOrder: z.number().int().optional(),
      itemType: z.enum(["manual", "automatic", "hybrid"]).optional(),
      severity: z.enum(["info", "warning", "error", "blocking"]).optional(),
      blocksAction: z.boolean().optional(),
      required: z.boolean().optional(),
      scopeType: z
        .enum(["diagram", "schema", "table", "column", "relationship", "migration_step"])
        .optional(),
      targetSelector: z.any().optional(),
      checkKind: z.string().optional(),
      checkRef: z.string().optional(),
      sqlTemplate: z.string().optional(),
      resultMapping: z.any().optional(),
      passFailRule: z.any().optional(),
      fixKind: z.enum(["none", "manual", "auto_sql"]).optional(),
      fixInstructions: z.string().optional(),
      fixSqlTemplate: z.string().optional(),
    });
    const body = Body.parse(req.body);

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${idx++}`);
      values.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(body.description);
    }
    if (body.sortOrder !== undefined) {
      updates.push(`sort_order = $${idx++}`);
      values.push(body.sortOrder);
    }
    if (body.itemType !== undefined) {
      updates.push(`item_type = $${idx++}`);
      values.push(body.itemType);
    }
    if (body.severity !== undefined) {
      updates.push(`severity = $${idx++}`);
      values.push(body.severity);
    }
    if (body.blocksAction !== undefined) {
      updates.push(`blocks_action = $${idx++}`);
      values.push(body.blocksAction);
    }
    if (body.required !== undefined) {
      updates.push(`required = $${idx++}`);
      values.push(body.required);
    }
    if (body.scopeType !== undefined) {
      updates.push(`scope_type = $${idx++}`);
      values.push(body.scopeType);
    }
    if (body.targetSelector !== undefined) {
      updates.push(`target_selector = $${idx++}`);
      values.push(JSON.stringify(body.targetSelector));
    }
    if (body.checkKind !== undefined) {
      updates.push(`check_kind = $${idx++}`);
      values.push(body.checkKind);
    }
    if (body.checkRef !== undefined) {
      updates.push(`check_ref = $${idx++}`);
      values.push(body.checkRef);
    }
    if (body.sqlTemplate !== undefined) {
      updates.push(`sql_template = $${idx++}`);
      values.push(body.sqlTemplate);
    }
    if (body.resultMapping !== undefined) {
      updates.push(`result_mapping = $${idx++}`);
      values.push(JSON.stringify(body.resultMapping));
    }
    if (body.passFailRule !== undefined) {
      updates.push(`pass_fail_rule = $${idx++}`);
      values.push(JSON.stringify(body.passFailRule));
    }
    if (body.fixKind !== undefined) {
      updates.push(`fix_kind = $${idx++}`);
      values.push(body.fixKind);
    }
    if (body.fixInstructions !== undefined) {
      updates.push(`fix_instructions = $${idx++}`);
      values.push(body.fixInstructions);
    }
    if (body.fixSqlTemplate !== undefined) {
      updates.push(`fix_sql_template = $${idx++}`);
      values.push(body.fixSqlTemplate);
    }

    if (updates.length === 0) {
      return { node: null };
    }

    values.push(nodeId);
    const rows = await query<any>(
      `
      UPDATE checklist_nodes_v2
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING *
      `,
      values
    );

    return { node: rows[0] || null };
  });

  // Delete node
  app.delete("/api/v1/checklist-nodes/:nodeId", async (req) => {
    const nodeId = UUIDSchema.parse((req.params as any).nodeId);

    // Check version status
    const versionCheck = await query<any>(
      `SELECT template_version_id FROM checklist_nodes_v2 WHERE id = $1`,
      [nodeId]
    );
    
    if (versionCheck.length === 0) {
      throw new Error('NODE_NOT_FOUND: Node does not exist');
    }
    
    await assertVersionMutable(versionCheck[0].template_version_id);

    // Cascade delete handled by DB
    await query(
      `
      DELETE FROM checklist_nodes_v2
      WHERE id = $1
      `,
      [nodeId]
    );

    return { success: true };
  });

  // Batch reorder nodes
  app.post("/api/v1/checklist-template-versions/:versionId/nodes/reorder", async (req) => {
    const versionId = UUIDSchema.parse((req.params as any).versionId);
    
    await assertVersionMutable(versionId);

    // Check version mutability
    await checkVersionMutable(versionId);

    const Body = z.object({
      moves: z.array(
        z.object({
          nodeId: z.string().uuid(),
          newParentId: z.string().uuid().nullable(),
          newParentId: z.string().uuid().nullable().optional(),
          newSortOrder: z.number().int(),
        })
      ).optional(),
      orders: z.array(
        z.object({
          nodeId: z.string().uuid(),
          sortOrder: z.number().int(),
        })
      ).optional(),
    });
    const body = Body.parse(req.body);

    // Support both moves (with parent changes) and orders (sort only)
    const moves = body.moves || (body.orders || []).map(o => ({
      nodeId: o.nodeId,
      newParentId: null as string | null,
      newSortOrder: o.sortOrder,
    }));

    // Cycle detection: check if any move would create a cycle
    if (moves.some(m => m.newParentId !== null)) {
      // Get all nodes to build the tree
      const allNodes = await query<any>(
        `SELECT id, parent_id FROM checklist_nodes_v2 WHERE template_version_id = $1`,
        [versionId]
      );

      // Build parent map with the proposed changes
      const parentMap = new Map<string, string | null>();
      for (const node of allNodes) {
        parentMap.set(node.id, node.parent_id);
      }
      
      // Apply proposed changes
      for (const move of moves) {
        if (move.newParentId !== null) {
          parentMap.set(move.nodeId, move.newParentId);
        }
      }

      // Check for cycles
      const hasCycle = (nodeId: string, visited: Set<string>): boolean => {
        if (visited.has(nodeId)) return true;
        visited.add(nodeId);
        
        const parentId = parentMap.get(nodeId);
        if (parentId === null || parentId === undefined) return false;
        
        return hasCycle(parentId, visited);
      };

      for (const move of moves) {
        if (hasCycle(move.nodeId, new Set())) {
          throw new Error('CYCLE_DETECTED: Moving node would create a cycle in the tree');
        }
      }
    }

    // Apply all moves
    for (const move of moves) {
      if (move.newParentId !== null) {
        // Update both parent and sort order
        await query(
          `
          UPDATE checklist_nodes_v2
          SET parent_id = $1, sort_order = $2
          WHERE id = $3 AND template_version_id = $4
          `,
          [move.newParentId, move.newSortOrder, move.nodeId, versionId]
        );
      } else {
        // Update only sort order
        await query(
          `
          UPDATE checklist_nodes_v2
          SET sort_order = $1
          WHERE id = $2 AND template_version_id = $3
          `,
          [move.newSortOrder, move.nodeId, versionId]
        );
      }
    // Support both 'moves' (with parent changes) and 'orders' (simple reorder)
    const moves = body.moves || body.orders?.map(o => ({
      nodeId: o.nodeId,
      newSortOrder: o.sortOrder,
      newParentId: undefined,
    })) || [];

    // Check for cycles if parent is being changed
    for (const move of moves) {
      if (move.newParentId !== undefined && move.newParentId !== null) {
        const wouldCycle = await checkForCycle(
          move.nodeId,
          move.newParentId
        );
        if (wouldCycle) {
          throw new Error(`Move would create cycle: ${move.nodeId}`);
        }
      }
    }

    // Apply moves in transaction
    // TODO: Use client-based transactions for better connection management
    // Current implementation uses raw BEGIN/COMMIT which works but isn't ideal for connection pooling
    await query('BEGIN');
    try {
      for (const move of moves) {
        if (move.newParentId !== undefined) {
          await query(
            `
            UPDATE checklist_nodes_v2
            SET parent_id = $1, sort_order = $2
            WHERE id = $3 AND template_version_id = $4
            `,
            [move.newParentId, move.newSortOrder, move.nodeId, versionId]
          );
        } else {
          await query(
            `
            UPDATE checklist_nodes_v2
            SET sort_order = $1
            WHERE id = $2 AND template_version_id = $3
            `,
            [move.newSortOrder, move.nodeId, versionId]
          );
        }
      }
      await query('COMMIT');
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }

    return { success: true };
  });
}
