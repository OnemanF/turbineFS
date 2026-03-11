export type ToastFn = (msg: string) => void;

declare global {
    interface Window {
        __toast?: ToastFn;
    }
}

export function setToast(fn: ToastFn) {
    window.__toast = fn;
}