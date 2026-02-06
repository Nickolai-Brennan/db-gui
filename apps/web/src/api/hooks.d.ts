import type { ErdAnnotations, PgSnapshot } from './types';
export declare function usePgSnapshot(enabled: boolean, input: {
    targetDatabaseUrl: string;
    schemas: string[];
} | null): import("@tanstack/react-query").UseQueryResult<PgSnapshot, Error>;
export declare function useAnnotations(instanceId: string, enabled: boolean): import("@tanstack/react-query").UseQueryResult<ErdAnnotations, Error>;
