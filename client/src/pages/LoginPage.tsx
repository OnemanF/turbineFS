import { useState } from "react";
import { api } from "../api";

type Props = { onLoggedIn: (s: { token: string; nickname: string; role: string }) => void };

export default function LoginPage({ onLoggedIn }: Props) {
    const [nickname, setNickname] = useState(localStorage.getItem("nickname") ?? "admin");
    const [password, setPassword] = useState("adminadmin");
    const [busy, setBusy] = useState(false);

    return (
        <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
            <div>
                <h2 style={{ margin: 0 }}>Login</h2>
                <div className="muted" style={{ marginTop: 4 }}>
                    Use your operator credentials to send commands.
                </div>
            </div>

            <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Nickname</span>
                <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Password</span>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            </label>

            <div className="row">
                <button
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={async () => {
                        setBusy(true);
                        try {
                            const res: any = await api.auth.login({ nickname, password });
                            const token = res?.token ?? "";
                            const role = res?.role ?? "";
                            const nick = res?.nickname ?? nickname;

                            if (!token) throw new Error("Login returned no token");
                            onLoggedIn({ token, nickname: nick, role });
                        } finally {
                            setBusy(false);
                        }
                    }}
                >
                    {busy ? "Logging in..." : "Login"}
                </button>

                <span className="badge">
          <span className="dot" />
          JWT saved to <kbd>localStorage</kbd>
        </span>
            </div>
        </div>
    );
}