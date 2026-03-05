import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BDM Tâmplărie – Sistem Ofertare",
  description: "Aplicație profesională pentru ofertare sisteme PVC & Aluminiu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className="antialiased">{children}</body>
    </html>
  );
}
