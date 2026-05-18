"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Users,
  ScrollText,
  Settings,
} from "lucide-react";
import type { Role } from "@/types/database";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
  activePaths?: string[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Acasă",
    icon: LayoutDashboard,
    roles: ["admin", "driver"],
  },
  {
    href: "/admin/checklists",
    label: "Checklist",
    icon: ClipboardList,
    roles: ["admin"],
    activePaths: ["/admin/checklists"],
  },
  {
    href: "/checklists",
    label: "Checklist",
    icon: ClipboardList,
    roles: ["driver"],
  },
  {
    href: "/admin/incidents",
    label: "Incidente",
    icon: AlertTriangle,
    roles: ["admin"],
    activePaths: ["/admin/incidents"],
  },
  {
    href: "/incidents",
    label: "Incidente",
    icon: AlertTriangle,
    roles: ["driver"],
  },
  {
    href: "/admin/drivers",
    label: "Șoferi",
    icon: Users,
    roles: ["admin"],
    activePaths: ["/admin/drivers"],
  },
  {
    href: "/admin/audit-logs",
    label: "Audit",
    icon: ScrollText,
    roles: ["admin"],
    activePaths: ["/admin/audit-logs"],
  },
  {
    href: "/settings",
    label: "Setări",
    icon: Settings,
    roles: ["driver"],
  },
];

interface BottomNavProps {
  role: Role;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface-900/98 backdrop-blur-xl border-t border-surface-700/80 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-16">
        {items.map(({ href, label, icon: Icon, activePaths }) => {
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (activePaths ?? []).some((p) => pathname.startsWith(p));

          return (
            <Link
              key={href}
              href={href}
              className={[
                "relative flex flex-col items-center justify-center gap-1 flex-1",
                "touch-manipulation select-none transition-colors duration-100",
                active ? "text-brand-400" : "text-surface-500 active:text-surface-300",
              ].join(" ")}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-400 rounded-full" />
              )}
              <Icon className={active ? "w-[22px] h-[22px]" : "w-5 h-5"} />
              <span className={["text-[10px] font-semibold leading-none", active ? "text-brand-400" : "text-surface-500"].join(" ")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
