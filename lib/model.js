import { FEATURES } from "./data";

const tf = (k, v) => (k === "areaHa" || k === "families" ? Math.log(1 + v) : v);
const sig = (x) => 1 / (1 + Math.exp(-x));

export const STAGES = {
  "Notification & Survey": ["areaHa", "families", "docGap"],
  Approvals: ["approvalDelay", "hist", "resp"],
  "Compensation / Award": ["compPaid", "legal"],
  Possession: ["possession", "legal", "resp"],
  "R&R": ["rr", "families"],
};

export function train(rows, epochs = 500, lr = 0.15) {
  const split = Math.floor(rows.length * 0.8);
  const tr = rows.slice(0, split), te = rows.slice(split);
  const mean = {}, std = {};
  for (const k of FEATURES) {
    const v = tr.map((r) => tf(k, r[k]));
    mean[k] = v.reduce((a, b) => a + b, 0) / v.length;
    std[k] = Math.sqrt(v.reduce((a, b) => a + (b - mean[k]) ** 2, 0) / v.length) || 1;
  }
  const z = (r) => FEATURES.map((k) => (tf(k, r[k]) - mean[k]) / std[k]);
  const X = tr.map(z), y = tr.map((r) => r.delayed);
  let w = FEATURES.map(() => 0), b = 0;
  for (let e = 0; e < epochs; e++) {
    const gw = w.map(() => 0); let gb = 0;
    X.forEach((x, i) => {
      const err = sig(b + x.reduce((s, xi, j) => s + xi * w[j], 0)) - y[i];
      x.forEach((xi, j) => (gw[j] += err * xi)); gb += err;
    });
    w = w.map((wj, j) => wj - lr * (gw[j] / X.length + 0.001 * wj));
    b -= lr * (gb / X.length);
  }
  const model = { w, b, mean, std };
  let correct = 0;
  te.forEach((r) => { if ((predict(model, r).prob >= 0.5 ? 1 : 0) === r.delayed) correct++; });
  model.accuracy = te.length ? correct / te.length : null;
  model.trainedOn = rows.length;
  return model;
}

export function predict(m, row) {
  const contrib = {};
  let logit = m.b;
  FEATURES.forEach((k, j) => {
    const c = m.w[j] * ((tf(k, row[k]) - m.mean[k]) / m.std[k]);
    contrib[k] = c; logit += c;
  });
  const stages = {};
  for (const [s, ks] of Object.entries(STAGES)) {
    stages[s] = sig(m.b + ks.reduce((a, k) => a + contrib[k], 0) * (FEATURES.length / ks.length) * 0.6);
  }
  const prob = sig(logit);
  const score = Math.round(prob * 100);
  const band = score >= 80 ? "Critical" : score >= 60 ? "High" : score >= 35 ? "Medium" : "Low";
  const drivers = Object.entries(contrib)
    .map(([k, v]) => ({ key: k, impact: v }))
    .sort((a, b) => b.impact - a.impact);
  return { prob, score, band, stages, drivers };
}
