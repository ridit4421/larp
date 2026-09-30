const avg = (v, f) => v.reduce((a, p) => a + p[f], 0) / (v.length || 1);
export function group(list, key) {
  const m = {};
  list.forEach((p) => { (m[p[key]] ||= []).push(p); });
  return Object.entries(m).map(([k, v]) => ({
    k, n: v.length, risk: avg(v, "score"), delay: avg(v, "approvalDelay"),
    comp: avg(v, "compPaid"), high: v.filter((p) => p.score >= 60).length,
  })).sort((a, b) => b.risk - a.risk);
}
