import { BASE_URL } from "./config";

export type SseMessageHandler = (ev: MessageEvent<string>) => void;

export function openSse(onMessage: SseMessageHandler) {
    const es = new EventSource(`${BASE_URL}/api/farms/sse`, { withCredentials: false });

    es.onmessage = onMessage;
    es.onerror = () => {
    };

    return {
        close() {
            es.close();
        },
    };
}