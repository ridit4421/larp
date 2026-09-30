"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loading } from "./ui";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const NAV = [
  ["/dashboard", "Dashboard"], ["/projects", "Projects"], ["/map", "Risk Map"],
  ["/analytics", "Analytics"], ["/automation", "Automation"], ["/model", "AI Model"], ["/admin", "Admin"],
];

function Setup() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-2 text-2xl font-bold">Setup required</h1>
      <p className="mb-4 text-sm text-slate-600">Supabase keys are missing. Create <code>.env.local</code> from <code>.env.example</code>, fill in the project URL and publishable key, then restart <code>npm run dev</code>.</p>
      <p className="text-sm text-slate-600">Also run <code>supabase/schema.sql</code> in the Supabase SQL editor. See README.md for all steps.</p>
    </main>
  );
}

export default function AppShell({ children }) {
  const router = useRouter(), path = usePathname();
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => l.subscription.unsubscribe();
  }, []);

  const api = useCallback(async (url, opts = {}) => {
    const res = await fetch(url, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
    });
    return res.json();
  }, [session]);

  const reload = useCallback(async () => {
    const d = await api("/api/projects");
    if (d.projects) setData(d);
    return d;
  }, [api]);

  useEffect(() => {
    if (session === null) router.replace("/login");
    if (session) {
      supabase.from("profiles").select("role,email").eq("id", session.user.id).maybeSingle()
        .then(({ data }) => setProfile(data || { role: "viewer", email: session.user.email }));
      reload();
    }
  }, [session]);

  if (!supabase) return <Setup />;
  if (!session || !profile) return <Loading />;

  return (
    <Ctx.Provider value={{ session, profile, api, data, reload }}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="bg-slate-900 p-3 text-slate-200 md:w-56 md:shrink-0">
          <div className="mb-3 px-2">
            <p className="text-lg font-bold text-white">LARP</p>
            <p className="text-[11px] text-slate-400">Smart land acquisition automation</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${path.startsWith(href) ? "bg-indigo-600 text-white" : "hover:bg-slate-800"}`}>{label}</Link>
            ))}
          </nav>
          <div className="mt-4 hidden border-t border-slate-700 px-2 pt-3 text-xs md:block">
            <p className="truncate">{profile.email}</p>
            <p className="mb-2 uppercase text-indigo-300">{profile.role}</p>
            <button onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }} className="text-slate-400 underline">Logout</button>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </Ctx.Provider>
  );
}
