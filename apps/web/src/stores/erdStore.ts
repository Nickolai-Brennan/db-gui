import { create } from "zustand";

export type Viewport = { x: number; y: number; zoom: number };
export type Selected =
  | { type: "table"; key: string }
  | { type: "relationship"; key: string }
  | { type: null };

export type Rect = { x: number; y: number; w: number; h: number };
type Layout = Record<string, Rect>;

export type Filters = {
  schemas: string[];
  search: string;
  hideIsolated: boolean;
  showSchemaLanes: boolean;
  showMinimap: boolean;
};

type ErdStore = {
  viewport: Viewport;
  setViewport: (vp: Partial<Viewport>) => void;
  resetViewport: () => void;

  selected: Selected;
  setSelected: (sel: Selected) => void;

  layout: Layout;
  setTableRect: (key: string, rect: Partial<Rect>) => void;
  ensureLayout: (tableKeys: string[]) => void;
  autoLayout: (tableKeys: string[], schemaByKey: Record<string, string>) => void;

  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;

  ui: { inspectorOpen: boolean };
  toggleInspector: () => void;

  focusTarget: { type: "table" | "relationship"; key: string } | null;
  focusOn: (t: { type: "table" | "relationship"; key: string } | null) => void;
};

export const useErdStore = create<ErdStore>((set, get) => ({
  viewport: { x: 40, y: 40, zoom: 1 },
  setViewport: (vp) => set({ viewport: { ...get().viewport, ...vp } }),
  resetViewport: () => set({ viewport: { x: 40, y: 40, zoom: 1 } }),

  selected: { type: null },
  setSelected: (selected) => set({ selected }),

  layout: {},
  setTableRect: (key, rect) =>
    set((s) => ({
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
    if (changed) set({ layout });
  },

  autoLayout: (tableKeys, schemaByKey) => {
    // Simple lanes-by-schema layout (v1)
    const schemas = Array.from(new Set(tableKeys.map((k) => schemaByKey[k] ?? "public"))).sort();
    const perSchema: Record<string, string[]> = {};
    for (const s of schemas) perSchema[s] = [];
    for (const k of tableKeys) {
      const schema = schemaByKey[k] ?? "public";
      if (perSchema[schema]) perSchema[schema].push(k);
    }

    const layout: Layout = { ...get().layout };
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

  filters: {
    schemas: [],
    search: "",
    hideIsolated: false,
    showSchemaLanes: false,
    showMinimap: true,
  },
  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),

  ui: { inspectorOpen: true },
  toggleInspector: () => set((s) => ({ ui: { inspectorOpen: !s.ui.inspectorOpen } })),

  focusTarget: null,
  focusOn: (focusTarget) => set({ focusTarget }),
}));
