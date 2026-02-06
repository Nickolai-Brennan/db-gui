import type { Rect } from "../stores/erdStore";

export function centerLeft(r: Rect) {
  return { x: r.x, y: r.y + r.h / 2 };
}
export function centerRight(r: Rect) {
  return { x: r.x + r.w, y: r.y + r.h / 2 };
}

export function bezierPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = Math.max(60, Math.abs(b.x - a.x) * 0.35);
  const c1 = { x: a.x + dx, y: a.y };
  const c2 = { x: b.x - dx, y: b.y };
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}
