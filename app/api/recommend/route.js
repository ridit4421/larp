import { NextResponse } from "next/server";
import { authed, getState, audit, RECS } from "@/lib/server";
import { predict } from "@/lib/model";
import { LABELS } from "@/lib/data";

export async function POST(req) {
  const a = await authed(req);
  if (a.error) return a.error;
  const { id } = await req.json();
  const s = await getState(a.db);
  const base = s.projects.find((x) => x.id === id);
  if (!base) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const p = { ...base, ...predict(s.model, base) };
  const top = p.drivers.slice(0, 3).map((d) => d.key);
  const fallback = top.map((k) => RECS[k]);
  await audit(a.db, a.user.email, "RECOMMEND", id);

  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ source: "rules", items: fallback });
  const prompt = `You are an advisor for Indian land acquisition (LARR Act 2013). Project: ${p.name}, ${p.district}, ${p.state}.
Predicted delay probability: ${p.score}%. Top drivers: ${top.map((k) => `${LABELS[k]}=${p[k]}`).join("; ")}.
Give exactly 4 short, concrete corrective actions (max 25 words each) as a JSON array of strings. No other text.`;
  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
    });
    const json = await res.json();
    const items = JSON.parse(json.candidates[0].content.parts[0].text);
    return NextResponse.json({ source: "gemini", items });
  } catch {
    return NextResponse.json({ source: "rules", items: fallback });
  }
}
