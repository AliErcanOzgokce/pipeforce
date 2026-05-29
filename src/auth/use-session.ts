"use client"

import { useState, useEffect } from "react"
import { useAuth, useAuthOrganization } from "@/auth/hooks"
import { ensureOrganizationAndMember } from "@/lib/api/sync"

interface SessionData {
  organizationId: string // DB internal org ID
  memberId: string       // DB internal member ID
  role: "admin" | "sales_rep" | "viewer"
  isLoaded: boolean
}

/**
 * Resolves Clerk auth into DB-level organization and member IDs.
 * Auto-creates org + member if they don't exist in DB.
 */
export function useSession(): SessionData {
  const { user, isLoaded: authLoaded } = useAuth()
  const { organization, isLoaded: orgLoaded } = useAuthOrganization()
  const [session, setSession] = useState<SessionData>({
    organizationId: "",
    memberId: "",
    role: "viewer",
    isLoaded: false,
  })

  useEffect(() => {
    if (!authLoaded || !orgLoaded || !user || !organization) return

    ensureOrganizationAndMember({
      clerkUserId: user.id,
      clerkOrgId: organization.id,
      orgName: organization.name,
      orgSlug: organization.slug,
      userEmail: user.email,
      userName: user.name,
      userImageUrl: user.imageUrl,
      userRole: user.role,
    }).then(({ organizationId, memberId }) => {
      setSession({
        organizationId,
        memberId,
        role: user.role,
        isLoaded: true,
      })
    })
  }, [authLoaded, orgLoaded, user, organization])

  return session
}
