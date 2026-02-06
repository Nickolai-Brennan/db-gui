type Node = {
  id: string;
  template_version_id: string;
  parent_id: string | null;
  sort_order: number;
  node_type: string;
  title: string;
  description: string | null;
  item_type: string | null;
  severity: string | null;
  blocks_action: boolean | null;
  required: boolean | null;
  scope_type: string | null;
  target_selector: any;
  check_kind: string | null;
  check_ref: string | null;
  sql_template: string | null;
  result_mapping: any;
  pass_fail_rule: any;
  fix_kind: string | null;
  fix_instructions: string | null;
  fix_sql_template: string | null;
  created_at: string;
};

export type TreeNode = Node & {
  children: TreeNode[];
};

export function buildTree(nodes: Node[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Sort by sort_order
  const sorted = [...nodes].sort((a, b) => a.sort_order - b.sort_order);

  // Build tree
  for (const node of sorted) {
    const treeNode: TreeNode = { ...node, children: [] };
    map.set(node.id, treeNode);

    if (!node.parent_id) {
      roots.push(treeNode);
    } else {
      const parent = map.get(node.parent_id);
      if (parent) parent.children.push(treeNode);
    }
  }

  return roots;
}
