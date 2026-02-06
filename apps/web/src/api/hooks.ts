import { useQuery } from "@tanstack/react-query";
import { getAnnotations, postSnapshot, getErdLayout } from "./client";
import type { ErdAnnotations, PgSnapshot } from "./types";

export function usePgSnapshot(
  enabled: boolean,
  input: { targetDatabaseUrl: string; schemas: string[] } | null
) {
  return useQuery({
    queryKey: ["pgSnapshot", input?.targetDatabaseUrl, input?.schemas?.join(",")].filter(Boolean),
    enabled: enabled && !!input,
    queryFn: async () => {
      const res = await postSnapshot(input!);
      return res.snapshot as PgSnapshot;
    },
    staleTime: 30_000,
  });
}

export function useAnnotations(instanceId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["annotations", instanceId],
    enabled: enabled && !!instanceId,
    queryFn: async () => (await getAnnotations(instanceId)) as ErdAnnotations,
    staleTime: 10_000,
  });
}

export function useErdLayout(instanceId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["erdLayout", instanceId],
    enabled: enabled && !!instanceId,
    queryFn: async () => {
      const res = await getErdLayout(instanceId);
      return res.layout as Record<string, any>;
    },
    staleTime: 5_000,
  });
}
