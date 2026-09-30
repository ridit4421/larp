"use client";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Card, PageHead } from "@/components/ui";

export default function Admin() {
  const { profile } = useApp();
  const [users, setUsers] = useState([]), [logs, setLogs] = useState([]), [msg, setMsg] = useState("");
  const load = () => {
    supabase.from("profiles").select("*").order("created_at").then(({ data }) => setUsers(data || []));
    supabase.from("audit_logs").select("*").order("at", { ascending: false }).limit(100).then(({ data }) => setLogs(data || []));
  };
  useEffect(() => { if (profile.role !== "viewer") load(); }, []);
  if (profile.role === "viewer") return <p className="p-6 text-slate-500">Admins and officers only.</p>;

  async function setRole(u, role) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", u.id);
    setMsg(error ? error.message : `${u.email} is now ${role}`); load();
  }
  return (
    <>
      <PageHead title="Admin" sub="Role-based access control and audit trail" />
      {msg && <p className="mb-3 rounded-lg bg-indigo-50 p-2 text-sm text-indigo-800">{msg}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Users and roles">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500"><tr><th>Email</th><th>Role</th></tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id} className="border-t"><td className="py-1.5">{u.email}</td>
                <td><select disabled={profile.role !== "admin"} value={u.role} onChange={(e) => setRole(u, e.target.value)} className="rounded border px-1 py-0.5 text-xs">
                  <option>admin</option><option>officer</option><option>viewer</option></select></td></tr>
            ))}</tbody>
          </table>
          {users.length <= 1 && profile.role !== "admin" && <p className="mt-2 text-xs text-slate-400">Only admins see all users.</p>}
        </Card>
        <Card title="Audit trail (latest 100)">
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500"><tr><th>Time</th><th>Actor</th><th>Action</th><th>Detail</th></tr></thead>
              <tbody>{logs.map((l) => <tr key={l.id} className="border-t"><td className="py-1">{new Date(l.at).toLocaleString()}</td><td>{l.actor}</td><td>{l.action}</td><td>{l.detail}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
