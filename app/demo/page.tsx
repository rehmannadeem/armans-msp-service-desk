import type { Metadata } from "next";
import DemoApp from "../demo-app";

export const metadata: Metadata = {
  title: "Guided demo · Armans.AI MSP Service Desk",
  description: "No-login guided demo of the MSP service-desk workflow with synthetic data: triage, dispatcher approval, cited guidance or NO_APPROVED_GUIDANCE, and an audit trail.",
};

export default function DemoPage() {
  return <DemoApp />;
}
