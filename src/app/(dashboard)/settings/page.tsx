"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "@/auth/use-session"
import { useAuthOrganization } from "@/auth/hooks"
import { getMembers } from "@/lib/api/deals"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Building2, Users, Shield } from "lucide-react"

interface MemberData {
  id: string
  name: string | null
  email: string
  role: string
  imageUrl: string | null
}

function roleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  switch (role) {
    case "ADMIN":
      return "default"
    case "SALES_REP":
      return "secondary"
    default:
      return "outline"
  }
}

function formatRole(role: string) {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "SALES_REP":
      return "Sales Rep"
    case "VIEWER":
      return "Viewer"
    default:
      return role
  }
}

function getInitials(name: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function SettingsPage() {
  const { organizationId, role, isLoaded } = useSession()
  const { organization } = useAuthOrganization()

  const [members, setMembers] = useState<MemberData[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = role === "admin"

  const fetchMembers = useCallback(async () => {
    if (!organizationId) return

    setLoading(true)
    try {
      const data = await getMembers(organizationId)
      setMembers(
        data.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          imageUrl: m.imageUrl,
        }))
      )
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (isLoaded && organizationId) {
      fetchMembers()
    }
  }, [isLoaded, organizationId, fetchMembers])

  if (!isLoaded || loading) {
    return (
      <div data-arcy="settings-page" className="space-y-6">
        <div className="space-y-1">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-80 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg border bg-muted" />
      </div>
    )
  }

  if (!organizationId || !organization) {
    return (
      <div
        data-arcy="settings-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">
          Please sign in and select an organization.
        </p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div
        data-arcy="settings-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">
          Only admins can access settings.
        </p>
      </div>
    )
  }

  return (
    <div data-arcy="settings-page" className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-[family-name:var(--font-display)] text-[28px] tracking-tight">
          Settings
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Manage your organization settings
        </p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList data-arcy="settings-tabs" variant="line">
          <TabsTrigger data-arcy="org-tab" value="organization" className="gap-2">
            <Building2 className="size-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger data-arcy="members-tab" value="members" className="gap-2">
            <Users className="size-4" />
            Members
          </TabsTrigger>
          <TabsTrigger data-arcy="roles-tab" value="roles" className="gap-2">
            <Shield className="size-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-6">
          <div data-arcy="org-info-card" className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-[16px] font-semibold">Organization Info</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Organization details managed through Clerk
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </p>
                <p className="mt-1.5 text-[15px] font-medium">{organization.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Slug
                </p>
                <p className="mt-1.5 text-[15px] font-medium">
                  {organization.slug || "---"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Organization ID
                </p>
                <p className="mt-1.5 font-mono text-[13px] text-muted-foreground">
                  {organization.id}
                </p>
              </div>
            </div>
            <Separator className="my-6" />
            <p className="text-[12px] text-muted-foreground">
              Organization name and slug are managed through your Clerk
              dashboard.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div data-arcy="members-card" className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-[16px] font-semibold">Members</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {members.length} member{members.length !== 1 ? "s" : ""} in your
              organization
            </p>
            <div className="mt-5">
              {members.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-muted-foreground">
                  No members found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Member
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Email
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Role
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow
                        key={member.id}
                        data-arcy={`member-row-${member.id}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar size="default">
                              {member.imageUrl && (
                                <AvatarImage src={member.imageUrl} />
                              )}
                              <AvatarFallback>
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[15px] font-medium">
                              {member.name || "---"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">
                          {member.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleBadgeVariant(member.role)}>
                            {formatRole(member.role)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <div data-arcy="roles-info-card" className="space-y-4">
            <div>
              <h3 className="text-[16px] font-semibold">Role Management</h3>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Understanding roles and permissions
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="size-4 text-primary" />
                  </div>
                  <Badge variant="default">Admin</Badge>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                  Full access to all features. Can manage pipeline settings,
                  view all deals and activities, and access organization
                  settings.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                    <Users className="size-4 text-blue-500" />
                  </div>
                  <Badge variant="secondary">Sales Rep</Badge>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                  Can create and manage their own deals and activities. Sees
                  only their own data in dashboards and reports.
                </p>
              </div>

              <div className="rounded-lg border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Users className="size-4 text-muted-foreground" />
                  </div>
                  <Badge variant="outline">Viewer</Badge>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                  Read-only access to all team data. Cannot create or modify
                  deals, activities, or settings.
                </p>
              </div>
            </div>

            <Separator />
            <p className="text-[12px] text-muted-foreground">
              Roles are assigned through Clerk organization membership. Contact
              your admin to change roles.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
