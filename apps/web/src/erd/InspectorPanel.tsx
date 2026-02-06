import { useMemo } from 'react';
import { useErdStore } from '../stores/erdStore';
import type { Edge, TableNode } from './graph';

export function InspectorPanel({ nodes, edges }: { nodes: TableNode[]; edges: Edge[] }) {
  const selected = useErdStore((s) => s.selected);

  const table = useMemo(() => {
    if (selected.type !== 'table') return null;
    return nodes.find((n) => n.key === selected.key) ?? null;
  }, [selected, nodes]);

  const rel = useMemo(() => {
    if (selected.type !== 'relationship') return null;
    return edges.find((e) => e.key === selected.key) ?? null;
  }, [selected, edges]);

  return (
    <aside className="w-[360px] shrink-0 border-l border-zinc-200 bg-white">
      <div className="p-4 border-b border-zinc-200">
        <div className="text-sm font-semibold">Inspector</div>
        <div className="text-xs text-zinc-500">Select a table or relationship</div>
      </div>

      <div className="p-4 space-y-4 overflow-auto h-[calc(100vh-57px)]">
        {table ? (
          <>
            <div>
              <div className="text-lg font-semibold">{table.table}</div>
              <div className="text-sm text-zinc-500">{table.schema}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-zinc-700 mb-2">Primary Key</div>
              {table.pkCols.length ? (
                <div className="text-sm">{table.pkCols.join(', ')}</div>
              ) : (
                <div className="text-sm text-zinc-500">None</div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-zinc-700 mb-2">Indexes</div>
              <div className="space-y-2">
                {table.indexes.slice(0, 8).map((ix) => (
                  <div key={ix.name} className="rounded-xl border border-zinc-200 p-2">
                    <div className="text-sm font-medium">{ix.name}</div>
                    <div className="text-xs text-zinc-500">{ix.columns.join(', ') || '(expression)'}</div>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      {ix.isPrimary ? 'PRIMARY ' : ''}
                      {ix.isUnique ? 'UNIQUE ' : ''}
                      {ix.isValid ? '' : 'INVALID'}
                    </div>
                  </div>
                ))}
                {!table.indexes.length ? <div className="text-sm text-zinc-500">No indexes found</div> : null}
              </div>
            </div>
          </>
        ) : rel ? (
          <>
            <div>
              <div className="text-lg font-semibold">{rel.name}</div>
              <div className="text-sm text-zinc-500">{rel.childKey} → {rel.parentKey}</div>
            </div>

            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="text-xs font-semibold text-zinc-700 mb-1">Join</div>
              <div className="text-sm">
                ({rel.childCols.join(', ')}) → ({rel.parentCols.join(', ')})
              </div>
              {rel.severity ? (
                <div className="text-xs text-zinc-500 mt-2">
                  Annotation: {rel.severity} {rel.count ? `· ${rel.count}` : ''}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="text-sm text-zinc-500">Nothing selected.</div>
        )}
      </div>
    </aside>
  );
}
