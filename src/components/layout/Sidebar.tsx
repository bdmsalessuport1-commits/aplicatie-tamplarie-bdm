"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Building2,
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  LogOut,
  Package,
  Layers,
  Link2,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

interface SidebarProps {
  user: SessionUser;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/offers", label: "Oferte", icon: FileText },
    { href: "/offers/new", label: "Ofertă Nouă", icon: PlusCircle },
  ];

  const adminItems = [
    { href: "/settings/products", label: "Prețuri Produse", icon: Package },
    { href: "/settings/extras", label: "Extraopțiuni", icon: Layers },
    { href: "/settings/mappings", label: "Mapare Google Sheet", icon: Link2 },
    { href: "/settings/users", label: "Utilizatori", icon: Users },
  ];

  const agentItems = [
    { href: "/settings/extras", label: "Extraopțiuni", icon: Layers },
  ];

  const settingsItems = user.role === "ADMIN" ? adminItems : agentItems;

  return (
    <aside className="w-60 min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">BDM Sales</div>
            <div className="text-slate-400 text-xs">Tâmplărie</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && item.href !== "/offers/new" && item.href !== "/offers")
                ? "bg-blue-600 text-white"
                : pathname === item.href
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
              item.href === "/offers/new" && "text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-600",
              item.href === "/offers" && pathname === "/offers" && "bg-blue-600 text-white",
              item.href === "/dashboard" && pathname === "/dashboard" && "bg-blue-600 text-white"
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}

        {/* Settings section */}
        <div className="pt-4">
          <div className="px-3 py-1 text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
            Setări
          </div>
          {settingsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname === item.href
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-slate-400 truncate">{user.role}</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Deconectare
        </button>
      </div>
    </aside>
  );
}
