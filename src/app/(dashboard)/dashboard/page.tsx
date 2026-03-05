"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { RefreshCw, Filter } from "lucide-react";
import KPICards from "@/components/dashboard/KPICards";
import OffersBarChart from "@/components/dashboard/OffersBarChart";
import { getStatusLabel, getStatusColor, formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardResponse } from "@/types";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({
    from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    agent_id: "",
  });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      from: filters.from,
      to: filters.to,
      ...(filters.agent_id ? { agent_id: filters.agent_id } : {}),
    });
    const res = await fetch(`/api/dashboard?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    if (session?.user.role === "ADMIN") {
      fetch("/api/users").then((r) => r.json()).then((users) => setAgents(users));
    }
  }, [session]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bine ai venit, {session?.user.name}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizează
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">De la:</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Până la:</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {session?.user.role === "ADMIN" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Agent:</label>
              <select
                value={filters.agent_id}
                onChange={(e) => setFilters({ ...filters, agent_id: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toți agenții</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-28 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : data ? (
        <KPICards kpis={data.kpis} />
      ) : null}

      {/* Charts */}
      {data && !loading && (
        <OffersBarChart byDay={data.byDay} byProduct={data.byProduct} />
      )}

      {/* Recent offers */}
      {data && data.recentOffers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Oferte Recente</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentOffers.map((offer) => (
              <Link
                key={offer.id}
                href={`/offers/${offer.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{offer.clientName}</p>
                    <p className="text-xs text-gray-500">
                      {offer.offerNumber} · {offer.product?.name}
                      {offer.agent && <span className="ml-2 text-blue-600">({offer.agent.name})</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(offer.status!)}`}>
                    {getStatusLabel(offer.status!)}
                  </span>
                  <span className="text-xs text-gray-400">{offer.createdAt && formatDate(offer.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Link href="/offers" className="text-sm text-blue-600 hover:underline">
              Vezi toate ofertele →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
