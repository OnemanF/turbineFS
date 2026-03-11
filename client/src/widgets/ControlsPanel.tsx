import { useState } from "react";
import { api } from "../api";

type Props = { farmId: string; turbineId: string };

export default function ControlsPanel({ farmId, turbineId }: Props) {
    const [interval, setIntervalValue] = useState(10);
    const [pitch, setPitch] = useState(10);
    const [stopReason, setStopReason] = useState("maintenance");
    const [busy, setBusy] = useState<string | null>(null);

    const send = async (action: string, payload: any) => {
        setBusy(action);
        try {
            await api.windmills.sendCommand(farmId, turbineId, { action, payload });
            alert(`Command accepted: ${action}`);
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
                        <button className="btn btn-primary" disabled={busy !== null} onClick={() => send("setInterval", { value: interval })}>
                            {busy === "setInterval" ? "Sending..." : "Set"}
                        </button>
                    </div>
                    <div className="muted" style={{ marginTop: 8 }}>1–60 seconds</div>
                </div>

                <div className="kpi">
                    <div className="kpiLabel">Set blade pitch</div>
                    <div className="row" style={{ marginTop: 10 }}>
                        <input type="number" min={0} max={30} step={0.1} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} />
                        <button className="btn btn-primary" disabled={busy !== null} onClick={() => send("setPitch", { angle: pitch })}>
                            {busy === "setPitch" ? "Sending..." : "Set"}
                        </button>
                    </div>
                    <div className="muted" style={{ marginTop: 8 }}>0–30°</div>
                </div>
            </div>

            <div className="split2">
                <div className="kpi">
                    <div className="kpiLabel">Stop turbine</div>
                    <div className="row" style={{ marginTop: 10 }}>
                        <input value={stopReason} onChange={(e) => setStopReason(e.target.value)} placeholder="reason (optional)" />
                        <button className="btn btn-danger" disabled={busy !== null} onClick={() => send("stop", { reason: stopReason })}>
                            {busy === "stop" ? "Sending..." : "Stop"}
                        </button>
                    </div>
                </div>

                <div className="kpi">
                    <div className="kpiLabel">Start turbine</div>
                    <div className="row" style={{ marginTop: 10 }}>
                        <button className="btn btn-primary" disabled={busy !== null} onClick={() => send("start", {})} style={{ width: "100%" }}>
                            {busy === "start" ? "Sending..." : "Start"}
                        </button>
                    </div>
                    <div className="muted" style={{ marginTop: 8 }}>Requires authentication</div>
                </div>
            </div>
        </div>
    );
}