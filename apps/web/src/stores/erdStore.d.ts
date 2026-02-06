export type Viewport = {
    x: number;
    y: number;
    zoom: number;
};
export type Selected = {
    type: 'table';
    key: string;
} | {
    type: 'relationship';
    key: string;
} | {
    type: null;
};
export type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Layout = Record<string, Rect>;
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
    ui: {
        inspectorOpen: boolean;
    };
    toggleInspector: () => void;
    focusTarget: {
        type: 'table' | 'relationship';
        key: string;
    } | null;
    focusOn: (t: {
        type: 'table' | 'relationship';
        key: string;
    } | null) => void;
};
export declare const useErdStore: import("zustand").UseBoundStore<import("zustand").StoreApi<ErdStore>>;
export {};
