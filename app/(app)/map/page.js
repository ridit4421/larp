"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useApp } from "@/components/AppShell";
import { Card, Badge, PageHead, Loading, BAND_BG } from "@/components/ui";

const GraphView = dynamic(() => import("@/components/GraphView"), { ssr: false });

export default function MapPage() {
  const { data } = useApp();
  const [mode, setMode] = useState("geo"), [min, setMin] = useState(0), [sel, setSel] = useState(null);
  const list = useMemo(() => (data ? data.projects.filter((p) => p.score >= min) : []), [data, min]);
  if (!data) return <Loading />;
  return (
    <>
      <PageHead title="Risk Map" sub="GIS-style view of projects (node size and colour = delay risk)" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={`${list.length} projects shown`} right={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[["geo", "Map"], ["net", "State > District > Project"]].map(([m, l]) => (
              <button key={m} onClick={() => setMode(m)} className={`rounded-full px-3 py-1 ${mode === m ? "bg-indigo-600 text-white" : "bg-slate-100"}`}>{l}</button>
            ))}
            <label className="flex items-center gap-1">Min risk <input type="range" min={0} max={90} step={10} value={min} onChange={(e) => setMin(+e.target.value)} /> {min}</label>
          </div>}>
          <GraphView projects={list} mode={mode} onSelect={setSel} />
          <div className="mt-2 flex gap-3 text-xs">{Object.entries(BAND_BG).map(([b, c]) => <span key={b} className="flex items-center gap-1"><i className={`h-2 w-2 rounded-full ${c}`} />{b}</span>)}</div>
        </Card>
        <Card title="Selected project">
          {!sel ? <p className="text-sm text-slate-400">Click a node on the map.</p> : (
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{sel.id} · {sel.name}</p>
              <p className="text-slate-500">{sel.district}, {sel.state}</p>
              <p><Badge band={sel.band}>{sel.score}</Badge> {sel.band} risk</p>
              <Link className="text-indigo-600 underline" href={`/projects/${sel.id}`}>Open details</Link>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
