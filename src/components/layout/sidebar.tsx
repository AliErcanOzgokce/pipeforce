"use client"

import {
  LayoutDashboard,
  Handshake,
  Users,
  Building2,
  Activity,
  GitBranch,
  BarChart3,
  Settings,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAuth } from "@/auth/hooks"
import type { UserRole } from "@/auth/types"
import { NavItem } from "./nav-item"
import { Badge } from "@/components/ui/badge"

interface NavRoute {
  href: string
  label: string
  icon: LucideIcon
  roles: UserRole[]
}

const routes: NavRoute[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "sales_rep", "viewer"] },
  { href: "/deals", label: "Deals", icon: Handshake, roles: ["admin", "sales_rep", "viewer"] },
  { href: "/contacts", label: "Contacts", icon: Users, roles: ["admin", "sales_rep", "viewer"] },
  { href: "/companies", label: "Companies", icon: Building2, roles: ["admin", "sales_rep", "viewer"] },
  { href: "/activities", label: "Activities", icon: Activity, roles: ["admin", "sales_rep", "viewer"] },
  { href: "/pipeline", label: "Pipeline", icon: GitBranch, roles: ["admin"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["admin", "sales_rep", "viewer"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
]

/** Admin-only route labels, used to split the nav with a divider. */
const adminOnlyLabels = new Set(["Pipeline", "Settings"])

export function Sidebar() {
  const { user } = useAuth()
  const role = user?.role ?? "viewer"

  const visibleRoutes = routes.filter((route) => route.roles.includes(role))

  const mainRoutes = visibleRoutes.filter((r) => !adminOnlyLabels.has(r.label))
  const adminRoutes = visibleRoutes.filter((r) => adminOnlyLabels.has(r.label))

  /** First + last initials, falling back to email initial. */
  const initials = (() => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/)
      return (parts[0]?.[0] ?? "").toUpperCase() + (parts[parts.length - 1]?.[0] ?? "").toUpperCase()
    }
    return (user?.email?.[0] ?? "?").toUpperCase()
  })()

  return (
    <aside
      className="flex h-full w-64 flex-col bg-[#1c1917]"
      data-arcy="sidebar"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-white">Pipe</span>
          <span className="text-[#4f46e5]">Force</span>
        </h1>
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-white/[0.08]" />

      {/* Main nav */}
      <nav className="flex-1 space-y-1 px-3 py-4" data-arcy="sidebar-nav">
        {mainRoutes.map((route) => (
          <NavItem key={route.href} href={route.href} label={route.label} icon={route.icon} />
        ))}

        {/* Divider before admin-only routes */}
        {adminRoutes.length > 0 && (
          <>
            <div className="mx-0 my-3 border-t border-white/[0.08]" />
            {adminRoutes.map((route) => (
              <NavItem key={route.href} href={route.href} label={route.label} icon={route.icon} />
            ))}
          </>
        )}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-white/[0.08]" />

      {/* User section */}
      <div className="px-4 py-3">
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#d6d3d1]">
                {user.name ?? user.email}
              </p>
              <Badge
                variant="outline"
                className="mt-0.5 border-white/[0.12] text-xs capitalize text-[#a8a29e]"
              >
                {role.replace("_", " ")}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export { routes }
