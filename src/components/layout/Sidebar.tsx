"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Building2, LayoutDashboard, FileText,
  Users, LogOut, Package, Layers, Link2, PlusCircle, UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

interface SidebarProps { user: SessionUser; }

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/offers", label: "Oferte", icon: FileText, exact: true },
    { href: "/offers/new", label: "Ofertă Nouă", icon: PlusCircle, exact: true, accent: true },
  ];

  const adminItems = [
    { href: "/settings/products", label: "Prețuri Produse", icon: Package },
    { href: "/settings/extras", label: "Extraopțiuni", icon: Layers },
    { href: "/settings/mappings", label: "Mapare Sheet", icon: Link2 },
    { href: "/settings/users", label: "Utilizatori", icon: Users },
    { href: "/settings/profile", label: "Profilul Meu", icon: UserCircle },
  ];
  const agentItems = [
    { href: "/settings/extras", label: "Extraopțiuni", icon: Layers },
    { href: "/settings/profile", label: "Profilul Meu", icon: UserCircle },
  ];
  const settingsItems = user.role === "ADMIN" ? adminItems : agentItems;

  return (
    <aside className="w-60 min-h-screen bg-slate-900 text-white flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight text-white">BDM Sales</div>
            <div className="text-slate-400 text-xs">Tâmplărie PVC & Al.</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-600 text-white font-medium"
                  : item.accent
                  ? "text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-5 pb-1">
          <div className="px-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Setări</div>
          {settingsItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-slate-700 text-white font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-700/60">
        <div className="flex items-center gap-3 px-3 py-2 mb-0.5">
          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user.name}</div>
            <div className="text-xs text-slate-400 truncate">{user.role === "ADMIN" ? "Administrator" : "Agent"}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full">
          <LogOut className="w-4 h-4" /> Deconectare
        </button>
      </div>
    </aside>
  );
}
