import type { WindmillTelemetry } from "../generated-ts-client";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = { telemetry: WindmillTelemetry[] };

function formatTime(ts?: string) {
    if (!ts) return "";
    const d = new Date(ts);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ss = d.getSeconds().toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
}

export default function TelemetryChart({ telemetry }: Props) {
    const data = (telemetry ?? []).map((t) => ({
        ...t,
        t: formatTime(t.timestamp),
    }));

    return (
        <div style={{ width: "100%", height: 340 }}>
            {data.length === 0 ? (
                <div style={{ opacity: 0.7 }}>No telemetry yet.</div>
            ) : (
                <ResponsiveContainer>
                    <LineChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="t" minTickGap={20} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="powerOutput" name="Power" dot={false} />
                        <Line type="monotone" dataKey="windSpeed" name="WindSpeed" dot={false} />
                        <Line type="monotone" dataKey="rotorSpeed" name="RotorSpeed" dot={false} />
                        <Line type="monotone" dataKey="vibration" name="Vibration" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}