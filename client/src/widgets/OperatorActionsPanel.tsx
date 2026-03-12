import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { OperatorAction } from "../generated-ts-client";
import { formatDaDateTime } from "../ui/format";

type Props = { farmId: string; turbineId: string; take?: number };

function safeJsonParse(s?: string) {
    if (!s) return null;
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
}

function prettyAction(commandType?: string, payloadJson?: string) {
    const cmd = (commandType ?? "").trim();
    const payload = safeJsonParse(payloadJson);

    switch (cmd) {
        case "setInterval": {
            const v = payload?.value;
            return v != null ? `Set interval → ${v}s` : "Set interval";
        }
        case "setPitch": {
            const a = payload?.angle;
            return a != null ? `Set pitch → ${a}°` : "Set pitch";
        }
        case "start":
            return "Start turbine";
        case "stop": {
            const r = payload?.reason;
            return r ? `Stop turbine → (${r})` : "Stop turbine";
        }
        default:
            return cmd ? cmd : "Unknown action";
    }
}

function prettyOperator(id?: string) {
    if (!id) return "unknown";
    return id.startsWith("u-") ? id.slice(2) : id;
}

export default function OperatorActionsPanel({ farmId, turbineId, take = 20 }: Props) {
    const [items, setItems] = useState<OperatorAction[]>([]);
    const [busy, setBusy] = useState(false);

    const canLoad = useMemo(
        () => farmId.trim().length > 0 && turbineId.trim().length > 0,
        [farmId, turbineId]
    );

    const load = async () => {
        if (!canLoad) return;
        setBusy(true);
        try {
            const res = await api.windmills.getOperatorActions(farmId, turbineId, take);
            setItems((res ?? []).slice());
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        void load();
    }, [farmId, turbineId, take]);

    const sorted = useMemo(
        () => items.slice().sort((a, b) => (a.timestamp ?? "").localeCompare(b.timestamp ?? "")),
        [items]
    );

    return (
        <div style={{ display: "grid", gap: 10 }}>
            <div className="row" style={{ alignItems: "center" }}>
                <div className="muted">Last {take} actions</div>
                <div className="spacer" />
                <button className="btn" disabled={busy || !canLoad} onClick={() => void load()}>
                    {busy ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {sorted.length === 0 ? (
                <div className="muted">No operator actions recorded yet.</div>
            ) : (
                <div style={{ display: "grid", gap: 10 }}>
                    {sorted.map((a) => (
                        <div key={a.id} className="alertItem">
                            <div className="alertTop">
                                <strong>{prettyAction(a.commandType, a.payloadJson)}</strong>
                                <span className="muted">{formatDaDateTime(a.timestamp)}</span>
                            </div>

                            <div className="muted" style={{ marginTop: 6 }}>
                                Operator: <kbd>{prettyOperator(a.operatorUserId)}</kbd>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}