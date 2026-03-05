"use client";

import { TrendingUp, FileText, CheckCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DashboardKPIs } from "@/types";

export default function KPICards({ kpis }: { kpis: DashboardKPIs }) {
  const cards = [
    {
      title: "Total Oferte",
      value: kpis.totalOffers,
      format: "number",
      icon: FileText,
      color: "blue",
      sub: `${kpis.draftCount} ciornă, ${kpis.sentCount} trimise`,
    },
    {
      title: "Valoare Totală",
      value: kpis.totalValueRon,
      format: "currency",
      icon: TrendingUp,
      color: "green",
      sub: "RON (perioadă selectată)",
    },
    {
      title: "Oferte Acceptate",
      value: kpis.acceptedCount,
      format: "number",
      icon: CheckCircle,
      color: "emerald",
      sub: `Rată de conversie: ${kpis.acceptedRate}%`,
    },
    {
      title: "Rată Conversie",
      value: kpis.acceptedRate,
      format: "percent",
      icon: Clock,
      color: "purple",
      sub: `Din ${kpis.totalOffers} oferte emise`,
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600 bg-blue-100", text: "text-blue-600" },
    green: { bg: "bg-green-50", icon: "text-green-600 bg-green-100", text: "text-green-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600 bg-emerald-100", text: "text-emerald-600" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600 bg-purple-100", text: "text-purple-600" },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const colors = colorMap[card.color];
        return (
          <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {card.format === "currency"
                    ? formatCurrency(card.value as number)
                    : card.format === "percent"
                    ? `${card.value}%`
                    : card.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.icon}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-gray-500">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
