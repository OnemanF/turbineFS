import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/toast";

type Props = {
    farmId: string;
    turbineId: string;
    role: string;
};

export default function ControlsPanel({ farmId, turbineId, role }: Props) {
    const toast = useToast();

    const canSend = useMemo(() => {
        const r = (role ?? "").toLowerCase();
        return r === "admin" || r === "operator";
    }, [role]);

    const [interval, setIntervalValue] = useState(10);
    const [pitch, setPitch] = useState(10);
    const [stopReason, setStopReason] = useState("maintenance");
    const [busy, setBusy] = useState<string | null>(null);
    
    useEffect(() => {
        setIntervalValue(10);
        setPitch(10);
        setStopReason("maintenance");
    }, [turbineId]);

    const send = async (action: string, payload: any) => {
        if (!canSend) {
            toast.push("Requires Operator/Admin", "error");
            return;
        }

        setBusy(action);
        try {
            await api.windmills.sendCommand(farmId, turbineId, { action, payload });
            toast.push(`Command accepted: ${action}`, "info");
        } catch (e: any) {
            toast.push(e?.message ?? "Command failed", "error");
        } finally {
            setBusy(null);
        }
    };

    return (
        <div style={{ display: "grid", gap: 14 }}>
            <div className="split2">
                <div className="kpi">
                    <div className="kpiLabel">Set reporting interval</div>
                    <div className="row" style={{ marginTop: 10 }}>
                        <input type="number" min={1} max={60} value={interval} onChange={(e) => setIntervalValue(Number(e.target.value))} />
                        <button className="btn btn-primary" disabled={busy !== null || !canSend} onClick={() => send("setInterval", { value: interval })}>
                            {busy === "setInterval" ? "Sending..." : "Set"}
                        </button>
                    </div>
                    <div className="muted" style={{ marginTop: 8 }}>
                        1–60 seconds {canSend ? "" : " • Requires Operator/Admin"}
                    </div>
                </div>

                <div className="kpi">
                    <div className="kpiLabel">Set blade pitch</div>
                    <div className="row" style={{ marginTop: 10 }}>
                        <input type="number" min={0} max={30} step={0.1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
                        <button className="btn btn-primary" disabled={busy !== null || !canSend} onClick={() => send("setPitch", { angle: pitch })}>
                            {busy === "setPitch" ? "Sending..." : "Set"}
                        </button>
                    </div>
                    <div className="muted" style={{ marginTop: 8 }}>
                        0–30° {canSend ? "" : " • Requires Operator/Admin"}
                    </div>
                </div>
            </div>

            <div className="split2">
                <div className="kpi">
                    <div className="kpiLabel">Stop turbine</div>
                    <div className="row" style={{ marginTop: 10 }}>
                        <input value={stopReason} onChange={(e) => setStopReason(e.target.value)} placeholder="reason (optional)" />
                        <button className="btn btn-danger" disabled={busy !== null || !canSend} onClick={() => send("stop", { reason: stopReason })}>
                            {busy === "stop" ? "Sending..." : "Stop"}
                        </button>
                    </div>
                    {!canSend && <div className="muted" style={{ marginTop: 8 }}>Requires Operator/Admin</div>}
                </div>

                <div className="kpi">
                    <div className="kpiLabel">Start turbine</div>
                    <div className="row" style={{ marginTop: 10 }}>
                        <button className="btn btn-primary" disabled={busy !== null || !canSend} onClick={() => send("start", {})} style={{ width: "100%" }}>
                            {busy === "start" ? "Sending..." : "Start"}
                        </button>
                    </div>
                    {!canSend && <div className="muted" style={{ marginTop: 8 }}>Requires Operator/Admin</div>}
                </div>
            </div>
        </div>
    );
}