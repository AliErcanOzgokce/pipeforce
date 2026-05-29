"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "@/auth/use-session"
import { useAuthOrganization } from "@/auth/hooks"
import { getMembers } from "@/lib/api/deals"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
      <div
        data-arcy="settings-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">Loading settings...</p>
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your organization settings
        </p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList data-arcy="settings-tabs" variant="line">
          <TabsTrigger data-arcy="org-tab" value="organization">
            Organization
          </TabsTrigger>
          <TabsTrigger data-arcy="members-tab" value="members">
            Members
          </TabsTrigger>
          <TabsTrigger data-arcy="roles-tab" value="roles">
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-4">
          <Card data-arcy="org-info-card">
            <CardHeader>
              <CardTitle>Organization Info</CardTitle>
              <CardDescription>
                Organization details managed through Clerk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="mt-1 text-sm">{organization.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Slug
                  </p>
                  <p className="mt-1 text-sm">{organization.slug || "---"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Organization ID
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {organization.id}
                  </p>
                </div>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Organization name and slug are managed through your Clerk
                dashboard.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <Card data-arcy="members-card">
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                {members.length} member{members.length !== 1 ? "s" : ""} in your
                organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No members found.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow
                        key={member.id}
                        data-arcy={`member-row-${member.id}`}
                      >
                        <TableCell className="font-medium">
                          {member.name || "---"}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card data-arcy="roles-info-card">
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>
                Understanding roles and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Admin</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Full access to all features. Can manage pipeline settings,
                    view all deals and activities, and access organization
                    settings.
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Sales Rep</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Can create and manage their own deals and activities. Sees
                    only their own data in dashboards and reports.
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Viewer</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Read-only access to all team data. Cannot create or modify
                    deals, activities, or settings.
                  </p>
                </div>
              </div>

              <Separator />
              <p className="text-xs text-muted-foreground">
                Roles are assigned through Clerk organization membership. Contact
                your admin to change roles.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
