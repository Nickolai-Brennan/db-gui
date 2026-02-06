import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useErdStore } from '../stores/erdStore';
function severityLabel(sev) {
    if (!sev)
        return null;
    if (sev === 'blocking')
        return 'BLOCK';
    if (sev === 'error')
        return 'FAIL';
    if (sev === 'warning')
        return 'WARN';
    return sev.toUpperCase();
}
export function TableNodeCard({ node }) {
    const layout = useErdStore((s) => s.layout[node.key]);
    const setRect = useErdStore((s) => s.setTableRect);
    const selected = useErdStore((s) => s.selected);
    const setSelected = useErdStore((s) => s.setSelected);
    const isSelected = selected.type === 'table' && selected.key === node.key;
    const onPointerDown = (e) => {
        // start drag only from header area (top 44px)
        const localY = e.nativeEvent.offsetY;
        if (localY > 44)
            return;
        e.stopPropagation();
        const target = e.currentTarget;
        target.setPointerCapture?.(e.pointerId);
        setSelected({ type: 'table', key: node.key });
        const startX = e.clientX;
        const startY = e.clientY;
        const startRect = layout ?? { x: 0, y: 0, w: 280, h: 220 };
        const move = (ev) => {
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
    if (!layout)
        return null;
    return (_jsxs("div", { onPointerDown: onPointerDown, onClick: (e) => {
            e.stopPropagation();
            setSelected({ type: 'table', key: node.key });
        }, style: {
            position: 'absolute',
            left: layout.x,
            top: layout.y,
            width: layout.w,
            height: layout.h,
        }, className: [
            'rounded-2xl bg-white shadow-sm border',
            isSelected ? 'border-black' : 'border-zinc-200',
            'overflow-hidden select-none',
        ].join(' '), children: [_jsxs("div", { className: "h-11 px-3 flex items-center justify-between border-b border-zinc-200", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-semibold truncate", children: node.table }), _jsx("div", { className: "text-[11px] text-zinc-500 truncate", children: node.schema })] }), node.badge ? (_jsx("div", { className: "flex items-center gap-2", children: _jsxs("span", { className: "text-[11px] font-semibold px-2 py-0.5 rounded-full border border-zinc-200", children: [severityLabel(node.badge.severity), " \u00B7 ", node.badge.count] }) })) : null] }), _jsxs("div", { className: "p-3 text-xs", children: [_jsx("div", { className: "text-[11px] font-semibold text-zinc-700 mb-2", children: "Columns" }), _jsxs("div", { className: "space-y-1 max-h-[150px] overflow-auto pr-1", children: [node.columns.slice(0, 14).map((c) => (_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "truncate", children: [_jsx("span", { className: "font-medium", children: c.name }), node.pkCols.includes(c.name) ? (_jsx("span", { className: "ml-2 text-[10px] px-1.5 py-0.5 rounded border border-zinc-200", children: "PK" })) : null] }), _jsx("div", { className: "text-zinc-500 truncate", children: c.dataType })] }, c.name))), node.columns.length > 14 ? (_jsxs("div", { className: "text-zinc-500", children: ["+", node.columns.length - 14, " more\u2026"] })) : null] })] })] }));
}
