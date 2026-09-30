"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppShell";
import { Card, Badge, PageHead, Loading } from "@/components/ui";
import { LABELS, TYPES } from "@/lib/data";

export default function Projects() {
  const { data } = useApp();
  const [q, setQ] = useState(""), [state, setState] = useState("All"), [type, setType] = useState("All"), [band, setBand] = useState("All");
  const states = useMemo(() => (data ? [...new Set(data.projects.map((p) => p.state))] : []), [data]);
  const list = useMemo(() => (data ? data.projects.filter((p) =>
    (state === "All" || p.state === state) && (type === "All" || p.type === type) && (band === "All" || p.band === band) &&
    (p.name + p.id + p.district).toLowerCase().includes(q.toLowerCase())) : []), [data, q, state, type, band]);
  if (!data) return <Loading />;
  const sel = "rounded-lg border px-2 py-1.5 text-sm";
  return (
    <>
      <PageHead title="Projects" sub={`${list.length} of ${data.projects.length} projects, sorted by delay risk`} />
      <Card className="mb-4">
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search id, name, district" className={`${sel} w-56`} />
          <select className={sel} value={state} onChange={(e) => setState(e.target.value)}><option>All</option>{states.map((s) => <option key={s}>{s}</option>)}</select>
          <select className={sel} value={type} onChange={(e) => setType(e.target.value)}><option>All</option>{TYPES.map((s) => <option key={s}>{s}</option>)}</select>
          <select className={sel} value={band} onChange={(e) => setBand(e.target.value)}><option>All</option>{["Critical", "High", "Medium", "Low"].map((s) => <option key={s}>{s}</option>)}</select>
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500"><tr><th>ID</th><th>Project</th><th>Type</th><th>District</th><th>Risk</th><th>Compensation</th><th>Approval delay</th><th>Top driver</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="py-1.5"><Link className="font-medium text-indigo-700" href={`/projects/${p.id}`}>{p.id}</Link></td>
                  <td>{p.name}</td><td>{p.type}</td><td>{p.district}, {p.state}</td>
                  <td><Badge band={p.band}>{p.score}</Badge></td>
                  <td>{p.compPaid}%</td><td>{p.approvalDelay} d</td><td className="text-xs">{LABELS[p.drivers[0].key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
