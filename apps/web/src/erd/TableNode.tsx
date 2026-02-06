import React from 'react';
import { useErdStore } from '../stores/erdStore';
import type { TableNode } from './graph';

function severityLabel(sev?: string) {
  if (!sev) return null;
  if (sev === 'blocking') return 'BLOCK';
  if (sev === 'error') return 'FAIL';
  if (sev === 'warning') return 'WARN';
  return sev.toUpperCase();
}

export function TableNodeCard({ node }: { node: TableNode }) {
  const layout = useErdStore((s) => s.layout[node.key]);
  const setRect = useErdStore((s) => s.setTableRect);
  const selected = useErdStore((s) => s.selected);
  const setSelected = useErdStore((s) => s.setSelected);

  const isSelected = selected.type === 'table' && selected.key === node.key;

  const onPointerDown = (e: React.PointerEvent) => {
    // start drag only from header area (top 44px)
    const localY = e.nativeEvent.offsetY;
    if (localY > 44) return;

    e.stopPropagation();
    (e.currentTarget as any).setPointerCapture?.(e.pointerId);

    setSelected({ type: 'table', key: node.key });

    const startX = e.clientX;
    const startY = e.clientY;
    const startRect = layout ?? { x: 0, y: 0, w: 280, h: 220 };

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setRect(node.key, { x: startRect.x + dx, y: startRect.y + dy });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  if (!layout) return null;

  return (
    <div
      onPointerDown={onPointerDown}
      onClick={(e) => {
        e.stopPropagation();
        setSelected({ type: 'table', key: node.key });
      }}
      style={{
        position: 'absolute',
        left: layout.x,
        top: layout.y,
        width: layout.w,
        height: layout.h,
      }}
      className={[
        'rounded-2xl bg-white shadow-sm border',
        isSelected ? 'border-black' : 'border-zinc-200',
        'overflow-hidden select-none',
      ].join(' ')}
    >
      <div className="h-11 px-3 flex items-center justify-between border-b border-zinc-200">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{node.table}</div>
          <div className="text-[11px] text-zinc-500 truncate">{node.schema}</div>
        </div>

        {node.badge ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-zinc-200">
              {severityLabel(node.badge.severity)} · {node.badge.count}
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-3 text-xs">
        <div className="text-[11px] font-semibold text-zinc-700 mb-2">Columns</div>
        <div className="space-y-1 max-h-[150px] overflow-auto pr-1">
          {node.columns.slice(0, 14).map((c) => (
            <div key={c.name} className="flex items-center justify-between gap-2">
              <div className="truncate">
                <span className="font-medium">{c.name}</span>
                {node.pkCols.includes(c.name) ? (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-zinc-200">PK</span>
                ) : null}
              </div>
              <div className="text-zinc-500 truncate">{c.dataType}</div>
            </div>
          ))}
          {node.columns.length > 14 ? (
            <div className="text-zinc-500">+{node.columns.length - 14} more…</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
