"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  FileDown, Send, CheckCircle, XCircle, Edit, Trash2,
  ChevronLeft, Upload, Loader2, Clock, File, X, Save,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";
import { updateOfferSchema } from "@/lib/validations";
import ExtrasSelector from "@/components/offers/ExtrasSelector";
import type { OfferFull } from "@/types";
import { z } from "zod";

type EditForm = z.infer<typeof updateOfferSchema>;

export default function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [offer, setOffer] = useState<OfferFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingExtras, setEditingExtras] = useState(false);
  const [extrasSelection, setExtrasSelection] = useState<{ extraOptionId: string; quantity: number; unitPriceRon: number }[]>([]);
  const [savingExtras, setSavingExtras] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; systemName: string; brand: string; profileType: string }[]>([]);

  const form = useForm<EditForm>({ resolver: zodResolver(updateOfferSchema) });

  const fetchOffer = async () => {
    const res = await fetch(`/api/offers/${id}`);
    if (!res.ok) { router.push("/offers"); return; }
    const data: OfferFull = await res.json();
    setOffer(data);
    setExtrasSelection(
      data.extras.map((e) => ({
        extraOptionId: e.extraOptionId,
        quantity: e.quantity,
        unitPriceRon: e.unitPriceRon,
      }))
    );
    form.reset({
      title: data.title,
      clientName: data.clientName,
      clientPhone: data.clientPhone ?? "",
      clientEmail: data.clientEmail ?? "",
      clientAddress: data.clientAddress ?? "",
      productId: data.productId,
      mp: data.mp,
      ml: data.ml,
      googleSheetUrl: data.googleSheetUrl ?? "",
      currency: data.currency,
      eurRate: data.eurRate ?? undefined,
      discountPercent: data.discountPercent,
      notes: data.notes ?? "",
    });
    setLoading(false);
  };

  useEffect(() => { fetchOffer(); }, [id]);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  const saveEdit = form.handleSubmit(async (data) => {
    const res = await fetch(`/api/offers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchOffer();
      setEditMode(false);
      toast.success("Oferta a fost salvată.");
    } else {
      const err = await res.json();
      toast.error(err.error || "Eroare la salvare.");
    }
  });

  const changeStatus = async (status: string) => {
    setChangingStatus(true);
    const res = await fetch(`/api/offers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchOffer();
      toast.success(`Status actualizat: ${getStatusLabel(status)}`);
    } else {
      const err = await res.json();
      toast.error(err.error || "Eroare la schimbarea statusului.");
    }
    setChangingStatus(false);
  };

  const saveExtras = async () => {
    setSavingExtras(true);
    const res = await fetch(`/api/offers/${id}/extras`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extras: extrasSelection }),
    });
    if (res.ok) {
      await fetchOffer();
      setEditingExtras(false);
      toast.success("Extraopțiunile au fost salvate.");
    } else {
      toast.error("Eroare la salvarea extraopțiunilor.");
    }
    setSavingExtras(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/offers/${id}/upload`, { method: "POST", body: fd });
    if (res.ok) {
      await fetchOffer();
      toast.success("Tabloul a fost încărcat cu succes.");
    } else {
      const err = await res.json();
      toast.error(err.error || "Eroare la upload.");
    }
    setUploadingFile(false);
    e.target.value = "";
  };

  const deleteFile = async (fileId: string) => {
    const res = await fetch(`/api/offers/${id}/upload?fileId=${fileId}`, { method: "DELETE" });
    if (res.ok) { await fetchOffer(); toast.success("Fișierul a fost șters."); }
  };

  const deleteOffer = async () => {
    const res = await fetch(`/api/offers/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Oferta a fost ștearsă."); router.push("/offers"); }
    else { const err = await res.json(); toast.error(err.error || "Eroare la ștergere."); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
  if (!offer) return null;

  const mp = Number(offer.mp);
  const ml = Number(offer.ml);
  const discountPct = Number(offer.discountPercent);
  const materialsRon = offer.priceSnapshotMaterialsRon
    ? Number(offer.priceSnapshotMaterialsRon)
    : offer.product.currentPrice
    ? mp * offer.product.currentPrice.pricePerMpRon + ml * offer.product.currentPrice.pricePerMlRon
    : 0;
  const montajRon = offer.priceSnapshotMontajRon
    ? Number(offer.priceSnapshotMontajRon)
    : offer.product.currentPrice
    ? (mp + ml) * offer.product.currentPrice.montajPriceRon
    : 0;
  const extrasTotal = offer.extras.reduce((s, e) => s + Number(e.totalRon), 0);
  const subtotal = materialsRon + montajRon + extrasTotal;
  const discountRon = (subtotal * discountPct) / 100;
  const total = subtotal - discountRon;
  const tablou = offer.files?.find((f) => f.fileType === "TABLOU");
  const canEdit = offer.status === "DRAFT" || session?.user.role === "ADMIN";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/offers" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{offer.clientName}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getStatusColor(offer.status)}`}>
                {getStatusLabel(offer.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-xs mr-2">{offer.offerNumber}</span>
              {offer.product.name} – {offer.product.systemName} · {formatDate(offer.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && !editMode && (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              <Edit className="w-4 h-4" /> Editează
            </button>
          )}
          <a href={`/api/offers/${id}/pdf`} target="_blank"
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
            <FileDown className="w-4 h-4" /> Descarcă PDF
          </a>
          {offer.status === "DRAFT" && (
            <button onClick={() => changeStatus("SENT")} disabled={changingStatus}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {changingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Trimite
            </button>
          )}
          {offer.status === "SENT" && (
            <>
              <button onClick={() => changeStatus("ACCEPTED")} disabled={changingStatus}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                <CheckCircle className="w-4 h-4" /> Acceptată
              </button>
              <button onClick={() => changeStatus("REJECTED")} disabled={changingStatus}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                <XCircle className="w-4 h-4" /> Respinsă
              </button>
            </>
          )}
          {(offer.status === "SENT" || offer.status === "ACCEPTED") && (
            <button onClick={() => changeStatus("EXPIRED")} disabled={changingStatus}
              className="flex items-center gap-2 px-3 py-2 border border-orange-300 text-orange-700 text-sm rounded-lg hover:bg-orange-50 transition-colors">
              <Clock className="w-4 h-4" /> Expirată
            </button>
          )}
          {offer.status === "DRAFT" && (
            <button
              onClick={() => toast.warning(`Ștergi oferta ${offer.offerNumber}?`, {
                action: { label: "Da, șterge", onClick: deleteOffer },
                cancel: { label: "Anulează", onClick: () => {} },
              })}
              className="flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" /> Șterge
            </button>
          )}
        </div>
      </div>

      {/* ── EDIT FORM ── */}
      {editMode && (
        <form onSubmit={saveEdit} className="bg-white rounded-xl border-2 border-blue-300 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Edit className="w-4 h-4 text-blue-600" /> Editare Ofertă
            </h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setEditMode(false); form.reset(); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                Anulează
              </button>
              <button type="submit" disabled={form.formState.isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {form.formState.isSubmitting
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Salvează...</>
                  : <><Save className="w-3 h-3" /> Salvează</>}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Date Client</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {([
                ["title", "Titlu ofertă *", "text"],
                ["clientName", "Nume client *", "text"],
                ["clientPhone", "Telefon", "text"],
                ["clientEmail", "Email", "email"],
              ] as const).map(([name, label, type]) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input {...form.register(name)} type={type}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {form.formState.errors[name] && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors[name]?.message}</p>
                  )}
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Adresă proiect</label>
                <input {...form.register("clientAddress")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sistem Tâmplărie</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {products.map((p) => {
                const isSel = form.watch("productId") === p.id;
                return (
                  <label key={p.id} className={`flex items-start gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${isSel ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" value={p.id} {...form.register("productId")} className="sr-only" />
                    <div className={`w-3 h-3 rounded-full border-2 mt-0.5 flex-shrink-0 ${isSel ? "border-blue-600 bg-blue-600" : "border-gray-400"}`} />
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-tight">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.brand}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dimensiuni & Configurare</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([
                ["mp", "Suprafață (mp) *", "0.01"],
                ["ml", "Lungime (ml) *", "0.01"],
                ["discountPercent", "Discount (%)", "0.1"],
                ["eurRate", "Curs EUR (opț.)", "0.01"],
              ] as const).map(([name, label, step]) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input {...form.register(name, { valueAsNumber: true })} type="number" step={step} min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {form.formState.errors[name] && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors[name]?.message}</p>
                  )}
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monedă</label>
                <select {...form.register("currency")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="RON">RON</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Link Google Sheet</label>
                <input {...form.register("googleSheetUrl")} placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observații</label>
            <textarea {...form.register("notes")} rows={3} placeholder="Culoare RAL, detalii speciale..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Client info */}
          {!editMode && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Date Client & Proiect</h2>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                {([
                  ["Titlu", offer.title],
                  ["Telefon", offer.clientPhone],
                  ["Email", offer.clientEmail],
                  ["Adresă", offer.clientAddress],
                  ["Agent", offer.agent.name],
                  ["Creat", formatDate(offer.createdAt)],
                ] as [string, string | null | undefined][]).map(([label, value]) => value ? (
                  <div key={label} className="flex gap-2">
                    <span className="text-gray-400 flex-shrink-0">{label}:</span>
                    <span className="text-gray-800 font-medium">{value}</span>
                  </div>
                ) : null)}
              </div>
              {offer.notes && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                  <span className="font-medium">Note: </span>{offer.notes}
                </div>
              )}
            </div>
          )}

          {/* Google Sheet */}
          {offer.googleSheetUrl && !editMode && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-900">Google Sheet</h2>
                {offer.sheetSyncedAt && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(offer.sheetSyncedAt)}
                  </span>
                )}
              </div>
              <a href={offer.googleSheetUrl} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs flex items-center gap-1 truncate">
                {offer.googleSheetUrl.slice(0, 70)}...
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          )}

          {/* Extras */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Extraopțiuni
                <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{offer.extras.length}</span>
              </h2>
              {canEdit && !editingExtras && (
                <button onClick={() => setEditingExtras(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  <Edit className="w-3 h-3" /> Modifică
                </button>
              )}
            </div>
            {editingExtras ? (
              <div className="space-y-4">
                <ExtrasSelector offerId={id} googleSheetUrl={offer.googleSheetUrl ?? undefined}
                  selected={extrasSelection} onChange={setExtrasSelection} />
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button onClick={() => { setEditingExtras(false); setExtrasSelection(offer.extras.map((e) => ({ extraOptionId: e.extraOptionId, quantity: e.quantity, unitPriceRon: e.unitPriceRon }))); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                    Anulează
                  </button>
                  <button onClick={saveExtras} disabled={savingExtras}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {savingExtras ? <><Loader2 className="w-3 h-3 animate-spin" /> Salvează...</> : <><Save className="w-3 h-3" /> Salvează</>}
                  </button>
                </div>
              </div>
            ) : offer.extras.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nicio extraopțiune selectată.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {offer.extras.map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{extra.extraOption.name}</p>
                      <p className="text-xs text-gray-400">{extra.quantity} {extra.extraOption.unit} × {formatCurrency(extra.unitPriceRon)}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{formatCurrency(extra.totalRon)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload tablou */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Tablou Tâmplărie
              <span className="ml-2 text-xs text-gray-400 font-normal">PDF – se anexează la oferta finală</span>
            </h2>
            {tablou ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <File className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{tablou.originalName}</p>
                    <p className="text-xs text-gray-500">{(tablou.fileSize / 1024).toFixed(1)} KB · {formatDate(tablou.uploadedAt)}</p>
                  </div>
                </div>
                <button onClick={() => deleteFile(tablou.id)} className="text-red-400 hover:text-red-600 p-1" title="Șterge">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl transition-colors ${uploadingFile ? "opacity-60" : "cursor-pointer hover:border-blue-400 hover:bg-blue-50"}`}>
                {uploadingFile ? <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" /> : <Upload className="w-8 h-8 text-gray-400 mb-2" />}
                <p className="text-sm font-medium text-gray-600">{uploadingFile ? "Se încarcă..." : "Click pentru a încărca tabloul"}</p>
                <p className="text-xs text-gray-400 mt-1">Doar PDF, max 20MB</p>
                <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
              </label>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-lg">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Ofertă</p>
            <p className="text-3xl font-bold">{formatCurrency(total)}</p>
            {offer.eurRate && (
              <p className="text-sm text-slate-400 mt-1">
                ≈ {formatCurrency(total / Number(offer.eurRate), "EUR")}
                <span className="text-xs ml-1">(1€ = {offer.eurRate} RON)</span>
              </p>
            )}
            <div className="mt-4 space-y-1.5 border-t border-slate-700 pt-4 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Materiale</span><span>{formatCurrency(materialsRon)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Montaj</span><span>{formatCurrency(montajRon)}</span>
              </div>
              {extrasTotal > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Extraopțiuni</span><span>{formatCurrency(extrasTotal)}</span>
                </div>
              )}
              {discountPct > 0 && (
                <div className="flex justify-between text-yellow-400 font-medium">
                  <span>Discount ({discountPct}%)</span><span>−{formatCurrency(discountRon)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-sm space-y-2.5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Specificații</h3>
            <div className="flex justify-between text-gray-600"><span>Suprafață</span><span className="font-semibold">{mp} mp</span></div>
            <div className="flex justify-between text-gray-600"><span>Lungime</span><span className="font-semibold">{ml} ml</span></div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-700">{offer.product.name} – {offer.product.systemName}</p>
              <p className="text-xs text-gray-400">{offer.product.brand} · {offer.product.profileType}</p>
            </div>
          </div>

          {offer.priceSnapshotMaterialsRon && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <p className="font-semibold mb-0.5">Prețuri blocate</p>
              <p>Prețurile au fost înghețate la momentul trimiterii ofertei.</p>
            </div>
          )}

          {offer.pdfGeneratedAt && (
            <p className="text-xs text-gray-400 text-center">Ultimul PDF: {formatDate(offer.pdfGeneratedAt)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
