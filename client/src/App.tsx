import { useMemo, useState } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import { setAuthToken } from "./api/authToken";

type Session = { token: string; nickname: string; role: string };

export default function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [tab, setTab] = useState<"dashboard" | "admin">("dashboard");
    const [killKey, setKillKey] = useState(0);

    const isAuthed = !!session?.token;
    const isAdmin = useMemo(
        () => (session?.role ?? "").toLowerCase() === "admin",
        [session?.role]
    );

    const logout = () => {
        setAuthToken(null);
        setSession(null);
        setTab("dashboard");
        setKillKey((k) => k + 1);
    };

    return (
        <div key={killKey}>
            <header className="header card" style={{ marginBottom: 14 }}>
                <div className="brand">
                    <h1>TurbineFS</h1>
                    <div className="subtitle">Offshore windmill monitoring & control</div>
                </div>

                <div className="spacer" />

                <span className="badge">
          <span className={`dot ${isAuthed ? "green" : ""}`} />
                    {isAuthed ? `Logged in (${session?.role || "User"})` : "Guest"}
        </span>

                {isAuthed && (
                    <>
                        <button className="btn" onClick={() => setTab("dashboard")}>
                            Dashboard
                        </button>
                        {isAdmin && (
                            <button className="btn" onClick={() => setTab("admin")}>
                                Admin
                            </button>
                        )}
                        <button className="btn btn-danger" onClick={logout}>
                            Logout
                        </button>
                    </>
                )}
            </header>

            {!isAuthed ? (
                <section className="card">
                    <LoginPage
                        onLoggedIn={(s) => {
                            setAuthToken(s.token);
                            setSession(s);
                            setTab("dashboard");
                        }}
                    />
                </section>
            ) : tab === "admin" && isAdmin ? (
                <section className="card">
                    <AdminUsersPage />
                </section>
            ) : (
                <DashboardPage role={session?.role ?? ""} />
            )}
        </div>
    );
}