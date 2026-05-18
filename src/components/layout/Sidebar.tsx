"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Users,
  Settings,
  Truck,
  ScrollText,
  LogOut,
} from "lucide-react";
import type { Role } from "@/types/database";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
  activePaths?: string[];
  /** visual separator above this item */
  divider?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard",          label: "Panou",        icon: LayoutDashboard, roles: ["admin", "driver"] },
  // Admin-specific routes
  { href: "/admin/checklists",   label: "Checklist-uri", icon: ClipboardList,   roles: ["admin"], activePaths: ["/admin/checklists"] },
  { href: "/admin/incidents",    label: "Incidente",    icon: AlertTriangle,   roles: ["admin"], activePaths: ["/admin/incidents"] },
  { href: "/admin/drivers",      label: "Șoferi",       icon: Users,           roles: ["admin"], activePaths: ["/admin/drivers"] },
  { href: "/admin/vehicles",     label: "Vehicule",     icon: Truck,           roles: ["admin"], activePaths: ["/admin/vehicles"] },
  { href: "/admin/audit-logs",   label: "Jurnal Audit", icon: ScrollText,      roles: ["admin"], activePaths: ["/admin/audit-logs"], divider: true },
  // Driver-specific routes
  { href: "/checklists",         label: "Checklist-uri", icon: ClipboardList,   roles: ["driver"] },
  { href: "/incidents",          label: "Incidente",    icon: AlertTriangle,   roles: ["driver"] },
  // Shared
  { href: "/settings",           label: "Setări",       icon: Settings,        roles: ["admin", "driver"], divider: true },
];

interface SidebarProps {
  role: Role;
  userName: string;
  onSignOut: () => void;
}

export function Sidebar({ role, userName, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const items = navItems.filter((i) => i.roles.includes(role));

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-surface-900 border-r border-surface-700 px-3 py-6">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-none">PallEx</p>
          <p className="text-brand-400 text-xs font-medium">Check</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon, activePaths, divider }) => {
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (activePaths ?? []).some((p) => pathname.startsWith(p));
          return (
            <div key={href}>
              {divider && <div className="my-1.5 border-t border-surface-700/60" />}
              <Link
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                  "transition-colors duration-150",
                  active
                    ? "bg-brand-500/15 text-brand-400"
                    : "text-slate-400 hover:bg-surface-800 hover:text-white",
                ].join(" ")}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-surface-700 pt-4 mt-4">
        <div className="px-3 mb-3">
          <p className="text-sm font-medium text-white truncate">{userName}</p>
          <p className="text-xs text-slate-400 capitalize">{role}</p>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
            text-slate-400 hover:bg-surface-800 hover:text-red-400 transition-colors duration-150"
        >
          <LogOut className="w-4 h-4" />
          Deconectare
        </button>
      </div>
    </aside>
  );
}
