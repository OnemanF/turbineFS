import { useEffect, useMemo, useState } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";

type Session = { token: string; nickname: string; role: string };

export default function App() {
    const [session, setSession] = useState<Session | null>(null);
    const authed = useMemo(() => !!session?.token, [session]);
    const isAdmin = useMemo(() => (session?.role ?? "") === "Admin", [session]);
    const [tab, setTab] = useState<"dashboard" | "admin">("dashboard");
    
    useEffect(() => {
        localStorage.removeItem("jwt");
        localStorage.removeItem("nickname");
        localStorage.removeItem("role");
    }, []);

    return (
        <div>
            <header className="header">
                <div className="brand">
                    <h1>TurbineFS</h1>
                    <div className="subtitle">Offshore windmill monitoring & control</div>
                </div>

                <div className="row" style={{ justifyContent: "flex-end" }}>
          <span className="badge">
            <span className={`dot ${authed ? "green" : ""}`} />
              {authed ? `Logged in${session?.role ? ` (${session.role})` : ""}` : "Guest"}
          </span>

                    {authed && isAdmin && (
                        <>
                            <button className={`btn ${tab === "dashboard" ? "btn-primary" : ""}`} onClick={() => setTab("dashboard")}>
                                Dashboard
                            </button>
                            <button className={`btn ${tab === "admin" ? "btn-primary" : ""}`} onClick={() => setTab("admin")}>
                                Admin
                            </button>
                        </>
                    )}

                    <button
                        className="btn btn-danger"
                        onClick={() => {
                            localStorage.removeItem("jwt");
                            localStorage.removeItem("nickname");
                            localStorage.removeItem("role");
                            setSession(null);
                        }}
                        disabled={!authed}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <hr />

            {!authed ? (
                <div className="card">
                    <LoginPage
                        onLoggedIn={(s) => {
                            localStorage.setItem("jwt", s.token);
                            localStorage.setItem("nickname", s.nickname);
                            localStorage.setItem("role", s.role);
                            setSession(s);
                            setTab("dashboard");
                        }}
                    />
                </div>
            ) : tab === "admin" && isAdmin ? (
                <div className="card">
                    <AdminUsersPage />
                </div>
            ) : (
                <DashboardPage />
            )}
        </div>
    );
}