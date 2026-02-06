export declare function postSnapshot(body: {
    targetDatabaseUrl: string;
    schemas: string[];
}): Promise<{
    snapshot: any;
}>;
export declare function getAnnotations(instanceId: string): Promise<any>;
