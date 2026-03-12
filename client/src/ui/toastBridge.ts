let toastFn: ((msg: string) => void) | null = null;

export function setToast(fn: (msg: string) => void) {
    toastFn = fn;
}

export function showToast(msg: string) {
    toastFn?.(msg);
}