import type { Rect } from "../stores/erdStore";

export function shouldDogleg(a: Rect, b: Rect): boolean {
  // Use dogleg routing when nodes are vertically stacked
  const verticalOverlap =
    Math.max(a.y, b.y) < Math.min(a.y + a.h, b.y + b.h);
  return verticalOverlap && Math.abs(b.x - (a.x + a.w)) < 200;
}

export function doglegPath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  offset: number
): string {
  // Create a dogleg path for vertically stacked nodes
  const midX = a.x + offset;
  return `M ${a.x} ${a.y} L ${midX} ${a.y} L ${midX} ${b.y} L ${b.x} ${b.y}`;
}
