import { getAuthToken, clearAuthToken } from "./authToken";

declare global {
    interface Window {
        __toast?: (msg: string) => void;
    }
}

export const customFetch = {
    async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        const token = getAuthToken();
        const headers = new Headers(init?.headers);

        if (token) headers.set("Authorization", "Bearer " + token);

        const res = await fetch(url, { ...init, headers });
        
        if (res.status === 401) {
            const www = (res.headers.get("www-authenticate") ?? "").toLowerCase();
            if (www.includes("invalid_token") || www.includes("expired")) {
                clearAuthToken();
            }
        }

        if (!res.ok) {
            const clone = res.clone();
            try {
                const ct = (clone.headers.get("content-type") ?? "").toLowerCase();
                if (ct.includes("problem+json") || ct.includes("application/json")) {
                    const p = await clone.json();
                    const msg = p?.detail || p?.title || `Request failed (${res.status})`;
                    window.__toast?.(String(msg));
                } else {
                    window.__toast?.(`Request failed (${res.status})`);
                }
            } catch {
                window.__toast?.(`Request failed (${res.status})`);
            }
        }

        return res;
    },
};