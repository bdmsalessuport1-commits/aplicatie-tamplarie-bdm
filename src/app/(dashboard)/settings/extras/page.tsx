"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2, Save, X, Layers, ToggleLeft, ToggleRight } from "lucide-react";
import type { ExtraOptionWithMapping } from "@/types";

const CATEGORIES = [
  "Geam & Izolații", "Folii & Finisaje", "Glafuri & Accesorii",
  "Umbrire & Rulouri", "Ventilație", "Feronerie", "Montaj Special",
];
const UNITS = ["mp", "ml", "buc", "set"] as const;

interface ExtraForm {
  name: string;
  description: string;
  category: string;
  unit: string;
  sortOrder: number;
}

const emptyForm: ExtraForm = { name: "", description: "", category: CATEGORIES[0], unit: "mp", sortOrder: 0 };

export default function ExtrasPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  const [extras, setExtras] = useState<ExtraOptionWithMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExtraForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");

  const fetchExtras = async () => {
    const res = await fetch("/api/extra-options");
    if (res.ok) setExtras(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchExtras(); }, []);

  const startEdit = (extra: ExtraOptionWithMapping) => {
    setEditingId(extra.id);
    setForm({ name: extra.name, description: extra.description, category: extra.category, unit: extra.unit, sortOrder: extra.sortOrder });
    setShowAddForm(false);
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const res = await fetch(`/api/extra-options/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { await fetchExtras(); setEditingId(null); toast.success("Extraopțiunea a fost salvată."); }
    else toast.error("Eroare la salvare.");
    setSaving(false);
  };

  const saveNew = async () => {
    setSaving(true);
    const res = await fetch("/api/extra-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { await fetchExtras(); setShowAddForm(false); setForm(emptyForm); toast.success("Extraopțiunea a fost adăugată."); }
    else toast.error("Eroare la adăugare.");
    setSaving(false);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/extra-options/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) { await fetchExtras(); toast.success(isActive ? "Extraopțiune dezactivată." : "Extraopțiune activată."); }
  };

  const deleteExtra = (id: string, name: string) => {
    toast.warning(`Dezactivezi extraopțiunea "${name}"?`, {
      action: { label: "Da", onClick: () => toggleActive(id, true) },
      cancel: { label: "Anulează", onClick: () => {} },
    });
  };

  const displayed = extras.filter((e) => !filterCategory || e.category === filterCategory);
  const grouped = displayed.reduce<Record<string, ExtraOptionWithMapping[]>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {});

  const FormFields = ({ value, onChange }: { value: ExtraForm; onChange: (v: ExtraForm) => void }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Denumire *</label>
          <input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ex: Geam tripan" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categorie</label>
            <select value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unitate</label>
            <select value={value.unit} onChange={(e) => onChange({ ...value, unit: e.target.value })}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Descriere *</label>
        <textarea value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })}
          rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Descriere comercial-tehnică clară, fără exagerări..." />
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-gray-400 w-6 h-6" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Extraopțiuni</h1>
          <p className="text-gray-500 text-sm mt-0.5">{extras.length} opțiuni · Prețurile se preiau din Google Sheet per ofertă</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowAddForm(!showAddForm); cancelEdit(); setForm(emptyForm); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Anulează" : "Adaugă Opțiune"}
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && isAdmin && (
        <div className="bg-white rounded-xl border-2 border-blue-300 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> Extraopțiune Nouă
          </h2>
          <FormFields value={form} onChange={setForm} />
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setShowAddForm(false); setForm(emptyForm); }}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
              Anulează
            </button>
            <button onClick={saveNew} disabled={saving || !form.name || !form.description}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Salvează...</> : <><Save className="w-3 h-3" /> Adaugă</>}
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilterCategory("")}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${!filterCategory ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
          Toate
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilterCategory(c === filterCategory ? "" : c)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filterCategory === c ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* List grouped by category */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">{category}</h2>
            <span className="text-xs text-gray-400 ml-auto">{items.length} opțiuni</span>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((extra) => (
              <div key={extra.id} className={`px-5 py-4 ${!extra.isActive ? "opacity-50 bg-gray-50" : ""}`}>
                {editingId === extra.id ? (
                  <div className="space-y-3">
                    <FormFields value={form} onChange={setForm} />
                    <div className="flex gap-2">
                      <button onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                        Anulează
                      </button>
                      <button onClick={() => saveEdit(extra.id)} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {saving ? <><Loader2 className="w-3 h-3 animate-spin" /> Salvează...</> : <><Save className="w-3 h-3" /> Salvează</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{extra.name}</p>
                        <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">{extra.unit}</span>
                        {extra.mapping?.cellNotation && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                            Sheet: {extra.mapping.cellNotation}
                          </span>
                        )}
                        {!extra.isActive && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Inactiv</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{extra.description}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEdit(extra)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editează">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleActive(extra.id, extra.isActive)}
                          className={`p-1.5 rounded-lg transition-colors ${extra.isActive ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                          title={extra.isActive ? "Dezactivează" : "Activează"}>
                          {extra.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
