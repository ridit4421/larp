import { NextResponse } from "next/server";
import { authed, getState, scoreAll } from "@/lib/server";
import { FEATURES } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const a = await authed(req);
  if (a.error) return a.error;
  const s = await getState(a.db);
  const projects = scoreAll(s).sort((x, y) => y.score - x.score);
  return NextResponse.json({
    user: a.user, projects,
    model: {
      version: s.version, accuracy: s.model.accuracy, trainedOn: s.model.trainedOn,
      weights: FEATURES.map((k, i) => ({ key: k, weight: s.model.w[i] })),
    },
  });
}
