import type { Rect } from "../stores/erdStore";

export type SchemaLane = {
  schema: string;
  x: number;
  width: number;
};

export function computeSchemaLanes(
  tableKeys: string[],
  schemaByKey: Record<string, string>,
  layout: Record<string, Rect>
): SchemaLane[] {
  // Group tables by schema
  const schemaGroups = new Map<string, string[]>();
  for (const key of tableKeys) {
    const schema = schemaByKey[key] || "public";
    if (!schemaGroups.has(schema)) {
      schemaGroups.set(schema, []);
    }
    schemaGroups.get(schema)!.push(key);
  }

  // Calculate lane boundaries
  const lanes: SchemaLane[] = [];
  for (const [schema, keys] of schemaGroups) {
    let minX = Infinity;
    let maxX = -Infinity;

    for (const key of keys) {
      const rect = layout[key];
      if (rect) {
        minX = Math.min(minX, rect.x);
        maxX = Math.max(maxX, rect.x + rect.w);
      }
    }

    if (minX !== Infinity && maxX !== -Infinity) {
      lanes.push({
        schema,
        x: minX - 40,
        width: maxX - minX + 80,
      });
    }
  }

  return lanes.sort((a, b) => a.x - b.x);
}
