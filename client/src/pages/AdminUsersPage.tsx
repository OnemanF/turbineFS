import { useState } from "react";
import { api } from "../api";

export default function AdminUsersPage() {
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"Admin" | "Operator" | "Inspector">("Operator");
    const [busy, setBusy] = useState(false);

    return (
        <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <h2 style={{ margin: 0 }}>Admin: Create user</h2>

            <label style={{ display: "grid", gap: 6 }}>
                <span>Nickname</span>
                <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
                <span>Password (min 8 chars)</span>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
                <span>Role</span>
                <select value={role} onChange={(e) => setRole(e.target.value as any)}>
                    <option value="Operator">Operator</option>
                    <option value="Inspector">Inspector</option>
                    <option value="Admin">Admin</option>
                </select>
            </label>

            <button
                disabled={busy}
                onClick={async () => {
                    setBusy(true);
                    try {
                        const res = await api.auth.register({ nickname, password, role } as any);
                        alert(`Created user: ${res?.nickname ?? nickname} (${res?.role ?? role})`);
                        setNickname("");
                        setPassword("");
                        setRole("Operator");
                    } finally {
                        setBusy(false);
                    }
                }}
            >
                {busy ? "Creating..." : "Create user"}
            </button>
        </div>
    );
}