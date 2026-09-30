"use client";
import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

const COLOR = { Critical: "#dc2626", High: "#f97316", Medium: "#eab308", Low: "#22c55e", state: "#4338ca", district: "#64748b" };

export default function GraphView({ projects, mode, onSelect, height = 480 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!projects.length) return;
    const els = [];
    if (mode === "geo") {
      const lats = projects.map((p) => p.lat), lngs = projects.map((p) => p.lng);
      const [minLa, maxLa, minLn, maxLn] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
      projects.forEach((p) => els.push({
        data: { id: p.id, label: p.id, band: p.band, size: 12 + p.score / 6 },
        position: { x: ((p.lng - minLn) / (maxLn - minLn || 1)) * 800, y: (1 - (p.lat - minLa) / (maxLa - minLa || 1)) * 460 },
      }));
    } else {
      const seen = new Set();
      projects.forEach((p) => {
        const s = "S:" + p.state, d = "D:" + p.district;
        if (!seen.has(s)) { seen.add(s); els.push({ data: { id: s, label: p.state, band: "state", size: 34 } }); }
        if (!seen.has(d)) {
          seen.add(d);
          els.push({ data: { id: d, label: p.district, band: "district", size: 22 } });
          els.push({ data: { source: s, target: d } });
        }
        els.push({ data: { id: p.id, label: "", band: p.band, size: 10 + p.score / 8 } });
        els.push({ data: { source: d, target: p.id } });
      });
    }
    const cy = cytoscape({
      container: ref.current, elements: els,
      layout: mode === "geo" ? { name: "preset", padding: 30 } : { name: "cose", animate: false, padding: 20 },
      style: [
        { selector: "node", style: { width: "data(size)", height: "data(size)", "background-color": (n) => COLOR[n.data("band")] || "#64748b", label: "data(label)", "font-size": 8, color: "#334155", "text-valign": "bottom", "text-margin-y": 3 } },
        { selector: "edge", style: { width: 1, "line-color": "#cbd5e1" } },
      ],
    });
    cy.on("tap", "node", (e) => { const p = projects.find((x) => x.id === e.target.id()); if (p) onSelect(p); });
    return () => cy.destroy();
  }, [projects, mode]);
  return <div ref={ref} style={{ height }} className="w-full rounded-xl border bg-white" />;
}
