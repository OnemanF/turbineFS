import { useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/toast";

type Props = { onLoggedIn: (s: { token: string; nickname: string; role: string }) => void };

function withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
    return new Promise((resolve, reject) => {
        const id = window.setTimeout(() => reject(new Error("Login timed out (API not responding)")), ms);
        p.then((v) => {
            window.clearTimeout(id);
            resolve(v);
        }).catch((e) => {
            window.clearTimeout(id);
            reject(e);
        });
    });
}

export default function LoginPage({ onLoggedIn }: Props) {
    const toast = useToast();
    const [nickname, setNickname] = useState("admin");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const res: any = await withTimeout(api.auth.login({ nickname, password }), 12000);
            if (!res?.token) throw new Error("Login failed");
            onLoggedIn({ token: res.token, nickname: res.nickname ?? nickname, role: res.role ?? "" });
            setPassword("");
        } catch (e: any) {
            toast.push(e?.message ?? "Login failed", "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
            <div>
                <h2 style={{ margin: 0 }}>Login</h2>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Nickname</span>
                <input value={nickname} onChange={(e) => setNickname(e.target.value)} disabled={busy} onKeyDown={(e) => e.key === "Enter" && void submit()} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Password</span>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" disabled={busy} onKeyDown={(e) => e.key === "Enter" && void submit()} />
            </label>

            <div className="row">
                <button className="btn btn-primary" disabled={busy} onClick={() => void submit()}>
                    {busy ? "Logging in..." : "Login"}
                </button>
            </div>
        </div>
    );
}