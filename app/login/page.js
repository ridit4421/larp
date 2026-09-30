"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [signup, setSignup] = useState(false), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!supabase) return setMsg("Supabase keys missing. Fill .env.local and restart.");
    setBusy(true); setMsg("");
    const res = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (res.error) return setMsg(res.error.message);
    if (signup && !res.data.session) return setMsg("Account created. Check your email to confirm, then log in.");
    r.replace("/dashboard");
  }
  const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow-xl">
        <div>
          <h1 className="text-xl font-bold">LARP</h1>
          <p className="text-xs text-slate-500">Smart land acquisition delay prediction and automation</p>
        </div>
        <input className={inp} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={inp} type="password" required minLength={6} placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Please wait..." : signup ? "Create account" : "Login"}
        </button>
        <button type="button" onClick={() => { setSignup(!signup); setMsg(""); }} className="w-full text-xs text-indigo-600 underline">
          {signup ? "Already have an account? Login" : "New user? Create account"}
        </button>
        {msg && <p className="text-xs text-red-600">{msg}</p>}
        {!supabase && <p className="text-xs text-amber-600">Supabase keys not configured.</p>}
        <p className="text-[11px] text-slate-400">New accounts start as Viewer. An admin upgrades roles.</p>
      </form>
    </main>
  );
}
