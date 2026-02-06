import React, { useEffect, useMemo, useRef, useState } from "react";
import { useErdStore } from "../stores/erdStore";
import type { ErdEdge, ErdNode } from "./graph";
import { bezierPath, centerLeft, centerRight } from "./anchors";
import { TableNodeCard } from "./TableNode";

export function ErdCanvas({ nodes, edges }: { nodes: ErdNode[]; edges: ErdEdge[] }) {
  const viewport = useErdStore((s) => s.viewport);
  const setViewport = useErdStore((s) => s.setViewport);
  const resetViewport = useErdStore((s) => s.resetViewport);
  const layout = useErdStore((s) => s.layout);
  const ensureLayout = useErdStore((s) => s.ensureLayout);
  const setSelected = useErdStore((s) => s.setSelected);
  const selected = useErdStore((s) => s.selected);
  const focusTarget = useErdStore((s) => s.focusTarget);
  const focusOn = useErdStore((s) => s.focusOn);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const [panning, setPanning] = useState<{
    startX: number;
    startY: number;
    startVpX: number;
    startVpY: number;
  } | null>(null);

  useEffect(() => {
    ensureLayout(nodes.map((n) => n.key));
  }, [nodes, ensureLayout]);

  // Focus handling: center viewport on table
  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget.type === "table") {
      const r = layout[focusTarget.key];
      if (r) {
        const cx = r.x + r.w / 2;
        const cy = r.y + r.h / 2;
        // center in view
        const vw = stageRef.current?.clientWidth ?? 1200;
        const vh = stageRef.current?.clientHeight ?? 800;
        setViewport({ x: vw / 2 - cx * viewport.zoom, y: vh / 2 - cy * viewport.zoom });
        setSelected({ type: "table", key: focusTarget.key });
      }
    }
    focusOn(null);
  }, [focusTarget, layout, setViewport, viewport.zoom, setSelected, focusOn]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const zoom = viewport.zoom;
    const nextZoom = Math.min(2.2, Math.max(0.35, zoom * (delta > 0 ? 1.08 : 0.92)));

    // zoom around cursor
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const worldX = (cx - viewport.x) / zoom;
    const worldY = (cy - viewport.y) / zoom;

    const nextX = cx - worldX * nextZoom;
    const nextY = cy - worldY * nextZoom;

    setViewport({ zoom: nextZoom, x: nextX, y: nextY });
  };

  const onPointerDownBg = (e: React.PointerEvent) => {
    // only pan if click background (not node)
    e.preventDefault();
    setSelected({ type: null });
    setPanning({
      startX: e.clientX,
      startY: e.clientY,
      startVpX: viewport.x,
      startVpY: viewport.y,
    });
  };

  useEffect(() => {
    if (!panning) return;

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - panning.startX;
      const dy = ev.clientY - panning.startY;
      setViewport({ x: panning.startVpX + dx, y: panning.startVpY + dy });
    };
    const up = () => setPanning(null);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [panning, setViewport]);

  const edgePaths = useMemo(() => {
    const paths: { key: string; d: string; severity?: string }[] = [];
    for (const e of edges) {
      const child = layout[e.childKey];
      const parent = layout[e.parentKey];
      if (!child || !parent) continue;

      const a = centerRight(child);
      const b = centerLeft(parent);

      paths.push({ key: e.key, d: bezierPath(a, b), severity: e.severity });
    }
    return paths;
  }, [edges, layout]);

  const stageStyle: React.CSSProperties = {
    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    transformOrigin: "0 0",
    width: 6000,
    height: 6000,
    position: "relative",
  };

  return (
    <div className="relative flex-1 bg-zinc-50 overflow-hidden">
      {/* top-right controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <button
          className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-sm"
          onClick={resetViewport}
        >
          Reset view
        </button>
        <div className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-sm">
          {Math.round(viewport.zoom * 100)}%
        </div>
      </div>

      {/* subtle grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div
        ref={stageRef}
        className="absolute inset-0"
        onWheel={onWheel}
        onPointerDown={onPointerDownBg}
      >
        <div style={stageStyle}>
          {/* Edges layer */}
          <svg
            width={6000}
            height={6000}
            style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
          >
            {edgePaths.map((p) => {
              const isSel = selected.type === "relationship" && selected.key === p.key;
              const stroke = isSel ? "black" : "rgba(0,0,0,0.25)";
              const strokeWidth = isSel ? 2.5 : p.severity ? 2 : 1.25;
              return (
                <path key={p.key} d={p.d} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
              );
            })}
          </svg>

          {/* Nodes layer */}
          {nodes.map((n) => (
            <TableNodeCard key={n.key} node={n} />
          ))}
        </div>
      </div>
    </div>
  );
}
