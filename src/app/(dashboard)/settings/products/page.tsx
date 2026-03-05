"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithPrice } from "@/types";

export default function ProductsSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, { pricePerMpRon: string; pricePerMlRon: string; montajPriceRon: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (session && session.user.role !== "ADMIN") router.push("/dashboard");
  }, [session, router]);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((data) => {
      setProducts(data);
      const init: typeof prices = {};
      data.forEach((p: ProductWithPrice) => {
        init[p.id] = {
          pricePerMpRon: String(p.currentPrice?.pricePerMpRon ?? ""),
          pricePerMlRon: String(p.currentPrice?.pricePerMlRon ?? ""),
          montajPriceRon: String(p.currentPrice?.montajPriceRon ?? ""),
        };
      });
      setPrices(init);
      setLoading(false);
    });
  }, []);

  const savePrice = async (productId: string) => {
    setSaving(productId);
    const p = prices[productId];
    const res = await fetch(`/api/products/${productId}/price`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pricePerMpRon: parseFloat(p.pricePerMpRon),
        pricePerMlRon: parseFloat(p.pricePerMlRon),
        montajPriceRon: parseFloat(p.montajPriceRon),
      }),
    });
    if (res.ok) {
      setSaved(productId);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
    </div>
  );

  const grouped = products.reduce<Record<string, ProductWithPrice[]>>((acc, p) => {
    if (!acc[p.profileType]) acc[p.profileType] = [];
    acc[p.profileType].push(p);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Prețuri Produse</h1>
        <p className="text-gray-500 text-sm mt-1">Setați prețurile de bază per produs. Se aplică la ofertele noi.</p>
      </div>

      {Object.entries(grouped).map(([type, prods]) => (
        <div key={type}>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" /> {type}
          </h2>
          <div className="space-y-3">
            {prods.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name} – {product.systemName}</h3>
                    <p className="text-sm text-gray-500">{product.brand}</p>
                  </div>
                  {saved === product.id && (
                    <span className="text-xs text-green-600 font-medium">Salvat!</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: "pricePerMpRon", label: "Preț materiale / mp", hint: "RON/mp" },
                    { key: "pricePerMlRon", label: "Preț materiale / ml", hint: "RON/ml" },
                    { key: "montajPriceRon", label: "Preț montaj standard / u.m.", hint: "RON/(mp+ml)" },
                  ].map(({ key, label, hint }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={prices[product.id]?.[key as keyof typeof prices[string]] ?? ""}
                          onChange={(e) => setPrices((prev) => ({
                            ...prev,
                            [product.id]: { ...prev[product.id], [key]: e.target.value },
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-14"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{hint}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {prices[product.id] && (
                  <div className="mt-3 text-xs text-gray-500">
                    Exemplu (10mp + 15ml): materiale {formatCurrency(parseFloat(prices[product.id].pricePerMpRon || "0") * 10 + parseFloat(prices[product.id].pricePerMlRon || "0") * 15)},
                    montaj {formatCurrency(parseFloat(prices[product.id].montajPriceRon || "0") * 25)}
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => savePrice(product.id)}
                    disabled={saving === product.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving === product.id ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Salvează...</>
                    ) : (
                      <><Save className="w-3 h-3" /> Salvează prețul</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
