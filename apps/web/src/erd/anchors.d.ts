import type { Rect } from '../stores/erdStore';
export declare function centerLeft(r: Rect): {
    x: number;
    y: number;
};
export declare function centerRight(r: Rect): {
    x: number;
    y: number;
};
export declare function bezierPath(a: {
    x: number;
    y: number;
}, b: {
    x: number;
    y: number;
}): string;
