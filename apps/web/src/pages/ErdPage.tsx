import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAnnotations, usePgSnapshot, useErdLayout } from "../api/hooks";
import { usePersistLayout } from "../api/usePersistLayout";
import { buildGraph } from "../erd/graph";
import { ErdCanvas } from "../erd/ErdCanvas";
import { InspectorPanel } from "../erd/InspectorPanel";
import { IssuesDrawer } from "../erd/IssuesDrawer";
import { TopControls } from "../erd/TopControls";
import { useErdStore } from "../stores/erdStore";
import { filterGraph } from "../erd/filtering";

function loadConnFromStorage() {
  const raw = localStorage.getItem("erd_conn");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { targetDatabaseUrl: string; schemas: string[] };
  } catch {
    return null;
  }
}

export default function ErdPage() {
  const { wsId, instanceId } = useParams();
  const [conn, setConn] = useState<{ targetDatabaseUrl: string; schemas: string[] } | null>(
    loadConnFromStorage()
  );
  const [showConn, setShowConn] = useState(!conn);

  const snapQ = usePgSnapshot(!!conn && !showConn, conn);
  const annQ = useAnnotations(instanceId!, !!conn && !showConn);
  const layoutQ = useErdLayout(instanceId!, !!conn && !showConn);

  const autoLayoutFn = useErdStore((s) => s.autoLayout);
  const resetViewport = useErdStore((s) => s.resetViewport);
  const filters = useErdStore((s) => s.filters);
  const setFilters = useErdStore((s) => s.setFilters);
  const setTableRect = useErdStore((s) => s.setTableRect);

  const graph = useMemo(() => {
    if (!snapQ.data) return null;
    return buildGraph(snapQ.data, annQ.data);
  }, [snapQ.data, annQ.data]);

  // Enable layout persistence (only when graph is loaded)
  usePersistLayout(instanceId!, !!conn && !showConn && !!graph);

  // Hydrate layout from saved data
  useEffect(() => {
    if (layoutQ.data && Object.keys(layoutQ.data).length > 0) {
      for (const [key, rect] of Object.entries(layoutQ.data)) {
        if (rect && typeof rect === "object" && "x" in rect) {
          setTableRect(key, rect as any);
        }
      }
    }
  }, [layoutQ.data, setTableRect]);

  // Get all unique schemas
  const schemasAll = useMemo(() => {
    if (!graph) return [];
    return Array.from(new Set(graph.nodes.map((n) => n.schema))).sort();
  }, [graph]);

  // Initialize filters with all schemas selected
  useEffect(() => {
    if (schemasAll.length > 0 && filters.schemas.length === 0) {
      setFilters({ schemas: schemasAll });
    }
  }, [schemasAll, filters.schemas.length, setFilters]);

  // Apply filtering
  const filteredGraph = useMemo(() => {
    if (!graph) return null;
    return filterGraph(graph.nodes, graph.edges, {
      schemas: filters.schemas.length > 0 ? filters.schemas : undefined,
      search: filters.search,
      hideIsolated: filters.hideIsolated,
    });
  }, [graph, filters]);

  const autoLayout = useCallback(() => {
    if (filteredGraph?.nodes?.length && graph) {
      autoLayoutFn(
        filteredGraph.nodes.map((n) => n.key),
        graph.schemaByKey
      );
    }
  }, [filteredGraph, graph, autoLayoutFn]);

  useEffect(() => {
    autoLayout();
  }, [autoLayout]);

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="h-14 border-b border-zinc-200 flex items-center justify-between px-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">ERD</div>
          <div className="text-xs text-zinc-500 truncate">
            workspace {wsId} · instance {instanceId}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded-xl border border-zinc-200 text-sm"
            onClick={() => setShowConn(true)}
          >
            Connection
          </button>

          {filteredGraph && (
            <TopControls
              schemasAll={schemasAll}
              selectedSchemas={filters.schemas}
              onSchemasChange={(schemas) => setFilters({ schemas })}
              search={filters.search}
              onSearchChange={(search) => setFilters({ search })}
              hideIsolated={filters.hideIsolated}
              onHideIsolatedChange={(hideIsolated) => setFilters({ hideIsolated })}
              showSchemaLanes={filters.showSchemaLanes}
              onShowSchemaLanesChange={(showSchemaLanes) => setFilters({ showSchemaLanes })}
              showMinimap={filters.showMinimap}
              onShowMinimapChange={(showMinimap) => setFilters({ showMinimap })}
              onAutoLayout={autoLayout}
              onResetView={resetViewport}
            />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {filteredGraph && instanceId && <IssuesDrawer instanceId={instanceId} />}

        <div className="flex-1 min-w-0 relative">
          {snapQ.isLoading ? (
            <div className="p-6 text-sm text-zinc-600">Loading snapshot…</div>
          ) : snapQ.isError ? (
            <div className="p-6 text-sm text-red-600">{String(snapQ.error)}</div>
          ) : !filteredGraph ? (
            <div className="p-6 text-sm text-zinc-600">No snapshot loaded.</div>
          ) : (
            <ErdCanvas
              nodes={filteredGraph.nodes}
              edges={filteredGraph.edges}
              dimmed={filteredGraph.dimmed}
              showSchemaLanes={filters.showSchemaLanes}
              showMinimap={filters.showMinimap}
              schemaByKey={graph!.schemaByKey}
            />
          )}
        </div>

        {filteredGraph && <InspectorPanel nodes={filteredGraph.nodes} edges={filteredGraph.edges} />}
      </div>

      {/* Connection modal */}
      {showConn ? (
        <ConnectionModal
          initial={conn}
          onClose={() => setShowConn(false)}
          onSave={(next) => {
            localStorage.setItem("erd_conn", JSON.stringify(next));
            setConn(next);
            setShowConn(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ConnectionModal({
  initial,
  onClose,
  onSave,
}: {
  initial: { targetDatabaseUrl: string; schemas: string[] } | null;
  onClose: () => void;
  onSave: (c: { targetDatabaseUrl: string; schemas: string[] }) => void;
}) {
  const [url, setUrl] = useState(initial?.targetDatabaseUrl ?? "");
  const [schemas, setSchemas] = useState((initial?.schemas ?? ["public"]).join(","));

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="w-[720px] max-w-[92vw] rounded-2xl bg-white shadow-sm border border-zinc-200">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Target connection</div>
            <div className="text-xs text-zinc-500">v1: stored in localStorage</div>
          </div>
          <button
            className="px-3 py-1.5 rounded-xl border border-zinc-200 text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-3">
          <label className="block">
            <div className="text-xs font-semibold text-zinc-700 mb-1">Target Database URL</div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="postgresql://user:pass@host:5432/db"
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-zinc-700 mb-1">Schemas</div>
            <input
              value={schemas}
              onChange={(e) => setSchemas(e.target.value)}
              placeholder="public,stats"
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm"
            />
          </label>

          <div className="pt-2 flex justify-end">
            <button
              className="px-4 py-2 rounded-xl bg-black text-white text-sm"
              onClick={() => {
                const list = schemas
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                onSave({ targetDatabaseUrl: url.trim(), schemas: list.length ? list : ["public"] });
              }}
            >
              Save & Load
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
