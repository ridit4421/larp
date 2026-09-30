"use client";
import { useApp } from "@/components/AppShell";
import { Card, Bar, PageHead, Loading } from "@/components/ui";
import { group } from "@/lib/util";
import { LABELS, FEATURES } from "@/lib/data";

function Table({ rows, title }) {
  return (
    <Card title={title}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500"><tr><th>Name</th><th>Projects</th><th>Avg risk</th><th>High+</th><th>Avg approval delay</th><th>Avg comp paid</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.k} className="border-t"><td className="py-1">{r.k}</td><td>{r.n}</td>
              <td><div className="flex items-center gap-1"><div className="h-1.5 w-16 rounded bg-slate-100"><div className="h-1.5 rounded bg-indigo-500" style={{ width: `${r.risk}%` }} /></div>{Math.round(r.risk)}</div></td>
              <td>{r.high}</td><td>{Math.round(r.delay)} d</td><td>{Math.round(r.comp)}%</td></tr>))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function Analytics() {
  const { data } = useApp();
  if (!data) return <Loading />;
  const list = data.projects;
  const freq = FEATURES.map((k) => ({ k, n: list.filter((p) => p.drivers[0].key === k).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  return (
    <>
      <PageHead title="Analytics" sub="District, state and project-type comparisons" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Table title="State-wise comparison" rows={group(list, "state")} />
        <Table title="Project-type comparison" rows={group(list, "type")} />
        <Table title="District-wise comparison" rows={group(list, "district")} />
        <Card title="Which delay driver hits most projects? (top driver count)">
          {freq.map((f) => <Bar key={f.k} label={LABELS[f.k]} value={f.n} max={list.length} suffix=" projects" color="bg-orange-500" />)}
        </Card>
      </div>
    </>
  );
}
