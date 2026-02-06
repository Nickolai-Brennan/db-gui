import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAnnotations, usePgSnapshot } from '../api/hooks';
import { buildGraph } from '../erd/graph';
import { ErdCanvas } from '../erd/ErdCanvas';
import { InspectorPanel } from '../erd/InspectorPanel';
import { useErdStore } from '../stores/erdStore';
function loadConnFromStorage() {
    const raw = localStorage.getItem('erd_conn');
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export default function ErdPage() {
    const { wsId, instanceId } = useParams();
    const [conn, setConn] = useState(loadConnFromStorage());
    const [showConn, setShowConn] = useState(!conn);
    const snapQ = usePgSnapshot(!!conn && !showConn, conn);
    const annQ = useAnnotations(instanceId, !!conn && !showConn);
    const autoLayout = useErdStore((s) => s.autoLayout);
    const graph = useMemo(() => {
        if (!snapQ.data)
            return null;
        return buildGraph(snapQ.data, annQ.data);
    }, [snapQ.data, annQ.data]);
    useEffect(() => {
        if (graph?.nodes?.length) {
            autoLayout(graph.nodes.map((n) => n.key), graph.schemaByKey);
        }
    }, [graph?.nodes?.length]); // intentionally minimal
    return (_jsxs("div", { className: "h-screen flex flex-col bg-white", children: [_jsxs("div", { className: "h-14 border-b border-zinc-200 flex items-center justify-between px-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold truncate", children: "ERD" }), _jsxs("div", { className: "text-xs text-zinc-500 truncate", children: ["workspace ", wsId, " \u00B7 instance ", instanceId] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "px-3 py-1.5 rounded-xl border border-zinc-200 text-sm", onClick: () => setShowConn(true), children: "Connection" }), graph ? (_jsx("button", { className: "px-3 py-1.5 rounded-xl border border-zinc-200 text-sm", onClick: () => autoLayout(graph.nodes.map((n) => n.key), graph.schemaByKey), children: "Auto layout" })) : null] })] }), _jsxs("div", { className: "flex flex-1 min-h-0", children: [_jsx("div", { className: "flex-1 min-w-0", children: snapQ.isLoading ? (_jsx("div", { className: "p-6 text-sm text-zinc-600", children: "Loading snapshot\u2026" })) : snapQ.isError ? (_jsx("div", { className: "p-6 text-sm text-red-600", children: String(snapQ.error) })) : !graph ? (_jsx("div", { className: "p-6 text-sm text-zinc-600", children: "No snapshot loaded." })) : (_jsx(ErdCanvas, { nodes: graph.nodes, edges: graph.edges })) }), graph ? _jsx(InspectorPanel, { nodes: graph.nodes, edges: graph.edges }) : null] }), showConn ? (_jsx(ConnectionModal, { initial: conn, onClose: () => setShowConn(false), onSave: (next) => {
                    localStorage.setItem('erd_conn', JSON.stringify(next));
                    setConn(next);
                    setShowConn(false);
                } })) : null] }));
}
function ConnectionModal({ initial, onClose, onSave, }) {
    const [url, setUrl] = useState(initial?.targetDatabaseUrl ?? '');
    const [schemas, setSchemas] = useState((initial?.schemas ?? ['public']).join(','));
    return (_jsx("div", { className: "fixed inset-0 bg-black/30 flex items-center justify-center z-50", children: _jsxs("div", { className: "w-[720px] max-w-[92vw] rounded-2xl bg-white shadow-sm border border-zinc-200", children: [_jsxs("div", { className: "p-4 border-b border-zinc-200 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold", children: "Target connection" }), _jsx("div", { className: "text-xs text-zinc-500", children: "v1: stored in localStorage" })] }), _jsx("button", { className: "px-3 py-1.5 rounded-xl border border-zinc-200 text-sm", onClick: onClose, children: "Close" })] }), _jsxs("div", { className: "p-4 space-y-3", children: [_jsxs("label", { className: "block", children: [_jsx("div", { className: "text-xs font-semibold text-zinc-700 mb-1", children: "Target Database URL" }), _jsx("input", { value: url, onChange: (e) => setUrl(e.target.value), placeholder: "postgresql://user:pass@host:5432/db", className: "w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm" })] }), _jsxs("label", { className: "block", children: [_jsx("div", { className: "text-xs font-semibold text-zinc-700 mb-1", children: "Schemas" }), _jsx("input", { value: schemas, onChange: (e) => setSchemas(e.target.value), placeholder: "public,stats", className: "w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm" })] }), _jsx("div", { className: "pt-2 flex justify-end", children: _jsx("button", { className: "px-4 py-2 rounded-xl bg-black text-white text-sm", onClick: () => {
                                    const list = schemas
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean);
                                    onSave({ targetDatabaseUrl: url.trim(), schemas: list.length ? list : ['public'] });
                                }, children: "Save & Load" }) })] })] }) }));
}
