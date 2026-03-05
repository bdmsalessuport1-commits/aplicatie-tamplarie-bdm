"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Save, User, Lock } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Minim 2 caractere").optional().or(z.literal("")),
  currentPassword: z.string().min(1, "Parola curentă este obligatorie"),
  newPassword: z
    .string()
    .min(8, "Minim 8 caractere")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Trebuie să conțină litere mari, mici și cifre")
    .optional()
    .or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((d) => !d.newPassword || d.newPassword === d.confirmPassword, {
  message: "Parolele nu coincid",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof schema>;

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: session?.user.name ?? "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!data.name && !data.newPassword) {
      toast.info("Nu ai modificat nimic.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        ...(data.name ? { name: data.name } : {}),
        ...(data.newPassword ? { newPassword: data.newPassword } : {}),
      }),
    });
    if (res.ok) {
      await update(); // refresh session
      toast.success("Profilul a fost actualizat.");
      reset({ name: data.name, currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      const err = await res.json();
      toast.error(err.error || "Eroare la salvare.");
    }
    setSubmitting(false);
  });

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profilul Meu</h1>
        <p className="text-gray-500 text-sm mt-1">Actualizează numele sau parola contului tău.</p>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
            {session?.user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{session?.user.name}</p>
            <p className="text-sm text-gray-500">{session?.user.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${session?.user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
              {session?.user.role === "ADMIN" ? "Administrator" : "Agent"}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
        {/* Name */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Informații Personale</h2>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nume afișat</label>
            <input {...register("name")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={session?.user.name} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Passwords */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Schimbare Parolă</h2>
            <span className="text-xs text-gray-400">(opțional)</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Parola curentă *</label>
              <input {...register("currentPassword")} type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Parolă nouă</label>
              <input {...register("newPassword")} type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Lasă gol dacă nu vrei să schimbi" />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirmare parolă nouă</label>
              <input {...register("confirmPassword")} type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvează...</> : <><Save className="w-4 h-4" /> Salvează modificările</>}
        </button>
      </form>
    </div>
  );
}
