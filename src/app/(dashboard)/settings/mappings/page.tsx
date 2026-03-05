"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Info, Link2 } from "lucide-react";
import type { ExtraOptionWithMapping } from "@/types";

interface Mapping {
  extraOptionId: string;
  cellNotation: string;
  description?: string;
}

export default function MappingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [extras, setExtras] = useState<ExtraOptionWithMapping[]>([]);
  const [mappings, setMappings] = useState<Record<string, Mapping>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session && session.user.role !== "ADMIN") router.push("/dashboard");
  }, [session, router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/extra-options").then((r) => r.json()),
      fetch("/api/mappings").then((r) => r.json()),
    ]).then(([extrasData, mappingsData]) => {
      setExtras(extrasData);
      const init: Record<string, Mapping> = {};
      extrasData.forEach((e: ExtraOptionWithMapping) => {
        init[e.id] = {
          extraOptionId: e.id,
          cellNotation: e.mapping?.cellNotation ?? "",
        };
      });
      mappingsData.forEach((m: { extraOptionId: string; cellNotation: string; description?: string }) => {
        if (init[m.extraOptionId]) {
          init[m.extraOptionId] = { ...init[m.extraOptionId], ...m };
        }
      });
      setMappings(init);
      setLoading(false);
    });
  }, []);

  const saveAll = async () => {
    setSaving(true);
    const toSave = Object.values(mappings).filter((m) => m.cellNotation.trim());
    const res = await fetch("/api/mappings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mappings: toSave }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const grouped = extras.reduce<Record<string, ExtraOptionWithMapping[]>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapare Google Sheets</h1>
          <p className="text-gray-500 text-sm mt-1">Asociați fiecare extraopțiune cu celula din Google Sheet.</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvează...</> : <><Save className="w-4 h-4" /> Salvează Toate</>}
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          Mapările au fost salvate cu succes!
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Cum funcționează maparea?</p>
          <p>Introduceți notația A1 a celulei din Google Sheet (ex: <code className="bg-blue-100 px-1 rounded">G9</code>, <code className="bg-blue-100 px-1 rounded">B15</code>).
          Când se apasă &quot;Sincronizează prețuri&quot; în ofertă, sistemul citește automat prețul din celula respectivă.</p>
          <p className="mt-1 text-xs">Sheet-ul trebuie să fie accesibil public (view) sau service account-ul trebuie adăugat ca viewer.</p>
        </div>
      </div>

      {/* Example sheet */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Sheet exemplu (demo)</span>
        </div>
        <a
          href="https://docs.google.com/spreadsheets/d/1Uj4_c5aixLvZRuVoz78E9WonXhkeaTMJquoA4a1HtJw/edit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-xs"
        >
          https://docs.google.com/spreadsheets/d/1Uj4_c5aixLvZRuVoz78E9WonXhkeaTMJquoA4a1HtJw/edit
        </a>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700">{category}</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((extra) => (
              <div key={extra.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{extra.name}</p>
                  <p className="text-xs text-gray-500">{extra.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Celulă:</span>
                  <input
                    type="text"
                    placeholder="ex: G9"
                    value={mappings[extra.id]?.cellNotation ?? ""}
                    onChange={(e) => setMappings((prev) => ({
                      ...prev,
                      [extra.id]: { ...prev[extra.id], extraOptionId: extra.id, cellNotation: e.target.value.toUpperCase() },
                    }))}
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    maxLength={10}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
