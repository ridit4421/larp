export const FEATURES = [
  "areaHa", "families", "compPaid", "approvalDelay", "legal",
  "possession", "rr", "resp", "hist", "docGap",
];
export const LABELS = {
  areaHa: "Land area", families: "Affected families", compPaid: "Compensation paid %",
  approvalDelay: "Approval delay (days)", legal: "Legal disputes", possession: "Possession %",
  rr: "R&R progress %", resp: "Stakeholder responsiveness", hist: "Historical delay rate",
  docGap: "Documentation gap %",
};
export const TYPES = ["Highway", "Railway", "Metro", "Irrigation", "Industrial Corridor", "Transmission Line"];
export const PLACES = {
  "Uttar Pradesh": [["Meerut", 28.98, 77.7], ["Lucknow", 26.85, 80.95], ["Varanasi", 25.32, 83.0], ["Gorakhpur", 26.76, 83.37]],
  Maharashtra: [["Pune", 18.52, 73.86], ["Nagpur", 21.15, 79.09], ["Nashik", 20.0, 73.79]],
  Gujarat: [["Surat", 21.17, 72.83], ["Vadodara", 22.31, 73.18], ["Rajkot", 22.3, 70.8]],
  Karnataka: [["Bengaluru Rural", 13.1, 77.6], ["Mysuru", 12.3, 76.65], ["Belagavi", 15.85, 74.5]],
  Bihar: [["Patna", 25.6, 85.14], ["Gaya", 24.8, 85.0]],
  "Tamil Nadu": [["Coimbatore", 11.0, 76.96], ["Madurai", 9.92, 78.12]],
};

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r) => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());

export function randomFeatures(r) {
  const areaHa = Math.round(2 + Math.pow(r(), 2.5) * 600);
  return {
    areaHa,
    families: Math.round(areaHa * (0.3 + r() * 2.5)),
    compPaid: Math.round(r() * 100),
    approvalDelay: Math.round(Math.pow(r(), 1.3) * 400),
    legal: Math.min(6, Math.floor(-Math.log(1 - r() * 0.97) * 1.8)),
    possession: Math.round(r() * 100),
    rr: Math.round(r() * 100),
    resp: +(0.15 + r() * 0.85).toFixed(2),
    hist: +(0.05 + r() * 0.85).toFixed(2),
    docGap: Math.round(r() * 80),
  };
}

export function trueLogit(f, drift = 0) {
  return -7.6 + drift + 0.008 * f.approvalDelay + 0.55 * f.legal + 0.015 * (100 - f.compPaid)
    + 0.008 * (100 - f.possession) + 0.01 * (100 - f.rr) + 1.5 * (1 - f.resp)
    + 1.8 * f.hist + 0.015 * f.docGap + 0.15 * Math.log(f.families + 1);
}

export function historicalCases(n, seed, drift = 0) {
  const r = rng(seed);
  return Array.from({ length: n }, () => {
    const f = randomFeatures(r);
    const p = 1 / (1 + Math.exp(-(trueLogit(f, drift) + gauss(r) * 0.5)));
    return { ...f, delayed: r() < p ? 1 : 0 };
  });
}

export function ongoingProjects(n = 48, seed = 7) {
  const r = rng(seed);
  const states = Object.keys(PLACES);
  return Array.from({ length: n }, (_, i) => {
    const state = states[Math.floor(r() * states.length)];
    const [district, lat, lng] = PLACES[state][Math.floor(r() * PLACES[state].length)];
    const type = TYPES[Math.floor(r() * TYPES.length)];
    return {
      id: `LA-${1001 + i}`,
      name: `${district} ${type} Package ${1 + Math.floor(r() * 6)}`,
      type, state, district,
      lat: lat + (r() - 0.5) * 0.6, lng: lng + (r() - 0.5) * 0.6,
      ...randomFeatures(r),
    };
  });
}
