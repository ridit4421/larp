"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Card, Stat, Badge, Bar, PageHead, Loading, LEVEL_CLS, BAND_BG } from "@/components/ui";
import { group } from "@/lib/util";
import { LABELS } from "@/lib/data";

export default function Dashboard() {
  const { data } = useApp();
  const [alerts, setAlerts] = useState([]), [rules, setRules] = useState([]);
  useEffect(() => {
    supabase.from("alerts").select("*").neq("status", "resolved").order("created_at", { ascending: false }).limit(6).then(({ data }) => setAlerts(data || []));
    supabase.from("automation_rules").select("id,enabled").then(({ data }) => setRules(data || []));
  }, [data]);
  if (!data) return <Loading />;
  const list = data.projects;
  const avg = Math.round(list.reduce((a, p) => a + p.score, 0) / list.length);
  const dist = ["Low", "Medium", "High", "Critical"].map((b) => ({ b, n: list.filter((p) => p.band === b).length }));
  return (
    <>
      <PageHead title="Command Dashboard" sub="Predictive monitoring of land acquisition projects">
        <Link href="/automation" className="rounded-lg border border-indigo-600 px-3 py-1.5 text-sm font-semibold text-indigo-600">Open automation</Link>
      </PageHead>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Projects monitored" value={list.length} />
        <Stat label="Avg delay probability" value={`${avg}%`} />
        <Stat label="High + Critical" value={list.filter((p) => p.score >= 60).length} />
        <Stat label="Open alerts" value={alerts.length >= 6 ? "6+" : alerts.length} sub="auto-generated" />
        <Stat label="Active rules" value={rules.filter((r) => r.enabled).length} sub={`of ${rules.length}`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Top 8 priority projects" className="lg:col-span-2">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500"><tr><th>Project</th><th>State</th><th>Risk</th><th>Main driver</th></tr></thead>
            <tbody>
              {list.slice(0, 8).map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-1.5"><Link className="font-medium text-indigo-700 hover:underline" href={`/projects/${p.id}`}>{p.id}</Link> <span className="text-xs text-slate-500">{p.name}</span></td>
                  <td>{p.state}</td><td><Badge band={p.band}>{p.score}</Badge></td><td className="text-xs">{LABELS[p.drivers[0].key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Latest automated alerts" right={<Link href="/automation" className="text-xs text-indigo-600">View all</Link>}>
          {alerts.length === 0 && <p className="text-sm text-slate-400">No alerts yet. Run the automation engine.</p>}
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-lg border p-2 text-xs">
                <span className={`mr-1 rounded px-1.5 py-0.5 font-semibold ${LEVEL_CLS[a.level]}`}>{a.level}</span>
                <Link href={`/projects/${a.project_id}`} className="font-semibold text-indigo-700">{a.project_id}</Link> · {a.score}%
                <p className="mt-1 text-slate-500">{a.rule_name}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Risk categorization">
          {dist.map((d) => <Bar key={d.b} label={d.b} value={d.n} max={list.length} suffix="" color={BAND_BG[d.b]} />)}
        </Card>
        <Card title="State-wise delay trend (avg risk)" className="lg:col-span-2">
          <div className="grid gap-x-6 md:grid-cols-2">
            {group(list, "state").map((a) => <Bar key={a.k} label={`${a.k} (${a.n})`} value={a.risk} />)}
          </div>
        </Card>
      </div>
    </>
  );
}
