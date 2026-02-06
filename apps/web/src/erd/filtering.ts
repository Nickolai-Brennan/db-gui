import type { ErdNode, ErdEdge } from "./graph";

export type FilterOptions = {
  schemas?: string[];
  search?: string;
  hideIsolated?: boolean;
};

export function buildDegreeMap(
  nodes: ErdNode[],
  edges: ErdEdge[]
): Map<string, number> {
  const degreeMap = new Map<string, number>();

  // Initialize all nodes with degree 0
  for (const node of nodes) {
    degreeMap.set(node.key, 0);
  }

  // Count edges for each node
  for (const edge of edges) {
    degreeMap.set(edge.childKey, (degreeMap.get(edge.childKey) || 0) + 1);
    degreeMap.set(edge.parentKey, (degreeMap.get(edge.parentKey) || 0) + 1);
  }

  return degreeMap;
}

export function matchesSearch(node: ErdNode, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    node.table.toLowerCase().includes(q) ||
    node.schema.toLowerCase().includes(q) ||
    node.columns.some((c) => c.name.toLowerCase().includes(q))
  );
}

export function filterGraph(
  nodes: ErdNode[],
  edges: ErdEdge[],
  opts: FilterOptions
): { nodes: ErdNode[]; edges: ErdEdge[]; dimmed: Set<string> } {
  const dimmed = new Set<string>();

  // Filter by schema
  let filteredNodes = nodes;
  if (opts.schemas && opts.schemas.length > 0) {
    filteredNodes = nodes.filter((n) => opts.schemas!.includes(n.schema));
  }

  // Filter isolated nodes if requested
  if (opts.hideIsolated) {
    const degreeMap = buildDegreeMap(nodes, edges);
    filteredNodes = filteredNodes.filter((n) => (degreeMap.get(n.key) || 0) > 0);
  }

  // Apply search highlighting (don't filter, just dim)
  if (opts.search) {
    for (const node of filteredNodes) {
      if (!matchesSearch(node, opts.search)) {
        dimmed.add(node.key);
      }
    }
  }

  // Filter edges to only include those between visible nodes
  const visibleKeys = new Set(filteredNodes.map((n) => n.key));
  const filteredEdges = edges.filter(
    (e) => visibleKeys.has(e.childKey) && visibleKeys.has(e.parentKey)
  );

  return { nodes: filteredNodes, edges: filteredEdges, dimmed };
}
