"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { LiveTicket, LiveUser } from "@/lib/live/types";

type ApiError = { error?: string };
type Guidance = {
  recommendation?: {
    id?: string;
    status?: string;
    recommendation_text?: string;
    citations?: Array<{ source_locator?: string; similarity?: number }>;
  };
  matches?: Array<{ section?: string; source_locator?: string; chunk_text?: string; similarity?: number }>;
};

type KbDoc = {
  id: string;
  title: string;
  source_reference: string;
  approval_status: string;
  version: string | null;
};

type AuditRow = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as ApiError).error || `HTTP ${res.status}`);
  return body as T;
}

export default function LiveApp() {
  const [user, setUser] = useState<LiveUser | null>(null);
  const [tickets, setTickets] = useState<LiveTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<Record<string, Guidance>>({});
  const [kb, setKb] = useState<KbDoc[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subject, setSubject] = useState("VPN login fails after password change");
  const [description, setDescription] = useState("Windows 11 user gets authentication failed since password changed today. Error says invalid credentials.");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const selected = useMemo(() => tickets.find((t) => t.id === selectedId) || tickets[0] || null, [tickets, selectedId]);

  const refresh = useCallback(async () => {
    const session = await api<{ authenticated: boolean; user: LiveUser | null }>("/api/session");
    setUser(session.user);
    if (!session.authenticated || !session.user) return;
    const ticketData = await api<{ tickets: LiveTicket[] }>("/api/tickets");
    setTickets(ticketData.tickets);
    if (!selectedId && ticketData.tickets[0]) setSelectedId(ticketData.tickets[0].id);
    const kbData = await api<{ documents: KbDoc[] }>("/api/kb").catch(() => ({ documents: [] as KbDoc[] }));
    setKb(kbData.documents);
    if (session.user.role === "service_manager") {
      const auditData = await api<{ logs: AuditRow[] }>("/api/audit").catch(() => ({ logs: [] as AuditRow[] }));
      setAudit(auditData.logs);
    }
  }, [selectedId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh().catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function run(label: string, action: () => Promise<void>) {
    setBusy(label); setMessage("");
    try { await action(); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Action failed."); }
    finally { setBusy(""); }
  }

  async function login(e: FormEvent) {
    e.preventDefault();
    await run("login", async () => {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setPassword("");
    });
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null); setTickets([]); setKb([]); setAudit([]); setGuidance({});
  }

  async function submitTicket(e: FormEvent) {
    e.preventDefault();
    await run("submit", async () => {
      const result = await api<{ ticket: LiveTicket }>("/api/tickets", {
        method: "POST", body: JSON.stringify({ subject, description }),
      });
      setSelectedId(result.ticket.id);
      setMessage("Ticket submitted and triaged.");
    });
  }

  async function dispatch(ticket: LiveTicket) {
    await run("dispatch", async () => {
      await api(`/api/tickets/${ticket.id}/dispatch`, {
        method: "POST",
        body: JSON.stringify({ queue: ticket.queue || "L1_GENERAL" }),
      });
    });
  }

  async function getGuidance(ticket: LiveTicket) {
    await run("guidance", async () => {
      const result = await api<Guidance>(`/api/tickets/${ticket.id}/guidance`, { method: "POST" });
      setGuidance((current) => ({ ...current, [ticket.id]: result }));
    });
  }

  async function decide(ticket: LiveTicket, decision: "resolve" | "escalate") {
    await run(decision, async () => {
      await api(`/api/tickets/${ticket.id}/decision`, {
        method: "POST", body: JSON.stringify({ decision }),
      });
    });
  }

  async function reindex() {
    await run("reindex", async () => {
      const result = await api<{ indexed: number; previews: Array<{ id: string; first: number }> }>("/api/kb/reindex", { method: "POST" });
      const unique = new Set(result.previews.map((p) => p.first.toFixed(8))).size;
      setMessage(`Reindexed ${result.indexed} chunks. Distinct first-vector values: ${unique}.`);
    });
  }

  if (!user) {
    return (
      <main><div className="mx-auto max-w-6xl">
        <section className="rounded-2xl border bg-white p-6 shadow-sm" style={{ maxWidth: 520, margin: "80px auto" }}>
          <p className="text-sm font-semibold text-teal-700">Armans.AI · LIVE V1</p>
          <h1 className="mt-1 text-3xl font-bold">MSP Service Desk Intelligence Layer</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in with the Supabase Auth user created for this project.</p>
          <form onSubmit={login}>
            <label className="mt-4 block text-sm font-semibold">Email</label>
            <input className="mt-1 w-full rounded-lg px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            <label className="mt-3 block text-sm font-semibold">Password</label>
            <input className="mt-1 w-full rounded-lg px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            <button className="mt-4 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" disabled={busy === "login"}>Sign in</button>
          </form>
          {message && <p className="mt-3 text-sm" style={{ color: "#b91c1c" }}>{message}</p>}
        </section>
      </div></main>
    );
  }

  const g = selected ? guidance[selected.id] : undefined;
  return (
    <main><div className="mx-auto max-w-6xl space-y-5">
      <header className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-teal-700">Armans.AI · LIVE V1</p>
            <h1 className="mt-1 text-3xl font-bold">MSP Service Desk Intelligence Layer</h1>
            <p className="mt-2 text-sm text-slate-600">{user.full_name} · {user.role} · tenant {user.organization_id.slice(0, 8)}…</p>
          </div>
          <button onClick={logout} className="rounded-lg border px-4 py-2 text-sm font-semibold">Sign out</button>
        </div>
        {message && <p className="mt-3 text-sm">{message}</p>}
      </header>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">1. Ticket intake + real AI triage</h2>
          <form onSubmit={submitTicket}>
            <label className="mt-3 block text-sm font-semibold">Subject</label>
            <input className="mt-1 w-full rounded-lg px-3 py-2" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <label className="mt-3 block text-sm font-semibold">Description</label>
            <textarea className="mt-1 w-full rounded-lg px-3 py-2" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            <button className="mt-4 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" disabled={Boolean(busy)}>Submit + triage</button>
          </form>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">2. Ticket queue</h2>
          <div className="mt-3 space-y-2">
            {tickets.length === 0 && <p className="text-sm text-slate-500">No tickets yet.</p>}
            {tickets.map((t) => (
              <button key={t.id} onClick={() => setSelectedId(t.id)}
                className="w-full rounded-lg border p-3" style={{ textAlign: "left", background: selected?.id === t.id ? "#ecfdf5" : "#fff" }}>
                <strong>{t.subject}</strong>
                <div className="text-xs text-slate-600">{t.status} · {t.priority || "—"} · {t.category || "unclassified"} · {t.queue || "unrouted"}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selected && (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">3. Dispatcher + technician workbench</h2>
            <p className="mt-2"><strong>{selected.subject}</strong></p>
            <p className="mt-2 text-sm text-slate-600">{selected.description}</p>
            <div className="mt-3 text-sm"><strong>Status:</strong> {selected.status} · <strong>Queue:</strong> {selected.queue || "—"}</div>
            <div className="mt-4 flex gap-2">
              {selected.status === "dispatcher_review" && <button onClick={() => dispatch(selected)} className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Approve routing + assign</button>}
              {selected.status === "assigned" && <button onClick={() => getGuidance(selected)} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Retrieve approved guidance</button>}
              {selected.status === "in_progress" && <>
                <button onClick={() => decide(selected, "resolve")} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">Resolve</button>
                <button onClick={() => decide(selected, "escalate")} className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white">Escalate</button>
              </>}
            </div>
            {g?.recommendation && <div className="mt-4 rounded-xl border p-4" style={{ background: g.recommendation.status === "grounded" ? "#ecfdf5" : "#fef2f2" }}>
              <p className="font-semibold">{g.recommendation.status === "grounded" ? "Grounded recommendation" : "Safe abstention"}</p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{g.recommendation.recommendation_text}</pre>
              {(g.matches || []).map((m, i) => <p key={i} className="mt-2 text-xs text-slate-600">Source: {m.source_locator} · similarity {(m.similarity ?? 0).toFixed(3)}</p>)}
            </div>}
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">4. Approved knowledge + proof</h2>
            <p className="mt-2 text-sm text-slate-600">Only approved knowledge is eligible for retrieval.</p>
            {user.role === "service_manager" && <button onClick={reindex} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" disabled={Boolean(busy)}>Reindex approved KB</button>}
            <div className="mt-3 space-y-2">
              {kb.map((doc) => <div className="rounded-lg border p-3 text-sm" key={doc.id}><strong>{doc.title}</strong><div className="text-xs text-slate-600">{doc.source_reference} · {doc.approval_status} · v{doc.version || "—"}</div></div>)}
            </div>
          </div>
        </section>
      )}

      {user.role === "service_manager" && <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">5. Audit trail</h2>
        <div className="mt-3 space-y-2">
          {audit.slice(0, 20).map((row) => <div className="rounded-lg border p-3 text-sm" key={row.id}><strong>{row.action}</strong><div className="text-xs text-slate-600">{row.entity_type} · {new Date(row.created_at).toLocaleString()}</div></div>)}
          {audit.length === 0 && <p className="text-sm text-slate-500">No audit events yet.</p>}
        </div>
      </section>}

      <footer className="rounded-2xl border bg-white p-5 text-sm text-slate-600 shadow-sm">
        <strong>Safety:</strong> if approved evidence does not clear the retrieval threshold, the system returns exactly <code>NO_APPROVED_GUIDANCE</code>. No autonomous remediation.
      </footer>
    </div></main>
  );
}