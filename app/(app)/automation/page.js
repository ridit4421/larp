"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Card, PageHead, Btn, LEVEL_CLS } from "@/components/ui";

const COLS = [["open", "Open"], ["acknowledged", "Acknowledged"], ["resolved", "Resolved"]];

export default function Automation() {
  const { api, reload, profile } = useApp();
  const [rules, setRules] = useState([]), [alerts, setAlerts] = useState([]), [log, setLog] = useState([]);
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [live, setLive] = useState(false);
  const canAct = profile.role !== "viewer", isAdmin = profile.role === "admin";

  const refresh = useCallback(async () => {
    const [r, a, l] = await Promise.all([
      supabase.from("automation_rules").select("*").order("id"),
      supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(90),
      canAct ? supabase.from("audit_logs").select("*").in("action", ["AUTO_RUN", "INGEST_UPDATE"]).order("at", { ascending: false }).limit(8) : { data: [] },
    ]);
    setRules(r.data || []); setAlerts(a.data || []); setLog(l.data || []);
  }, [canAct]);
  useEffect(() => { refresh(); }, [refresh]);

  const runOnce = useCallback(async (simulate) => {
    if (simulate) await api("/api/simulate", { method: "POST" });
    await reload();
    const r = await api("/api/automation/run", { method: "POST" });
    setMsg(r.error ? r.error : `Engine ran: ${r.rules} rules, ${r.created} new alerts${r.pending ? `, ${r.pending} queued` : ""}.`);
    await refresh();
  }, [api, reload, refresh]);

  async function manual(sim) { setBusy(true); await runOnce(sim); setBusy(false); }

  const ref = useRef(runOnce); ref.current = runOnce;
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => ref.current(true), 30000);
    return () => clearInterval(t);
  }, [live]);

  async function toggle(r) {
    const { error } = await supabase.from("automation_rules").update({ enabled: !r.enabled }).eq("id", r.id);
    if (error) setMsg("Only admins can edit rules."); else refresh();
  }
  async function threshold(r, v) {
    const { error } = await supabase.from("automation_rules").update({ threshold: +v }).eq("id", r.id);
    if (error) setMsg("Only admins can edit rules."); else refresh();
  }
  async function setStatus(a, status) {
    await supabase.from("alerts").update({ status, updated_at: new Date().toISOString() }).eq("id", a.id);
    refresh();
  }

  return (
    <>
      <PageHead title="Smart Automation" sub="Ingest updates, re-score with ML, apply rules, raise alerts and route them through a workflow">
        {canAct && <>
          <Btn disabled={busy} onClick={() => manual(false)}>Run engine now</Btn>
          <Btn disabled={busy} onClick={() => manual(true)} className="bg-slate-700 hover:bg-slate-800">Ingest simulated update + run</Btn>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Live mode (30s)</label>
        </>}
      </PageHead>
      {msg && <p className="mb-3 rounded-lg bg-indigo-50 p-2 text-sm text-indigo-800">{msg}</p>}
      {live && <p className="mb-3 text-xs text-green-700">Live mode on: every 30 seconds new field updates arrive, the model re-scores, and rules fire automatically. Keep this tab open.</p>}
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card title="Automation rules (editable by admin)" className="lg:col-span-2">
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm">
                <input type="checkbox" checked={r.enabled} disabled={!isAdmin} onChange={() => toggle(r)} />
                <span className="font-medium">{r.name}</span>
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${LEVEL_CLS[r.level]}`}>{r.level}</span>
                <span className="text-xs text-slate-500">{r.trigger.replace("_gte", " ≥").replace("_lte", " ≤")}</span>
                <input type="number" defaultValue={r.threshold} disabled={!isAdmin} onBlur={(e) => +e.target.value !== r.threshold && threshold(r, e.target.value)} className="w-16 rounded border px-1 text-xs" />
                <span className="ml-auto text-xs text-slate-500">→ {r.action}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Automation activity">
          {log.length === 0 && <p className="text-xs text-slate-400">No activity yet.</p>}
          <ul className="space-y-1 text-xs text-slate-600">{log.map((l) => <li key={l.id}>{new Date(l.at).toLocaleTimeString()} · <b>{l.action}</b> · {l.detail}</li>)}</ul>
          <p className="mt-3 text-[11px] text-slate-400">A daily Vercel Cron also runs the engine (see README).</p>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {COLS.map(([s, label]) => (
          <Card key={s} title={`${label} (${alerts.filter((a) => a.status === s).length})`}>
            <div className="max-h-[420px] space-y-2 overflow-auto">
              {alerts.filter((a) => a.status === s).map((a) => (
                <div key={a.id} className="rounded-lg border p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`rounded px-1.5 py-0.5 font-semibold ${LEVEL_CLS[a.level]}`}>{a.level}</span>
                    <span className="text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1"><Link className="font-semibold text-indigo-700" href={`/projects/${a.project_id}`}>{a.project_id}</Link> · risk {a.score}% · {a.driver}</p>
                  <p className="text-slate-500">{a.rule_name}</p>
                  <p className="mt-1 text-slate-600">{a.recommendation}</p>
                  {canAct && s !== "resolved" && (
                    <div className="mt-2 flex gap-2">
                      {s === "open" && <button onClick={() => setStatus(a, "acknowledged")} className="rounded bg-slate-200 px-2 py-0.5">Acknowledge</button>}
                      <button onClick={() => setStatus(a, "resolved")} className="rounded bg-green-600 px-2 py-0.5 text-white">Resolve</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
