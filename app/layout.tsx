import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Armans.AI MSP Service Desk Intelligence Layer",
  description: "Commercial V1 demo for MSP ticket triage and technician guidance.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
