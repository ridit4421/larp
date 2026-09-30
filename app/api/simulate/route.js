import { NextResponse } from "next/server";
import { authed, getState, audit } from "@/lib/server";

export async function POST(req) {
  const a = await authed(req, ["admin", "officer"]);
  if (a.error) return a.error;
  const s = await getState(a.db);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const changes = [];
  for (let i = 0; i < 6; i++) {
    const p = s.projects[Math.floor(Math.random() * s.projects.length)];
    const k = Math.floor(Math.random() * 4);
    if (k === 0) { p.approvalDelay = clamp(p.approvalDelay + 20 + Math.floor(Math.random() * 60), 0, 500); changes.push(`${p.id}: approval delay up`); }
    else if (k === 1) { p.legal = clamp(p.legal + 1, 0, 6); changes.push(`${p.id}: new legal dispute`); }
    else if (k === 2) { p.compPaid = clamp(p.compPaid + 15, 0, 100); changes.push(`${p.id}: compensation released`); }
    else { p.docGap = clamp(p.docGap + 10, 0, 100); changes.push(`${p.id}: documentation gap widened`); }
  }
  await audit(a.db, a.user.email, "INGEST_UPDATE", `${changes.length} simulated field updates`);
  return NextResponse.json({ changes });
}
