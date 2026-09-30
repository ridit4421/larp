import { NextResponse } from "next/server";
import { authed, getState, audit } from "@/lib/server";
import { train } from "@/lib/model";
import { historicalCases } from "@/lib/data";

export async function POST(req) {
  const a = await authed(req, ["admin"]);
  if (a.error) return a.error;
  const s = await getState(a.db);
  const before = s.model.accuracy;
  const seed = Math.floor(Math.random() * 1e6), size = 150, drift = 0.3;
  const history = s.history.concat(historicalCases(size, seed, drift));
  const model = train(history);
  const version = s.version + 1;
  const { error } = await a.db.from("model_versions").insert({
    version, accuracy: model.accuracy, trained_on: model.trainedOn, weights: model,
    batch_seed: seed, batch_size: size, drift, created_by: a.user.email,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  Object.assign(s, { history, model, version, loadedAt: Date.now() });
  await audit(a.db, a.user.email, "RETRAIN", `v${version}, +${size} closed cases`);
  return NextResponse.json({ version, before, after: model.accuracy, trainedOn: model.trainedOn });
}
