"use client";

import { useState, useEffect } from "react";
import { Check, Info, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { ExtraOptionWithMapping } from "@/types";

interface ExtraSelection {
  extraOptionId: string;
  quantity: number;
  unitPriceRon: number;
  notes?: string;
}

interface Props {
  offerId?: string;
  googleSheetUrl?: string;
  selected: ExtraSelection[];
  onChange: (selected: ExtraSelection[]) => void;
}

export default function ExtrasSelector({ offerId, googleSheetUrl, selected, onChange }: Props) {
  const [extras, setExtras] = useState<ExtraOptionWithMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncWarnings, setSyncWarnings] = useState<string[]>([]);
  const [syncedPrices, setSyncedPrices] = useState<Record<string, number>>({});
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    fetch("/api/extra-options")
      .then((r) => r.json())
      .then((data) => {
        setExtras(data);
        setLoading(false);
      });
  }, []);

  const syncSheet = async () => {
    if (!offerId) return;
    setSyncing(true);
    setSyncError("");
    setSyncWarnings([]);

    const res = await fetch(`/api/offers/${offerId}/sync-sheet`, { method: "POST" });
    const data = await res.json();

    if (data.synced) {
      const priceMap: Record<string, number> = {};
      data.prices.forEach((p: { extraOptionId: string; priceRon: number }) => {
        priceMap[p.extraOptionId] = p.priceRon;
      });
      setSyncedPrices(priceMap);
      setSyncWarnings(data.warnings);

      // Update selected extras with new prices
      onChange(
        selected.map((s) => ({
          ...s,
          unitPriceRon: priceMap[s.extraOptionId] ?? s.unitPriceRon,
        }))
      );
    } else {
      setSyncError(data.error || "Eroare la sincronizare.");
    }
    setSyncing(false);
  };

  const toggle = (extra: ExtraOptionWithMapping) => {
    const isSelected = selected.some((s) => s.extraOptionId === extra.id);
    if (isSelected) {
      onChange(selected.filter((s) => s.extraOptionId !== extra.id));
    } else {
      onChange([
        ...selected,
        {
          extraOptionId: extra.id,
          quantity: 1,
          unitPriceRon: syncedPrices[extra.id] ?? 0,
        },
      ]);
    }
  };

  const updateField = (extraOptionId: string, field: keyof ExtraSelection, value: number | string) => {
    onChange(
      selected.map((s) =>
        s.extraOptionId === extraOptionId ? { ...s, [field]: value } : s
      )
    );
  };

  // Group by category
  const grouped = extras.reduce<Record<string, ExtraOptionWithMapping[]>>((acc, extra) => {
    if (!acc[extra.category]) acc[extra.category] = [];
    acc[extra.category].push(extra);
    return acc;
  }, {});

  const totalExtras = selected.reduce((sum, s) => sum + s.quantity * s.unitPriceRon, 0);

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Sync button */}
      {offerId && googleSheetUrl && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm text-blue-700 flex-1">
            Sincronizează prețurile din Google Sheet pentru a actualiza automat costurile.
          </span>
          <button
            onClick={syncSheet}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Se sincronizează..." : "Sincronizează prețuri"}
          </button>
        </div>
      )}

      {syncError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {syncError}
        </div>
      )}

      {syncWarnings.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 mb-1">Avertismente sincronizare:</p>
          {syncWarnings.map((w, i) => (
            <p key={i} className="text-xs text-yellow-700">{w}</p>
          ))}
        </div>
      )}

      {/* Category groups */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            {category}
          </h3>
          <div className="grid gap-2">
            {items.map((extra) => {
              const sel = selected.find((s) => s.extraOptionId === extra.id);
              const isSelected = !!sel;
              const hasMapping = !!extra.mapping;
              const hasSyncedPrice = !!syncedPrices[extra.id];

              return (
                <div
                  key={extra.id}
                  className={cn(
                    "border rounded-xl p-4 transition-all cursor-pointer select-none",
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  )}
                  onClick={() => toggle(extra)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                        isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{extra.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{extra.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {hasMapping && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                              {extra.mapping!.cellNotation}
                            </span>
                          )}
                          {hasSyncedPrice && (
                            <span className="text-xs font-semibold text-green-700">
                              {formatCurrency(syncedPrices[extra.id])} / {extra.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          className="mt-3 flex items-center gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600">Cant.:</label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={sel.quantity}
                              onChange={(e) =>
                                updateField(extra.id, "quantity", parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500">{extra.unit}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600">Preț/u.m.:</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={sel.unitPriceRon}
                              onChange={(e) =>
                                updateField(extra.id, "unitPriceRon", parseFloat(e.target.value) || 0)
                              }
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500">RON</span>
                          </div>
                          <div className="text-xs font-semibold text-gray-800 ml-auto">
                            Total: {formatCurrency(sel.quantity * sel.unitPriceRon)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {selected.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {selected.length} extraopțiuni selectate
            </span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(totalExtras)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
