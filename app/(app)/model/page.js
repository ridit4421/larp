"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Card, Impact, PageHead, Btn, Stat, Loading } from "@/components/ui";
import { LABELS } from "@/lib/data";

export default function ModelPage() {
  const { data, api, reload, profile } = useApp();
  const [versions, setVersions] = useState([]), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const load = () => supabase.from("model_versions").select("version,accuracy,trained_on,created_by,created_at").order("version", { ascending: false }).then(({ data }) => setVersions(data || []));
  useEffect(() => { load(); }, []);
  if (!data) return <Loading />;
  const m = data.model;

  async function retrain() {
    setBusy(true);
    const r = await api("/api/retrain", { method: "POST" });
    setMsg(r.error ? r.error : `Retrained: v${r.version}, accuracy ${(r.before * 100).toFixed(1)}% → ${(r.after * 100).toFixed(1)}% on ${r.trainedOn} cases.`);
    await reload(); await load(); setBusy(false);
  }
  return (
    <>
      <PageHead title="AI Model" sub="Logistic regression trained on historical acquisition cases; retrained as new closed cases arrive">
        {profile.role === "admin" ? <Btn onClick={retrain} disabled={busy}>{busy ? "Training..." : "Retrain with new closed cases"}</Btn> : <span className="text-xs text-slate-400">Only admins can retrain</span>}
      </PageHead>
      {msg && <p className="mb-3 rounded-lg bg-indigo-50 p-2 text-sm text-indigo-800">{msg}</p>}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Version" value={`v${m.version}`} />
        <Stat label="Holdout accuracy" value={`${(m.accuracy * 100).toFixed(1)}%`} />
        <Stat label="Trained on" value={m.trainedOn} sub="cases" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Global feature importance (standardized coefficients)">
          {[...m.weights].sort((a, b) => b.weight - a.weight).map((w) => <Impact key={w.key} label={LABELS[w.key]} v={w.weight} max={2} />)}
        </Card>
        <Card title="Version history (stored in Supabase)">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500"><tr><th>Version</th><th>Accuracy</th><th>Cases</th><th>By</th><th>When</th></tr></thead>
            <tbody>
              {versions.map((v) => <tr key={v.version} className="border-t"><td className="py-1">v{v.version}</td><td>{(v.accuracy * 100).toFixed(1)}%</td><td>{v.trained_on}</td><td>{v.created_by}</td><td>{new Date(v.created_at).toLocaleString()}</td></tr>)}
              <tr className="border-t text-slate-400"><td className="py-1">v1</td><td colSpan={4}>Baseline (trained at startup on 800 seeded cases)</td></tr>
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
