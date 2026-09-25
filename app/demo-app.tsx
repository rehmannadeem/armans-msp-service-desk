"use client";

import { useEffect, useMemo, useState } from "react";
import { demoTriageAdapter } from "@/lib/llm/demoAdapter";
import { demoRetrievalAdapter } from "@/lib/retrieval/demoRetrieval";
import { composeRecommendation, type ComposedRecommendation } from "@/lib/domain/recommendation";
import { DEMO_KB, DEMO_ORG_ID } from "@/lib/demoData";
import type { Queue } from "@/lib/types";
import type { TriageOutput } from "@/lib/llm/adapter";

type Stage = "intake" | "dispatcher_review" | "assigned" | "in_progress" | "resolved" | "escalated";
type AuditItem = { at: string; actor: string; action: string };
type Ticket = { subject: string; description: string };

type DemoState = {
  ticket: Ticket;
  triage: TriageOutput | null;
  stage: Stage;
  queue: Queue | null;
  recommendation: ComposedRecommendation | null;
  audit: AuditItem[];
};

const INITIAL: DemoState = {
  ticket: { subject: "VPN login fails after password change", description: "Windows 11 user on Cisco AnyConnect gets authentication failed since password changed today. Error message says invalid credentials." },
  triage: null,
  stage: "intake",
  queue: null,
  recommendation: null,
  audit: [],
};

function now() { return new Date().toLocaleTimeString(); }
function log(actor: string, action: string): AuditItem { return { at: now(), actor, action }; }

