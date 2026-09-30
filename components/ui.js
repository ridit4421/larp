export const BAND_BG = { Critical: "bg-red-600", High: "bg-orange-500", Medium: "bg-yellow-500", Low: "bg-green-500" };
export const LEVEL_CLS = { critical: "bg-red-100 text-red-700", warning: "bg-orange-100 text-orange-700", info: "bg-sky-100 text-sky-700" };

export const Card = ({ title, right, children, className = "" }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
    {(title || right) && (
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-600">{title}</h2>{right}
      </div>
    )}
    {children}
  </section>
);
export const Stat = ({ label, value, sub }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
    {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
  </div>
);
export const Badge = ({ band, children }) => (
  <span className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${BAND_BG[band] || "bg-slate-500"}`}>{children ?? band}</span>
);
export const Bar = ({ label, value, max = 100, color = "bg-indigo-500", suffix = "%" }) => (
  <div className="mb-2">
    <div className="flex justify-between text-xs"><span>{label}</span><span>{Math.round(value)}{suffix}</span></div>
    <div className="h-2 rounded bg-slate-100"><div className={`h-2 rounded ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} /></div>
  </div>
);
export const Impact = ({ label, v, max = 1.5 }) => {
  const w = Math.min(50, (Math.abs(v) / max) * 50);
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs"><span>{label}</span><span>{v > 0 ? "+" : ""}{v.toFixed(2)}</span></div>
      <div className="relative h-2 rounded bg-slate-100">
        <div className="absolute top-0 h-2 w-px bg-slate-400" style={{ left: "50%" }} />
        <div className={`absolute top-0 h-2 rounded ${v > 0 ? "bg-red-500" : "bg-green-500"}`} style={v > 0 ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }} />
      </div>
    </div>
  );
};
export const PageHead = ({ title, sub, children }) => (
  <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
    <div><h1 className="text-2xl font-bold">{title}</h1>{sub && <p className="text-sm text-slate-500">{sub}</p>}</div>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);
export const Btn = ({ children, className = "", ...p }) => (
  <button {...p} className={`rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 ${className}`}>{children}</button>
);
export const Loading = () => <p className="p-8 text-slate-500">Loading...</p>;
