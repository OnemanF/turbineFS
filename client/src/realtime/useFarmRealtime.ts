import { useEffect, useRef, useState } from "react";
import { BASE_URL } from "../api/config";
import { api } from "../api";
import type { FarmRealtimePayload } from "../generated-ts-client";

type UseFarmRealtimeResult = {
    connected: boolean;
    connectionId: string | null;
    group: string | null;
    data: FarmRealtimePayload | null;
    error: string | null;
};

function tryParseJson<T>(s: string): T | null {
    try {
        return JSON.parse(s) as T;
    } catch {
        return null;
    }
}

export function useFarmRealtime(farmId: string): UseFarmRealtimeResult {
    const [connected, setConnected] = useState(false);
    const [connectionId, setConnectionId] = useState<string | null>(null);
    const [group, setGroup] = useState<string | null>(null);
    const [data, setData] = useState<FarmRealtimePayload | null>(null);
    const [error, setError] = useState<string | null>(null);

    const esRef = useRef<EventSource | null>(null);
    const activeGroupRef = useRef<string | null>(null);

    useEffect(() => {
        if (!farmId.trim()) return;
        
        if (esRef.current) {
            try { esRef.current.close(); } catch {}
            esRef.current = null;
        }
        activeGroupRef.current = null;

        setConnected(false);
        setConnectionId(null);
        setGroup(null);
        setError(null);

        const es = new EventSource(`${BASE_URL}/api/farms/sse`);
        esRef.current = es;

        const onConnected = async (cid: string) => {
            setConnected(true);
            setConnectionId(cid);

            try {
                const resp = await api.realtime.listenFarm(farmId, cid);
                const g = resp?.group ?? null;
                const initial = resp?.data ?? null;

                setGroup(g);
                if (initial) setData(initial);

                if (!g) return;
                
                if (activeGroupRef.current) {
                    es.removeEventListener(activeGroupRef.current, onGroupEvent as any);
                }
                activeGroupRef.current = g;

                es.addEventListener(g, onGroupEvent as any);
            } catch (e: any) {
                setError(e?.message ?? "Failed to subscribe realtime");
            }
        };

        const onConnectedEvent = (evt: MessageEvent) => {
            const msg = tryParseJson<{ connectionId?: string }>(evt.data);
            if (msg?.connectionId) void onConnected(msg.connectionId);
        };

        const onGroupEvent = (evt: MessageEvent) => {
            const payload = tryParseJson<FarmRealtimePayload>(evt.data);
            if (payload) setData(payload);
        };

        es.addEventListener("connected", onConnectedEvent as any);

        es.onerror = () => {
            setError("SSE connection error");
            setConnected(false);
        };

        return () => {
            try { es.close(); } catch {}
            esRef.current = null;
            activeGroupRef.current = null;
        };
    }, [farmId]);

    return { connected, connectionId, group, data, error };
}