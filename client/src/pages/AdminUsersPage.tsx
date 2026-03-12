import { useMemo, useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/toast";

type Role = "Admin" | "Operator" | "Inspector";

export default function AdminUsersPage() {
    const toast = useToast();

    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>("Operator");
    const [busy, setBusy] = useState(false);

    const canSubmit = useMemo(() => {
        const n = nickname.trim();
        return n.length > 0 && password.length >= 8 && !busy;
    }, [nickname, password, busy]);

    const createUser = async () => {
        const n = nickname.trim();
        if (!n) return toast.push("Nickname is required.", "error");
        if (password.length < 8) return toast.push("Password must be at least 8 characters.", "error");

        setBusy(true);
        try {
            const res: any = await api.auth.register({ nickname: n, password, role } as any);
            toast.push(`Created user: ${res?.nickname ?? n} (${res?.role ?? role})`, "info");
            setNickname("");
            setPassword("");
            setRole("Operator");
        } catch (e: any) {
            if (e?.status === 409) {
                toast.push("Nickname already exists. Pick another one.", "error");
                return;
            }
            if (e?.status === 401) {
                toast.push("You must be logged in as Admin to create users.", "error");
                return;
            }
            if (e?.status === 403) {
                toast.push("Forbidden. Admin role is required.", "error");
                return;
            }
            
            try {
                const parsed = JSON.parse(e?.response ?? "{}");
                const msg = parsed?.detail || parsed?.title;
                toast.push(msg ? String(msg) : "Failed to create user.", "error");
            } catch {
                toast.push(e?.message ?? "Failed to create user.", "error");
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
            <h2 style={{ margin: 0 }}>Admin: Create user</h2>

            <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Nickname</span>
                <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    disabled={busy}
                    placeholder="e.g. operator2"
                />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Password (min 8 chars)</span>
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    disabled={busy}
                />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Role</span>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={busy}>
                    <option value="Operator">Operator</option>
                    <option value="Inspector">Inspector</option>
                    <option value="Admin">Admin</option>
                </select>
            </label>

            <button className="btn btn-primary" disabled={!canSubmit} onClick={() => void createUser()}>
                {busy ? "Creating..." : "Create user"}
            </button>

            <div className="muted" style={{ fontSize: 12 }}>
                Tip: if you get <kbd>409</kbd>, that nickname already exists.
            </div>
        </div>
    );
}