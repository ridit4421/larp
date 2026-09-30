import { NextResponse } from "next/server";
import { serviceDb, getState, runEngine } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 500 });
  const s = await getState(db);
  return NextResponse.json(await runEngine(db, s, "automation-bot (cron)"));
}
