import { useQuery } from '@tanstack/react-query';
import { getAnnotations, postSnapshot } from './client';
export function usePgSnapshot(enabled, input) {
    return useQuery({
        queryKey: ['pgSnapshot', input?.targetDatabaseUrl, input?.schemas?.join(',')].filter(Boolean),
        enabled: enabled && !!input,
        queryFn: async () => {
            const res = await postSnapshot(input);
            return res.snapshot;
        },
        staleTime: 30000,
    });
}
export function useAnnotations(instanceId, enabled) {
    return useQuery({
        queryKey: ['annotations', instanceId],
        enabled: enabled && !!instanceId,
        queryFn: async () => (await getAnnotations(instanceId)),
        staleTime: 10000,
    });
}
