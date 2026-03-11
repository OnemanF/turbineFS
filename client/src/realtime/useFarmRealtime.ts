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

    useEffect(() => {
        if (!farmId.trim()) return;

        setConnected(false);
        setConnectionId(null);
        setGroup(null);
        setError(null);

        const es = new EventSource(`${BASE_URL}/api/farms/sse`, { withCredentials: false });
        esRef.current = es;

        const cleanup = () => {
            try {
                es.close();
            } catch {
            }
            esRef.current = null;
        };

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
                
                const onGroupEvent = (evt: MessageEvent) => {
                    const payload = tryParseJson<FarmRealtimePayload>(evt.data);
                    if (payload) setData(payload);
                };

                es.addEventListener(g, onGroupEvent);
                
                es.onmessage = (evt) => {
                    const raw = tryParseJson<any>(evt.data);
                    if (!raw) return;

                    if (raw?.telemetry || raw?.alerts) {
                        setData(raw as FarmRealtimePayload);
                        return;
                    }

                    if (raw?.group === g && (raw?.data?.telemetry || raw?.data?.alerts)) {
                        setData(raw.data as FarmRealtimePayload);
                    }
                };
                
                return () => {
                    es.removeEventListener(g, onGroupEvent as any);
                };
            } catch (e: any) {
                setError(e?.message ?? "Failed to subscribe realtime");
            }
        };
        
        const onConnectedEvent = (evt: MessageEvent) => {
            const msg = tryParseJson<{ connectionId?: string }>(evt.data);
            const cid = msg?.connectionId;
            if (cid) onConnected(cid);
        };

        es.addEventListener("connected", onConnectedEvent);
        
        es.onmessage = (evt) => {
            const msg = tryParseJson<{ connectionId?: string }>(evt.data);
            const cid = msg?.connectionId;
            if (cid) onConnected(cid);
        };

        es.onerror = () => {
            setError("SSE connection error");
            setConnected(false);
        };

        return cleanup;
    }, [farmId]);

    return { connected, connectionId, group, data, error };
}