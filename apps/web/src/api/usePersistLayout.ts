import { useEffect, useRef } from "react";
import { useErdStore } from "../stores/erdStore";
import { saveErdLayout } from "./client";

export function usePersistLayout(instanceId: string, enabled: boolean) {
  const layout = useErdStore((s) => s.layout);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !instanceId) return;

    // Debounce layout saves by 600ms
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveErdLayout(instanceId, layout).catch((err) => {
        console.error("Failed to save ERD layout:", err);
      });
    }, 600);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [layout, instanceId, enabled]);
}
