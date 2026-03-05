"use client";

import { useState, useEffect } from "react";
import { Loader2, Layers } from "lucide-react";
import type { ExtraOptionWithMapping } from "@/types";

export default function ExtrasPage() {
  const [extras, setExtras] = useState<ExtraOptionWithMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/extra-options").then((r) => r.json()).then((data) => {
      setExtras(data);
      setLoading(false);
    });
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Extraopțiuni</h1>
        <p className="text-gray-500 text-sm mt-1">{extras.length} extraopțiuni disponibile · Prețurile se preiau din Google Sheet</p>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">{category}</h2>
            <span className="text-xs text-gray-400 ml-auto">{items.length} opțiuni</span>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((extra) => (
              <div key={extra.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{extra.name}</p>
                    <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{extra.unit}</span>
                    {extra.mapping?.cellNotation && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                        Sheet: {extra.mapping.cellNotation}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{extra.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
