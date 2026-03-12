import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useFarmRealtime } from "../realtime/useFarmRealtime";
import TelemetryChart from "../widgets/TelemetryChart";
import ControlsPanel from "../widgets/ControlsPanel";
import type { Alert, Windmill, WindmillTelemetry } from "../generated-ts-client";
import { formatDaDateTime } from "../ui/format";
import OperatorActionsPanel from "../widgets/OperatorActionsPanel";

const DEFAULT_FARM_ID = "FeikesWIND";

type Props = { role: string };

function latestStatusForTurbine(allTelemetry: WindmillTelemetry[], turbineId?: string) {
    if (!turbineId) return "unknown";
    for (let i = allTelemetry.length - 1; i >= 0; i--) {
        const t = allTelemetry[i];
        if (t.windmillId === turbineId && t.status) return t.status;
    }
    return "unknown";
}

function statusDot(status: string) {
    const s = (status ?? "").toLowerCase();
    if (s.includes("run") || s === "ok") return "green";
    if (s.includes("stop") || s.includes("fault") || s.includes("error")) return "red";
    return "";
}

export default function DashboardPage({ role }: Props) {
    const [farmIdInput, setFarmIdInput] = useState(DEFAULT_FARM_ID);
    const [farmId, setFarmId] = useState(DEFAULT_FARM_ID);

    const [windmills, setWindmills] = useState<Windmill[]>([]);
    const [selected, setSelected] = useState<Windmill | null>(null);
    const canLoad = useMemo(() => farmIdInput.trim().length > 0, [farmIdInput]);

    const rt = useFarmRealtime(farmId);
    const telemetry = (rt.data?.telemetry ?? []) as WindmillTelemetry[];
    const alerts = (rt.data?.alerts ?? []) as Alert[];

    const loadWindmills = useCallback(async (farm: string) => {
        const list = await api.windmills.getWindmills(farm);
        const safe = list ?? [];
        setWindmills(safe);
        setSelected((prev) => (prev && safe.some((w) => w.id === prev.id) ? prev : safe[0] ?? null));
    }, []);

    const applyFarmAndLoad = useCallback(async () => {
        const next = farmIdInput.trim();
        if (!next) return;

        setSelected(null);
        setWindmills([]);

        setFarmId(next);
        await loadWindmills(next);
    }, [farmIdInput, loadWindmills]);

    useEffect(() => {
        applyFarmAndLoad().catch(() => {
            setWindmills([]);
            setSelected(null);
        });
        
    }, []);

    const filteredTelemetry = useMemo(() => {
        if (!selected?.id) return [];
        return telemetry.filter((t) => t.windmillId === selected.id);
    }, [telemetry, selected?.id]);

    const filteredAlerts = useMemo(() => {
        if (!selected?.id) return [];
        return alerts.filter((a) => a.windmillId === selected.id);
    }, [alerts, selected?.id]);

    return (
        <div className="panelGrid">
            <section className="card">
                <div className="row">
                    <label style={{ display: "grid", gap: 6, width: 320 }}>
                        <span className="muted">Farm ID</span>
                        <input
                            value={farmIdInput}
                            onChange={(e) => setFarmIdInput(e.target.value)}
                            placeholder={DEFAULT_FARM_ID}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") applyFarmAndLoad().catch(() => {});
                            }}
                        />
                    </label>

                    <button
                        className="btn btn-primary"
                        disabled={!canLoad}
                        onClick={() => applyFarmAndLoad().catch(() => {})}
                    >
                        Load windmills
                    </button>

                    <div className="spacer" />

                    <span className="badge">
          <span className={`dot ${rt.connected ? "green" : ""}`} />
          SSE {rt.connected ? "connected" : "connecting"}
        </span>

                    {rt.group && (
                        <span className="badge">
            <span className="dot" />
            group <kbd>{rt.group}</kbd>
          </span>
                    )}

                    {rt.error && (
                        <span className="badge">
            <span className="dot red" />
                            {rt.error}
          </span>
                    )}
                </div>
            </section>

            <div className="layout">
                <aside className="card">
                    <h3 className="card-title">Windmills</h3>

                    {windmills.length === 0 ? (
                        <div className="muted">No windmills loaded.</div>
                    ) : (
                        <ul className="sidebarList">
                            {windmills.map((w) => {
                                const active = selected?.id === w.id;
                                const status = latestStatusForTurbine(telemetry, w.id);
                                const dot = statusDot(status);

                                return (
                                    <li key={w.id}>
                                        <button
                                            className={`windmillBtn ${active ? "windmillBtnActive" : ""}`}
                                            onClick={() => setSelected(w)}
                                        >
                                            <div className="windmillName">
                                                <span>{w.name}</span>
                                                <span className="badge">
                        <span className={`dot ${dot}`} />
                                                    {status}
                      </span>
                                            </div>
                                            <div className="windmillMeta">
                                                <div>
                                                    ID: <kbd>{w.id}</kbd>
                                                </div>
                                                <div className="muted">{w.location}</div>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </aside>

                <main className="panelGrid">
                    <section className="card">
                        <h3 className="card-title">Telemetry</h3>
                        {!selected ? (
                            <div className="muted">Select a windmill.</div>
                        ) : (
                            <TelemetryChart telemetry={filteredTelemetry} />
                        )}
                    </section>

                    <section className="card">
                        <h3 className="card-title">Alerts</h3>
                        {!selected ? (
                            <div className="muted">Select a windmill.</div>
                        ) : filteredAlerts.length === 0 ? (
                            <div className="muted">No alerts.</div>
                        ) : (
                            <div style={{ display: "grid", gap: 10 }}>
                                {filteredAlerts
                                    .slice()
                                    .reverse()
                                    .map((a) => (
                                        <div className="alertItem" key={a.id}>
                                            <div className="alertTop">
                                                <strong>{(a.severity ?? "info").toUpperCase()}</strong>
                                                <span className="muted">{formatDaDateTime(a.timestamp)}</span>
                                            </div>
                                            <div className="muted" style={{ marginTop: 4 }}>
                                                <kbd>{a.code}</kbd>
                                            </div>
                                            <div style={{ marginTop: 6 }}>{a.message}</div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </section>

                    <section className="card">
                        <h3 className="card-title">Controls</h3>
                        {!selected ? (
                            <div className="muted">Select a windmill to control.</div>
                        ) : (
                            <ControlsPanel farmId={selected.farmId!} turbineId={selected.id!} role={role} />
                        )}
                    </section>

                    {}
                    <section className="card">
                        <h3 className="card-title">Operator actions</h3>
                        {!selected ? (
                            <div className="muted">Select a windmill.</div>
                        ) : (
                            <OperatorActionsPanel farmId={selected.farmId!} turbineId={selected.id!} take={20} />
                        )}
                    </section>
                </main>
            </div>
        </div>
    );}