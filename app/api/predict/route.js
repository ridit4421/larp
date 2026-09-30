import { NextResponse } from "next/server";
import { authed, getState } from "@/lib/server";
import { predict } from "@/lib/model";

export async function POST(req) {
  const a = await authed(req);
  if (a.error) return a.error;
  const { id, overrides } = await req.json();
  const s = await getState(a.db);
  const p = s.projects.find((x) => x.id === id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(predict(s.model, { ...p, ...overrides }));
}