export default function DemoApp() {
  const [state, setState] = useState<DemoState>(INITIAL);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("armans-msp-v1-demo");
    queueMicrotask(() => {
      if (saved) {
        try { setState(JSON.parse(saved) as DemoState); } catch { /* ignore corrupt demo state */ }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("armans-msp-v1-demo", JSON.stringify(state));
  }, [state, hydrated]);

  const currentStep = useMemo(() => ({ intake: 1, dispatcher_review: 2, assigned: 3, in_progress: 4, resolved: 5, escalated: 5 }[state.stage]), [state.stage]);

  function submitTicket() {
    const triage = demoTriageAdapter.triage(state.ticket);
    setState((s) => ({
      ...s,
      triage,
      stage: "dispatcher_review",
      queue: triage.suggested_queue,
      recommendation: null,
      audit: [...s.audit, log("AI Triage", `Classified ${triage.category}, ${triage.priority}, suggested ${triage.suggested_queue}`)],
    }));
  }

  function approveRouting() {
    setState((s) => ({
      ...s,
      stage: "assigned",
      audit: [...s.audit, log("Dispatcher", `Approved routing to ${s.queue}`)],
    }));
  }

  function generateGuidance() {
    if (!state.triage) return;
    const retrieval = demoRetrievalAdapter.retrieve({
      organizationId: DEMO_ORG_ID,
      category: state.triage.category,
      queryText: `${state.ticket.subject} ${state.ticket.description}`,
      chunks: DEMO_KB,
    });    const recommendation = composeRecommendation(retrieval);
    setState((s) => ({
      ...s,
      stage: "in_progress",
      recommendation,
      audit: [...s.audit, log("Technician Copilot", recommendation.isAbstention ? "Returned NO_APPROVED_GUIDANCE" : `Returned grounded guidance with ${recommendation.citations.length} citation(s)`)],
    }));
  }

  function finish(decision: "resolved" | "escalated") {
    setState((s) => ({
      ...s,
      stage: decision,
      audit: [...s.audit, log("Technician", decision === "resolved" ? "Marked issue resolved" : "Escalated to L2/L3")],
    }));
  }

  function reset() {
    localStorage.removeItem("armans-msp-v1-demo");
    setState(INITIAL);
  }

  return (
    <main className="min-h-screen p-5 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-700">Armans.AI · Commercial V1 Demo</p>              <h1 className="mt-1 text-3xl font-bold tracking-tight">MSP Service Desk Intelligence Layer</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">VPN support workflow: triage, dispatcher control, approved-knowledge retrieval, technician decision, and audit trail.</p>
            </div>
            <button onClick={reset} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Reset demo</button>
          </div>
          <div className="mt-5 grid gap-2 md:grid-cols-5">
            {["Ticket", "Dispatcher", "Assignment", "Guidance", "Outcome"].map((label, index) => (
              <div key={label} className={`rounded-lg px-3 py-2 text-center text-sm font-semibold ${currentStep >= index + 1 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}. {label}</div>
            ))}
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">1. Customer ticket intake</h2>
            <label className="mt-4 block text-sm font-semibold">Subject</label>
            <input value={state.ticket.subject} disabled={state.stage !== "intake"} onChange={(e) => setState((s) => ({ ...s, ticket: { ...s.ticket, subject: e.target.value } }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
            <label className="mt-3 block text-sm font-semibold">Description</label>
            <textarea value={state.ticket.description} disabled={state.stage !== "intake"} onChange={(e) => setState((s) => ({ ...s, ticket: { ...s.ticket, description: e.target.value } }))} rows={5} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" />
            <button disabled={state.stage !== "intake"} onClick={submitTicket} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-40">Submit + run AI triage</button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">2. AI triage + dispatcher review</h2>
            {!state.triage ? <p className="mt-4 text-sm text-slate-500">Submit a ticket to generate structured triage.</p> : (
              <div className="mt-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Metric label="Category" value={state.triage.category} />
                  <Metric label="Priority" value={state.triage.priority} />
                  <Metric label="Impact" value={state.triage.impact} />
                  <Metric label="Confidence" value={`${Math.round(state.triage.confidence * 100)}%`} />
                </div>
                <p><strong>Missing info:</strong> {state.triage.missing_information.length ? state.triage.missing_information.join("; ") : "None"}</p>
                <label className="block font-semibold">Dispatcher queue</label>
                <select value={state.queue ?? state.triage.suggested_queue} disabled={state.stage !== "dispatcher_review"} onChange={(e) => setState((s) => ({ ...s, queue: e.target.value as Queue }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50">
                  <option value="L1_GENERAL">L1_GENERAL</option>
                  <option value="L2_NETWORK">L2_NETWORK</option>
                  <option value="L2_IDENTITY">L2_IDENTITY</option>
                </select>
                <button disabled={state.stage !== "dispatcher_review"} onClick={approveRouting} className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-40">Dispatcher approves routing</button>
              </div>
            )}
          </div>
        </section>
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">3. Technician workbench</h2>
            <p className="mt-2 text-sm text-slate-600">Assigned queue: <strong>{state.queue ?? "Not assigned"}</strong></p>
            <button disabled={state.stage !== "assigned"} onClick={generateGuidance} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-40">Retrieve approved guidance</button>
            {state.recommendation && (
              <div className={`mt-4 rounded-xl border p-4 ${state.recommendation.isAbstention ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
                <p className="text-sm font-bold">{state.recommendation.isAbstention ? "Safe abstention" : "Grounded recommendation"}</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm font-sans">{state.recommendation.text}</pre>
                {!state.recommendation.isAbstention && (
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    {state.recommendation.citations.map((citation) => (
                      <p key={citation.chunk_id}>Source: {citation.document_title} · {citation.source_reference} · {citation.section_locator}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
            {state.stage === "in_progress" && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => finish("resolved")} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">Resolve</button>
                <button onClick={() => finish("escalated")} className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white">Escalate L2/L3</button>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">4. Audit trail</h2>
            <div className="mt-4 space-y-2">
              {state.audit.length === 0 ? <p className="text-sm text-slate-500">No actions recorded yet.</p> : state.audit.map((item, index) => (
                <div key={`${item.at}-${index}`} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex justify-between gap-3"><strong>{item.actor}</strong><span className="text-slate-500">{item.at}</span></div>
                  <p className="mt-1 text-slate-700">{item.action}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              Demo state is stored locally in this browser. Production storage is designed for Supabase/PostgreSQL with tenant RLS.
            </div>
          </div>
        </section>

        <footer className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          <strong>V1 safety rule:</strong> approved MSP knowledge only. If retrieval has insufficient approved evidence, the system returns <code>NO_APPROVED_GUIDANCE</code> and the technician escalates or reviews manually.
        </footer>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words font-semibold">{value}</p></div>;
}
