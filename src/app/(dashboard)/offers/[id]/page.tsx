"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FileDown, Send, CheckCircle, XCircle, Edit, Trash2,
  ChevronLeft, Upload, Loader2, RefreshCw, AlertTriangle, Clock, File, X
} from "lucide-react";
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from "@/lib/utils";
import ExtrasSelector from "@/components/offers/ExtrasSelector";
import type { OfferFull } from "@/types";

export default function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [offer, setOffer] = useState<OfferFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingExtras, setEditingExtras] = useState(false);
  const [extrasSelection, setExtrasSelection] = useState<{ extraOptionId: string; quantity: number; unitPriceRon: number }[]>([]);
  const [savingExtras, setSavingExtras] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchOffer = async () => {
    const res = await fetch(`/api/offers/${id}`);
    if (res.ok) {
      const data = await res.json();
      setOffer(data);
      setExtrasSelection(
        data.extras.map((e: OfferFull["extras"][0]) => ({
          extraOptionId: e.extraOptionId,
          quantity: e.quantity,
          unitPriceRon: e.unitPriceRon,
        }))
      );
    } else {
      router.push("/offers");
    }
    setLoading(false);
  };

  useEffect(() => { fetchOffer(); }, [id]);

  const changeStatus = async (status: string) => {
    if (!offer) return;
    setChangingStatus(true);
    const res = await fetch(`/api/offers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await fetchOffer();
    setChangingStatus(false);
  };

  const saveExtras = async () => {
    setSavingExtras(true);
    await fetch(`/api/offers/${id}/extras`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extras: extrasSelection }),
    });
    await fetchOffer();
    setEditingExtras(false);
    setSavingExtras(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/offers/${id}/upload`, { method: "POST", body: fd });
    if (res.ok) await fetchOffer();
    else {
      const err = await res.json();
      alert(err.error);
    }
    setUploadingFile(false);
    e.target.value = "";
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm("Ștergi fișierul?")) return;
    await fetch(`/api/offers/${id}/upload?fileId=${fileId}`, { method: "DELETE" });
    await fetchOffer();
  };

  const deleteOffer = async () => {
    if (!confirm(`Ștergi oferta ${offer?.offerNumber}?`)) return;
    const res = await fetch(`/api/offers/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/offers");
    else alert((await res.json()).error);
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
  const extrasTotal = offer.extras.reduce((sum, e) => sum + Number(e.totalRon), 0);
  const subtotal = materialsRon + montajRon + extrasTotal;
  const discountRon = (subtotal * discountPct) / 100;
  const total = subtotal - discountRon;

  const tablou = offer.files?.find((f) => f.fileType === "TABLOU");
  const canEdit = offer.status === "DRAFT" || session?.user.role === "ADMIN";

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/offers" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{offer.clientName}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(offer.status)}`}>
                {getStatusLabel(offer.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {offer.offerNumber} · {offer.product.name} – {offer.product.systemName} · {formatDate(offer.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/api/offers/${id}/pdf`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileDown className="w-4 h-4" /> PDF
          </a>
          {offer.status === "DRAFT" && (
            <button
              onClick={() => changeStatus("SENT")}
              disabled={changingStatus}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" /> Trimite
            </button>
          )}
          {offer.status === "SENT" && session?.user.role === "ADMIN" && (
            <>
              <button
                onClick={() => changeStatus("ACCEPTED")}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Acceptată
              </button>
              <button
                onClick={() => changeStatus("REJECTED")}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Respinsă
              </button>
            </>
          )}
          {offer.status === "DRAFT" && (
            <button
              onClick={deleteOffer}
              className="flex items-center gap-2 px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Șterge
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Client info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Date Client</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["Telefon", offer.clientPhone],
                ["Email", offer.clientEmail],
                ["Adresă", offer.clientAddress],
                ["Agent", offer.agent.name],
              ].map(([label, value]) => value ? (
                <div key={label}>
                  <span className="text-gray-500">{label}: </span>
                  <span className="text-gray-900">{value}</span>
                </div>
              ) : null)}
            </div>
            {offer.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <span className="font-medium">Note: </span>{offer.notes}
              </div>
            )}
          </div>

          {/* Google Sheet */}
          {offer.googleSheetUrl && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900">Google Sheet</h2>
                {offer.sheetSyncedAt && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Sincronizat: {formatDate(offer.sheetSyncedAt)}
                  </span>
                )}
              </div>
              <a
                href={offer.googleSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm truncate block"
              >
                {offer.googleSheetUrl}
              </a>
            </div>
          )}

          {/* Extras */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Extraopțiuni ({offer.extras.length})</h2>
              {canEdit && !editingExtras && (
                <button
                  onClick={() => setEditingExtras(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <Edit className="w-3 h-3" /> Editează
                </button>
              )}
            </div>

            {editingExtras ? (
              <div className="space-y-4">
                <ExtrasSelector
                  offerId={id}
                  googleSheetUrl={offer.googleSheetUrl ?? undefined}
                  selected={extrasSelection}
                  onChange={setExtrasSelection}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingExtras(false); setExtrasSelection(offer.extras.map((e) => ({ extraOptionId: e.extraOptionId, quantity: e.quantity, unitPriceRon: e.unitPriceRon }))); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                  >Anulează</button>
                  <button
                    onClick={saveExtras}
                    disabled={savingExtras}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingExtras ? <><Loader2 className="w-3 h-3 animate-spin" /> Salvează...</> : "Salvează extraopțiunile"}
                  </button>
                </div>
              </div>
            ) : offer.extras.length === 0 ? (
              <p className="text-sm text-gray-400">Nicio extraopțiune selectată.</p>
            ) : (
              <div className="space-y-2">
                {offer.extras.map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm text-gray-900">{extra.extraOption.name}</p>
                      <p className="text-xs text-gray-500">{extra.quantity} {extra.extraOption.unit} × {formatCurrency(extra.unitPriceRon)}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{formatCurrency(extra.totalRon)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tablou upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Tablou Tâmplărie (PDF)</h2>
            {tablou ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <File className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tablou.originalName}</p>
                    <p className="text-xs text-gray-500">{(tablou.fileSize / 1024).toFixed(1)} KB · {formatDate(tablou.uploadedAt)}</p>
                  </div>
                </div>
                <button onClick={() => deleteFile(tablou.id)} className="text-red-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click pentru a încărca tabloul (PDF)</p>
                <p className="text-xs text-gray-400 mt-1">Max. {process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || 20}MB</p>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                {uploadingFile && <Loader2 className="w-5 h-5 animate-spin text-blue-500 mt-2" />}
              </label>
            )}
          </div>
        </div>

        {/* Sidebar totals */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Rezumat Costuri</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Materiale</span>
                <span>{formatCurrency(materialsRon)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Montaj standard</span>
                <span>{formatCurrency(montajRon)}</span>
              </div>
              {extrasTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Extraopțiuni</span>
                  <span>{formatCurrency(extrasTotal)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-gray-800 border-t border-gray-100 pt-2">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountPct > 0 && (
                <div className="flex justify-between text-yellow-700">
                  <span>Discount ({discountPct}%)</span>
                  <span>−{formatCurrency(discountRon)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
                <span>TOTAL</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
              {offer.eurRate && (
                <div className="text-xs text-gray-500 text-right">
                  ≈ {formatCurrency(total / Number(offer.eurRate), "EUR")} (1 EUR = {offer.eurRate} RON)
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-sm space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Suprafață</span>
              <span className="font-medium">{mp} mp</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Lungime</span>
              <span className="font-medium">{ml} ml</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Produs</span>
              <span className="font-medium text-right">{offer.product.name}</span>
            </div>
          </div>

          {offer.pdfGeneratedAt && (
            <div className="text-xs text-gray-400 text-center">
              Ultimul PDF generat: {formatDate(offer.pdfGeneratedAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
