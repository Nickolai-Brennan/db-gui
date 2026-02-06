import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useErdStore } from '../stores/erdStore';
export function InspectorPanel({ nodes, edges }) {
    const selected = useErdStore((s) => s.selected);
    const table = useMemo(() => {
        if (selected.type !== 'table')
            return null;
        return nodes.find((n) => n.key === selected.key) ?? null;
    }, [selected, nodes]);
    const rel = useMemo(() => {
        if (selected.type !== 'relationship')
            return null;
        return edges.find((e) => e.key === selected.key) ?? null;
    }, [selected, edges]);
    return (_jsxs("aside", { className: "w-[360px] shrink-0 border-l border-zinc-200 bg-white", children: [_jsxs("div", { className: "p-4 border-b border-zinc-200", children: [_jsx("div", { className: "text-sm font-semibold", children: "Inspector" }), _jsx("div", { className: "text-xs text-zinc-500", children: "Select a table or relationship" })] }), _jsx("div", { className: "p-4 space-y-4 overflow-auto h-[calc(100vh-57px)]", children: table ? (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold", children: table.table }), _jsx("div", { className: "text-sm text-zinc-500", children: table.schema })] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold text-zinc-700 mb-2", children: "Primary Key" }), table.pkCols.length ? (_jsx("div", { className: "text-sm", children: table.pkCols.join(', ') })) : (_jsx("div", { className: "text-sm text-zinc-500", children: "None" }))] }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold text-zinc-700 mb-2", children: "Indexes" }), _jsxs("div", { className: "space-y-2", children: [table.indexes.slice(0, 8).map((ix) => (_jsxs("div", { className: "rounded-xl border border-zinc-200 p-2", children: [_jsx("div", { className: "text-sm font-medium", children: ix.name }), _jsx("div", { className: "text-xs text-zinc-500", children: ix.columns.join(', ') || '(expression)' }), _jsxs("div", { className: "text-[11px] text-zinc-500 mt-1", children: [ix.isPrimary ? 'PRIMARY ' : '', ix.isUnique ? 'UNIQUE ' : '', ix.isValid ? '' : 'INVALID'] })] }, ix.name))), !table.indexes.length ? _jsx("div", { className: "text-sm text-zinc-500", children: "No indexes found" }) : null] })] })] })) : rel ? (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("div", { className: "text-lg font-semibold", children: rel.name }), _jsxs("div", { className: "text-sm text-zinc-500", children: [rel.childKey, " \u2192 ", rel.parentKey] })] }), _jsxs("div", { className: "rounded-xl border border-zinc-200 p-3", children: [_jsx("div", { className: "text-xs font-semibold text-zinc-700 mb-1", children: "Join" }), _jsxs("div", { className: "text-sm", children: ["(", rel.childCols.join(', '), ") \u2192 (", rel.parentCols.join(', '), ")"] }), rel.severity ? (_jsxs("div", { className: "text-xs text-zinc-500 mt-2", children: ["Annotation: ", rel.severity, " ", rel.count ? `· ${rel.count}` : ''] })) : null] })] })) : (_jsx("div", { className: "text-sm text-zinc-500", children: "Nothing selected." })) })] }));
}
