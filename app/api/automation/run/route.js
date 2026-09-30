import { NextResponse } from "next/server";
import { authed, getState, runEngine } from "@/lib/server";

export async function POST(req) {
  const a = await authed(req, ["admin", "officer"]);
  if (a.error) return a.error;
  const s = await getState(a.db);
  return NextResponse.json(await runEngine(a.db, s, a.user.email));
}
