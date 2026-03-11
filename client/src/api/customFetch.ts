export const customFetch = {
    async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
        const token = localStorage.getItem("jwt");
        const headers = new Headers(init?.headers);
        if (token) headers.set("Authorization", "Bearer " + token);

        const response = await fetch(url, { ...init, headers });

        if (!response.ok) {
            const clone = response.clone();
            try {
                const ct = (clone.headers.get("content-type") ?? "").toLowerCase();
                if (ct.includes("json") || ct.includes("problem+json")) {
                    const problem = await clone.json();
                    const msg = problem?.detail || problem?.title;
                    if (msg && window.__toast) window.__toast(msg);
                }
            } catch {}
        }

        return response;
    }
};