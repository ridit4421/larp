import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { historicalCases, ongoingProjects, LABELS } from "./data";
import { train, predict } from "./model";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

export const dbFor = (token) => createClient(URL, KEY, { ...opts, global: { headers: { Authorization: `Bearer ${token}` } } });
export const serviceDb = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY, opts) : null;

export async function authed(req, roles) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const deny = (s, m) => ({ error: NextResponse.json({ error: m }, { status: s }) });
  if (!token || !URL || !KEY) return deny(401, "Unauthorized");
  const db = dbFor(token);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) return deny(401, "Unauthorized");
  const { data: prof } = await db.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const user = { id: data.user.id, email: data.user.email, role: prof?.role || "viewer" };
  if (roles && !roles.includes(user.role)) return deny(403, `Requires role: ${roles.join(" or ")}`);
  return { db, user };
}

export async function audit(db, actor, action, detail = "") {
  try { await db.from("audit_logs").insert({ actor, action, detail }); } catch {}
}

const g = globalThis;
export async function getState(db) {
  const s = (g.__larp2 ||= { projects: ongoingProjects(), model: null, version: 1, history: null, loadedAt: 0 });
  if (s.model && Date.now() - s.loadedAt < 30000) return s;
  const { data: rows } = await db.from("model_versions").select("*").order("version");
  let history = historicalCases(800, 42);
  (rows || []).forEach((r) => { if (r.batch_size > 0) history = history.concat(historicalCases(r.batch_size, r.batch_seed, r.drift)); });
  s.history = history;
  const last = rows?.[rows.length - 1];
  if (last) { s.model = last.weights; s.version = last.version; }
  else if (!s.model) { s.model = train(history); s.version = 1; }
  s.loadedAt = Date.now();
  return s;
}
export const scoreAll = (s) => s.projects.map((p) => ({ ...p, ...predict(s.model, p) }));

export const RECS = {
  approvalDelay: "Escalate pending approvals; set a 15-day single-window clearance deadline.",
  legal: "Set up a special legal cell / Lok Adalat sittings; pursue out-of-court settlement.",
  compPaid: "Release compensation in tranches immediately; hold disbursement camps in the village.",
  docGap: "Run a mission-mode drive to complete land records, mutation entries and survey documents.",
  rr: "Fast-track R&R plots and livelihood packages; appoint a dedicated R&R officer.",
  possession: "Take phased possession of unencumbered parcels first while disputed ones are resolved.",
  resp: "Hold weekly inter-departmental review; fix nodal officers with an escalation matrix.",
  hist: "Assign senior officer oversight; this district/agency has repeated delays.",
  families: "Run extra grievance hearings and community consultations for affected families.",
  areaHa: "Split the project into smaller packages and acquire/hand over parcels in phases.",
};

const TRIG = {
  score_gte: (p, t) => p.score >= t,
  legal_gte: (p, t) => p.legal >= t,
  approval_gte: (p, t) => p.approvalDelay >= t,
  comp_lte: (p, t) => p.compPaid <= t,
};

export async function runEngine(db, s, actor) {
  const { data: rules } = await db.from("automation_rules").select("*").eq("enabled", true);
  const { data: open } = await db.from("alerts").select("project_id,rule_id").neq("status", "resolved");
  const seen = new Set((open || []).map((a) => `${a.project_id}:${a.rule_id}`));
  const scored = scoreAll(s), rows = [];
  for (const r of rules || []) {
    const f = TRIG[r.trigger];
    for (const p of scored) {
      if (!f || !f(p, r.threshold) || seen.has(`${p.id}:${r.id}`)) continue;
      const top = p.drivers[0].key;
      rows.push({
        project_id: p.id, project_name: p.name, rule_id: r.id, rule_name: r.name, level: r.level,
        score: p.score, driver: LABELS[top], recommendation: `${r.action}. ${RECS[top]}`,
      });
    }
  }
  const batch = rows.slice(0, 30);
  if (batch.length) await db.from("alerts").insert(batch);
  await audit(db, actor, "AUTO_RUN", `${(rules || []).length} rules, ${batch.length} new alerts`);
  return { rules: (rules || []).length, created: batch.length, pending: rows.length - batch.length };
}
