"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, ChevronLeft, Loader2, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ExtrasSelector from "@/components/offers/ExtrasSelector";
import type { ProductWithPrice } from "@/types";

const step1Schema = z.object({
  title: z.string().min(3, "Minim 3 caractere"),
  clientName: z.string().min(2, "Obligatoriu"),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email("Email invalid").optional().or(z.literal("")),
  clientAddress: z.string().optional(),
  productId: z.string().uuid("Selectați un produs"),
});

const step2Schema = z.object({
  mp: z.coerce.number().positive("Suprafața trebuie să fie pozitivă"),
  ml: z.coerce.number().positive("Lungimea trebuie să fie pozitivă"),
  googleSheetUrl: z.string().optional(),
  currency: z.enum(["RON", "EUR"]),
  eurRate: z.coerce.number().optional(),
  discountPercent: z.coerce.number().min(0).max(100),
  notes: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

interface ExtraSelection {
  extraOptionId: string;
  quantity: number;
  unitPriceRon: number;
}

export default function NewOfferPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [extras, setExtras] = useState<ExtraSelection[]>([]);
  const [createdOfferId, setCreatedOfferId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { currency: "RON", discountPercent: 0 },
  });

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoadingProducts(false); });
  }, []);

  const selectedProduct = products.find((p) => p.id === form1.watch("productId"));

  const mp = form2.watch("mp") || 0;
  const ml = form2.watch("ml") || 0;
  const discountPct = form2.watch("discountPercent") || 0;
  const currency = form2.watch("currency");
  const eurRate = form2.watch("eurRate");

  const materialsRon = selectedProduct?.currentPrice
    ? mp * selectedProduct.currentPrice.pricePerMpRon + ml * selectedProduct.currentPrice.pricePerMlRon
    : 0;
  const montajRon = selectedProduct?.currentPrice
    ? (mp + ml) * selectedProduct.currentPrice.montajPriceRon
    : 0;
  const extrasTotal = extras.reduce((sum, e) => sum + e.quantity * e.unitPriceRon, 0);
  const subtotal = materialsRon + montajRon + extrasTotal;
  const discount = (subtotal * discountPct) / 100;
  const total = subtotal - discount;

  const handleStep1 = form1.handleSubmit(async (data) => {
    setStep1Data(data);
    setStep(2);
  });

  const handleStep2 = form2.handleSubmit(async (data) => {
    setStep2Data(data);

    // Create offer first to get ID for sheet sync
    setSubmitting(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...step1Data,
          ...data,
          mp: data.mp,
          ml: data.ml,
        }),
      });
      if (res.ok) {
        const offer = await res.json();
        setCreatedOfferId(offer.id);
        setStep(3);
      } else {
        const err = await res.json();
        alert(err.error || "Eroare la crearea ofertei.");
      }
    } catch {
      alert("Eroare la server. Încearcă din nou.");
    }
    setSubmitting(false);
  });

  const handleStep3 = async () => {
    if (!createdOfferId) return;
    setSubmitting(true);

    try {
      // Save extras
      if (extras.length > 0) {
        await fetch(`/api/offers/${createdOfferId}/extras`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ extras }),
        });
      }

      router.push(`/offers/${createdOfferId}`);
    } catch {
      alert("Eroare la salvarea extraopțiunilor.");
    }
    setSubmitting(false);
  };

  const steps = [
    { n: 1, label: "Date Client & Produs" },
    { n: 2, label: "Dimensiuni & Configurare" },
    { n: 3, label: "Extraopțiuni" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ofertă Nouă</h1>
        <p className="text-gray-500 text-sm mt-1">Completați pașii pentru a crea o ofertă</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, idx) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${step >= s.n ? "text-blue-600" : "text-gray-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  step > s.n
                    ? "bg-blue-600 border-blue-600 text-white"
                    : step === s.n
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-gray-300 text-gray-400 bg-white"
                }`}
              >
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${step > s.n ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Date Client</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titlu ofertă *</label>
                <input {...form1.register("title")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex: Apartament str. Florilor" />
                {form1.formState.errors.title && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nume client *</label>
                <input {...form1.register("clientName")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form1.formState.errors.clientName && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.clientName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input {...form1.register("clientPhone")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...form1.register("clientEmail")} type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresă proiect</label>
                <input {...form1.register("clientAddress")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Product selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Sistem Tâmplărie</h2>
            {form1.formState.errors.productId && (
              <p className="text-red-500 text-xs mb-3">{form1.formState.errors.productId.message}</p>
            )}
            {loadingProducts ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-400 w-6 h-6" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {["PVC", "ALUMINIU"].map((type) => (
                  <div key={type}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{type}</h3>
                    <div className="space-y-2">
                      {products.filter((p) => p.profileType === type).map((product) => {
                        const isSelected = form1.watch("productId") === product.id;
                        return (
                          <label
                            key={product.id}
                            className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                              isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="radio"
                              value={product.id}
                              {...form1.register("productId")}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isSelected ? "border-blue-600 bg-blue-600" : "border-gray-400"}`}>
                              {isSelected && <div className="w-full h-full rounded-full bg-white scale-[0.4]" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{product.name} – {product.systemName}</p>
                              <p className="text-xs text-gray-500">{product.brand}</p>
                              {product.currentPrice && (
                                <p className="text-xs text-blue-600 mt-0.5">
                                  {formatCurrency(product.currentPrice.pricePerMpRon)}/mp · Montaj {formatCurrency(product.currentPrice.montajPriceRon)}/u.m.
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Continuă <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={handleStep2} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Dimensiuni & Configurare</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suprafață totală (mp) *</label>
                <input type="number" step="0.01" {...form2.register("mp")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex: 12.50" />
                {form2.formState.errors.mp && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.mp.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lungime totală (ml) *</label>
                <input type="number" step="0.01" {...form2.register("ml")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex: 18.00" />
                {form2.formState.errors.ml && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.ml.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                <input type="number" step="0.1" min="0" max="100" {...form2.register("discountPercent")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monedă</label>
                <select {...form2.register("currency")} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="RON">RON</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              {currency === "EUR" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Curs EUR (RON/EUR)</label>
                  <input type="number" step="0.01" {...form2.register("eurRate")} placeholder="ex: 5.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Google Sheet (prețuri extraopțiuni)</label>
              <input {...form2.register("googleSheetUrl")} placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Sheet-ul trebuie să fie public sau accesibil service account-ului.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observații</label>
              <textarea {...form2.register("notes")} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Culoare RAL, detalii speciale, condiții..." />
            </div>
          </div>

          {/* Preview total */}
          {selectedProduct?.currentPrice && mp > 0 && ml > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Estimare Costuri (fără extraopțiuni)</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-blue-800">
                  <span>Materiale ({mp} mp + {ml} ml)</span>
                  <span className="font-medium">{formatCurrency(materialsRon)}</span>
                </div>
                <div className="flex justify-between text-blue-800">
                  <span>Montaj standard</span>
                  <span className="font-medium">{formatCurrency(montajRon)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-900 border-t border-blue-300 pt-1.5 mt-1.5">
                  <span>Total estimat{discountPct > 0 ? ` (−${discountPct}%)` : ""}</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {currency === "EUR" && eurRate && (
                  <div className="text-xs text-blue-600">≈ {formatCurrency(total / eurRate, "EUR")} (1 EUR = {eurRate} RON)</div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              <ChevronLeft className="w-4 h-4" /> Înapoi
            </button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Se salvează...</> : <>Continuă <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      )}

      {/* Step 3 */}
      {step === 3 && createdOfferId && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Selectați Extraopțiunile</h2>
            <ExtrasSelector
              offerId={createdOfferId}
              googleSheetUrl={step2Data?.googleSheetUrl}
              selected={extras}
              onChange={setExtras}
            />
          </div>

          {/* Final total */}
          <div className="bg-gray-900 text-white rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Estimat Final</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(total)}</p>
                {step2Data?.currency === "EUR" && step2Data.eurRate && (
                  <p className="text-sm text-gray-400 mt-1">≈ {formatCurrency(total / (step2Data.eurRate || 1), "EUR")}</p>
                )}
              </div>
              <div className="text-right text-sm text-gray-400">
                <div>Materiale: {formatCurrency(materialsRon)}</div>
                <div>Montaj: {formatCurrency(montajRon)}</div>
                <div>Extraopțiuni: {formatCurrency(extrasTotal)}</div>
                {discountPct > 0 && <div className="text-yellow-400">Discount −{discountPct}%</div>}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Înapoi
            </button>
            <button
              onClick={handleStep3}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Se salvează...</>
              ) : (
                <><Check className="w-4 h-4" /> Finalizează Oferta</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
