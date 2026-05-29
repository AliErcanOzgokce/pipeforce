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
import { Separator } from "@/components/ui/separator"

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

export function Sidebar() {
  const { user } = useAuth()
  const role = user?.role ?? "viewer"

  const visibleRoutes = routes.filter((route) => route.roles.includes(role))

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background" data-arcy="sidebar">
      <div className="flex items-center gap-2 px-4 py-5">
        <h1 className="text-lg font-bold tracking-tight">PipeForce</h1>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4" data-arcy="sidebar-nav">
        {visibleRoutes.map((route) => (
          <NavItem key={route.href} href={route.href} label={route.label} icon={route.icon} />
        ))}
      </nav>
      <Separator />
      <div className="px-4 py-3">
        {user && (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
              <Badge variant="outline" className="mt-1 text-xs capitalize">
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
