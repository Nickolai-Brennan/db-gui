import { create } from 'zustand';
export const useErdStore = create((set, get) => ({
    viewport: { x: 40, y: 40, zoom: 1 },
    setViewport: (vp) => set({ viewport: { ...get().viewport, ...vp } }),
    resetViewport: () => set({ viewport: { x: 40, y: 40, zoom: 1 } }),
    selected: { type: null },
    setSelected: (selected) => set({ selected }),
    layout: {},
    setTableRect: (key, rect) => set((s) => ({
        layout: {
            ...s.layout,
            [key]: { ...(s.layout[key] ?? { x: 0, y: 0, w: 280, h: 220 }), ...rect },
        },
    })),
    ensureLayout: (tableKeys) => {
        const layout = { ...get().layout };
        let changed = false;
        for (const k of tableKeys) {
            if (!layout[k]) {
                layout[k] = { x: 0, y: 0, w: 280, h: 220 };
                changed = true;
            }
        }
        if (changed)
            set({ layout });
    },
    autoLayout: (tableKeys, schemaByKey) => {
        // Simple lanes-by-schema layout (v1)
        const schemas = Array.from(new Set(tableKeys.map((k) => schemaByKey[k] ?? 'public'))).sort();
        const perSchema = {};
        for (const s of schemas)
            perSchema[s] = [];
        for (const k of tableKeys) {
            const schema = schemaByKey[k] ?? 'public';
            if (perSchema[schema])
                perSchema[schema].push(k);
        }
        const layout = { ...get().layout };
        const laneW = 360;
        const padX = 80;
        const padY = 80;
        const cardH = 240;
        const cardW = 300;
        const gapY = 70;
        schemas.forEach((schema, laneIdx) => {
            const keys = perSchema[schema] ?? [];
            keys.sort();
            keys.forEach((k, i) => {
                layout[k] = {
                    x: padX + laneIdx * laneW,
                    y: padY + i * (cardH + gapY),
                    w: cardW,
                    h: cardH,
                };
            });
        });
        set({ layout });
    },
    ui: { inspectorOpen: true },
    toggleInspector: () => set((s) => ({ ui: { inspectorOpen: !s.ui.inspectorOpen } })),
    focusTarget: null,
    focusOn: (focusTarget) => set({ focusTarget }),
}));
