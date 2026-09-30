"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Card, Badge, Bar, Impact, PageHead, Loading, Btn } from "@/components/ui";
import { LABELS } from "@/lib/data";

const SLIDERS = [["compPaid", 0, 100, 1], ["approvalDelay", 0, 500, 5], ["legal", 0, 6, 1], ["docGap", 0, 100, 1], ["rr", 0, 100, 1], ["possession", 0, 100, 1]];

export default function ProjectDetail() {
  const { id } = useParams();
  const { data, api, profile } = useApp();
  const p = data?.projects.find((x) => x.id === id);
  const [recs, setRecs] = useState(null), [busy, setBusy] = useState(false);
  const [ov, setOv] = useState({}), [sim, setSim] = useState(null), [msg, setMsg] = useState("");

  useEffect(() => {
    if (!p) return;
    const t = setTimeout(async () => {
      if (Object.keys(ov).length) setSim(await api("/api/predict", { method: "POST", body: JSON.stringify({ id, overrides: ov }) }));
      else setSim(null);
    }, 300);
    return () => clearTimeout(t);
  }, [ov, p?.id]);

  if (!data) return <Loading />;
  if (!p) return <p className="p-6">Project not found. <Link href="/projects" className="text-indigo-600">Back</Link></p>;

  async function getRecs() { setBusy(true); setRecs(await api("/api/recommend", { method: "POST", body: JSON.stringify({ id }) })); setBusy(false); }
  async function escalate() {
    const { error } = await supabase.from("alerts").insert({
      project_id: p.id, project_name: p.name, rule_name: "Manual escalation", level: "critical",
      score: p.score, driver: LABELS[p.drivers[0].key], recommendation: "Manually escalated by " + profile.email,
    });
    setMsg(error ? error.message : "Escalated. It now appears in Automation > alerts.");
  }
  const factors = [["Land area (ha)", p.areaHa], ["Families", p.families], ["Compensation paid", p.compPaid + "%"], ["Approval delay", p.approvalDelay + " d"], ["Legal disputes", p.legal], ["Possession", p.possession + "%"], ["R&R progress", p.rr + "%"], ["Responsiveness", p.resp], ["Historical delay", p.hist], ["Doc gap", p.docGap + "%"]];
  return (
    <>
      <PageHead title={`${p.id} · ${p.name}`} sub={`${p.type} · ${p.district}, ${p.state}`}>
        <Link href="/projects" className="text-sm text-slate-500 underline">All projects</Link>
        {profile.role !== "viewer" && <Btn onClick={escalate}>Escalate</Btn>}
      </PageHead>
      {msg && <p className="mb-3 rounded-lg bg-indigo-50 p-2 text-sm text-indigo-800">{msg}</p>}
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card title="Delay risk">
          <div className="flex items-center gap-3">
            <span className={`rounded-xl px-4 py-3 text-3xl font-bold text-white ${p.band === "Critical" ? "bg-red-600" : p.band === "High" ? "bg-orange-500" : p.band === "Medium" ? "bg-yellow-500" : "bg-green-500"}`}>{p.score}</span>
            <div><Badge band={p.band} /><p className="mt-1 text-xs text-slate-500">Probability of delay: {(p.prob * 100).toFixed(1)}%</p></div>
          </div>
        </Card>
        <Card title="Project data" className="md:col-span-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-5">
            {factors.map(([l, v]) => <div key={l}><p className="text-[11px] text-slate-400">{l}</p><p className="font-semibold">{v}</p></div>)}
          </div>
        </Card>
      </div>
      <Card title="Lifecycle timeline: stage-wise delay probability" className="mb-4">
        <div className="flex flex-col gap-2 md:flex-row">
          {Object.entries(p.stages).map(([s, v], i, a) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex-1 rounded-xl border p-3 text-center ${v > 0.6 ? "border-red-300 bg-red-50" : v > 0.35 ? "border-yellow-300 bg-yellow-50" : "border-green-300 bg-green-50"}`}>
                <p className="text-xs font-semibold">{s}</p><p className="text-xl font-bold">{Math.round(v * 100)}%</p>
              </div>
              {i < a.length - 1 && <span className="hidden text-slate-400 md:block">›</span>}
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Why this score? (explainable AI, all factors)">
          <p className="mb-2 text-[11px] text-slate-400">Red pushes delay risk up, green pulls it down (log-odds contribution).</p>
          {p.drivers.map((d) => <Impact key={d.key} label={`${LABELS[d.key]} = ${p[d.key]}`} v={d.impact} />)}
        </Card>
        <div className="space-y-4">
          <Card title="AI recommendations" right={<Btn onClick={getRecs} disabled={busy}>{busy ? "Thinking..." : recs ? "Regenerate" : "Generate with Gemini"}</Btn>}>
            {!recs ? <p className="text-sm text-slate-400">Click generate for corrective actions based on the top drivers.</p> : (
              <>
                <p className="mb-1 text-[11px] uppercase text-slate-400">source: {recs.source}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm">{recs.items?.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </>
            )}
          </Card>
          <Card title="What-if simulator" right={Object.keys(ov).length > 0 && <button onClick={() => setOv({})} className="text-xs text-indigo-600">Reset</button>}>
            {SLIDERS.map(([k, min, max, step]) => (
              <div key={k} className="mb-2">
                <div className="flex justify-between text-xs"><span>{LABELS[k]}</span><b>{ov[k] ?? p[k]}</b></div>
                <input type="range" min={min} max={max} step={step} value={ov[k] ?? p[k]} onChange={(e) => setOv({ ...ov, [k]: +e.target.value })} className="w-full" />
              </div>
            ))}
            {sim && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm">Risk: <b>{p.score}</b> → <b className={sim.score < p.score ? "text-green-600" : "text-red-600"}>{sim.score}</b> ({sim.score - p.score > 0 ? "+" : ""}{sim.score - p.score} pts)</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
