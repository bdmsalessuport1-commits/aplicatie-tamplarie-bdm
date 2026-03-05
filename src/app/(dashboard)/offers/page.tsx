"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PlusCircle, Search, Filter, Eye, Trash2, FileDown } from "lucide-react";
import { getStatusLabel, getStatusColor, formatDate } from "@/lib/utils";

interface Offer {
  id: string;
  offerNumber: string;
  title: string;
  clientName: string;
  status: string;
  createdAt: string;
  agent: { id: string; name: string };
  product: { name: string; profileType: string };
  _count: { extras: number };
}

export default function OffersPage() {
  const { data: session } = useSession();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    agent_id: "",
    from: "",
    to: "",
    page: 1,
  });

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.agent_id) params.set("agent_id", filters.agent_id);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("page", String(filters.page));
    params.set("limit", "20");

    const res = await fetch(`/api/offers?${params}`);
    if (res.ok) {
      const data = await res.json();
      setOffers(data.offers);
      setTotal(data.pagination.total);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  useEffect(() => {
    if (session?.user.role === "ADMIN") {
      fetch("/api/users").then((r) => r.json()).then(setAgents);
    }
  }, [session]);

  const deleteOffer = async (id: string, offerNumber: string) => {
    if (!confirm(`Ștergi oferta ${offerNumber}?`)) return;
    const res = await fetch(`/api/offers/${id}`, { method: "DELETE" });
    if (res.ok) fetchOffers();
    else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const filtered = offers.filter((o) =>
    !filters.search ||
    o.clientName.toLowerCase().includes(filters.search.toLowerCase()) ||
    o.offerNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
    o.title.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oferte</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} oferte în total</p>
        </div>
        <Link
          href="/offers/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Ofertă Nouă
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Caută client, nr. ofertă..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toate statusurile</option>
            <option value="DRAFT">Ciornă</option>
            <option value="SENT">Trimisă</option>
            <option value="ACCEPTED">Acceptată</option>
            <option value="REJECTED">Respinsă</option>
            <option value="EXPIRED">Expirată</option>
          </select>
          {session?.user.role === "ADMIN" && (
            <select
              value={filters.agent_id}
              onChange={(e) => setFilters({ ...filters, agent_id: e.target.value, page: 1 })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toți agenții</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="De la"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Până la"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Se încarcă...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileDown className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nicio ofertă găsită</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nr. Ofertă</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produs</th>
                  {session?.user.role === "ADMIN" && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {offer.offerNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{offer.clientName}</div>
                      <div className="text-xs text-gray-400 truncate max-w-40">{offer.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{offer.product.name}</div>
                      <div className="text-xs text-gray-400">{offer.product.profileType}</div>
                    </td>
                    {session?.user.role === "ADMIN" && (
                      <td className="px-4 py-3 text-gray-600">{offer.agent.name}</td>
                    )}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(offer.status)}`}>
                        {getStatusLabel(offer.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(offer.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/offers/${offer.id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Vizualizare"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <a
                          href={`/api/offers/${offer.id}/pdf`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Descarcă PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </a>
                        {(offer.status === "DRAFT") && (
                          <button
                            onClick={() => deleteOffer(offer.id, offer.offerNumber)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Șterge"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
