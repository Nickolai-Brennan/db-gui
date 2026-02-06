import type { ErdAnnotations, PgSnapshot } from '../api/types';
export type TableKey = string;
export type TableNode = {
    key: TableKey;
    schema: string;
    table: string;
    columns: {
        name: string;
        dataType: string;
        isNullable: boolean;
    }[];
    pkCols: string[];
    indexes: {
        name: string;
        columns: string[];
        isUnique: boolean;
        isPrimary: boolean;
        isValid: boolean;
    }[];
    badge?: {
        severity: string;
        count: number;
    };
};
export type EdgeKey = string;
export type Edge = {
    key: EdgeKey;
    name: string;
    childKey: TableKey;
    parentKey: TableKey;
    childCols: string[];
    parentCols: string[];
    severity?: string;
    count?: number;
};
export declare function tableKey(schema: string, table: string): TableKey;
export declare function edgeKeyFromFk(fk: {
    childSchema: string;
    childTable: string;
    childCols: string[];
    parentSchema: string;
    parentTable: string;
    parentCols: string[];
    name?: string;
}): EdgeKey;
export declare function buildGraph(snapshot: PgSnapshot, annotations?: ErdAnnotations): {
    nodes: TableNode[];
    edges: Edge[];
    schemaByKey: Record<string, string>;
};
