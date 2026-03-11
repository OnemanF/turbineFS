import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { setToast } from "./toastBridge";

type ToastKind = "info" | "error";
type ToastState = { open: boolean; message: string; kind: ToastKind };

type ToastApi = {
    push: (message: string, kind?: ToastKind) => void;
    close: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToastState] = useState<ToastState>({ open: false, message: "", kind: "error" });

    const close = useCallback(() => {
        setToastState((t) => ({ ...t, open: false }));
    }, []);

    const push = useCallback((message: string, kind: ToastKind = "error") => {
        setToastState({ open: true, message, kind });
        
        window.setTimeout(() => {
            setToastState((t) => (t.open && t.message === message ? { ...t, open: false } : t));
        }, 4000);
    }, []);
    
    setToast((msg) => push(msg, "error"));

    const api = useMemo(() => ({ push, close }), [push, close]);

    return (
        <ToastContext.Provider value={api}>
            {children}

            {toast.open && (
                <div className="centerToastOverlay" role="dialog" aria-modal="true" onClick={close}>
                    <div className={`centerToastCard ${toast.kind === "error" ? "centerToastError" : ""}`} onClick={(e) => e.stopPropagation()}>
                        <div className="centerToastTitle">{toast.kind === "error" ? "Action blocked" : "Notice"}</div>
                        <div className="centerToastMessage">{toast.message}</div>
                        <div className="centerToastActions">
                            <button className="btn btn-primary" onClick={close}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
}