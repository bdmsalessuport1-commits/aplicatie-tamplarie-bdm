"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { PlusCircle, Search, Eye, FileDown, Trash2, ChevronLeft, ChevronRight, FileText } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", agent_id: "", from: "", to: "", page: 1 });
  const limit = 20;

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.agent_id) params.set("agent_id", filters.agent_id);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("page", String(filters.page));
    params.set("limit", String(limit));
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
    toast.warning(`Ștergi oferta ${offerNumber}?`, {
      action: {
        label: "Da, șterge",
        onClick: async () => {
          const res = await fetch(`/api/offers/${id}`, { method: "DELETE" });
          if (res.ok) {
            toast.success("Oferta a fost ștearsă.");
            fetchOffers();
          } else {
            const err = await res.json();
            toast.error(err.error || "Eroare la ștergere.");
          }
        },
      },
      cancel: { label: "Anulează", onClick: () => {} },
    });
  };

  const pages = Math.ceil(total / limit);
  const filtered = search
    ? offers.filter((o) =>
        o.clientName.toLowerCase().includes(search.toLowerCase()) ||
        o.offerNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.title.toLowerCase().includes(search.toLowerCase())
      )
    : offers;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oferte</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} oferte{search ? ` · ${filtered.length} filtrate` : ""}</p>
        </div>
        <Link href="/offers/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium">
          <PlusCircle className="w-4 h-4" /> Ofertă Nouă
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Caută client, nr. ofertă, titlu..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Toate statusurile</option>
            <option value="DRAFT">Ciornă</option>
            <option value="SENT">Trimisă</option>
            <option value="ACCEPTED">Acceptată</option>
            <option value="REJECTED">Respinsă</option>
            <option value="EXPIRED">Expirată</option>
          </select>
          {session?.user.role === "ADMIN" && (
            <select value={filters.agent_id}
              onChange={(e) => setFilters({ ...filters, agent_id: e.target.value, page: 1 })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Toți agenții</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <input type="date" value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <span className="text-gray-400 text-sm">—</span>
          <input type="date" value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value, page: 1 })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {(filters.status || filters.agent_id || filters.from || filters.to || search) && (
            <button onClick={() => { setFilters({ status: "", agent_id: "", from: "", to: "", page: 1 }); setSearch(""); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline">
              Resetează
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Se încarcă ofertele...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nicio ofertă găsită</p>
            <p className="text-sm mt-1">Încearcă să modifici filtrele sau creează o ofertă nouă.</p>
          </div>
        ) : (
          <>
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
                    <tr key={offer.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {offer.offerNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{offer.clientName}</div>
                        <div className="text-xs text-gray-400 truncate max-w-48">{offer.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 text-sm">{offer.product.name}</div>
                        <div className="text-xs text-gray-400">{offer.product.profileType}</div>
                      </td>
                      {session?.user.role === "ADMIN" && (
                        <td className="px-4 py-3 text-gray-600 text-sm">{offer.agent.name}</td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getStatusColor(offer.status)}`}>
                          {getStatusLabel(offer.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(offer.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/offers/${offer.id}`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Vizualizare">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <a href={`/api/offers/${offer.id}/pdf`} target="_blank"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Descarcă PDF">
                            <FileDown className="w-4 h-4" />
                          </a>
                          {offer.status === "DRAFT" && (
                            <button onClick={() => deleteOffer(offer.id, offer.offerNumber)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Șterge">
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

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-500">
                  Pagina {filters.page} din {pages} · {total} oferte
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-3 h-3" /> Anterior
                  </button>
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p} onClick={() => setFilters({ ...filters, page: p })}
                        className={`w-8 h-8 text-xs rounded-lg transition-colors ${filters.page === p ? "bg-blue-600 text-white font-semibold" : "border border-gray-300 hover:bg-gray-100 text-gray-600"}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= pages}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Următor <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
