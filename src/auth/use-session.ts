"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth, useAuthOrganization } from "@/auth/hooks"
import { ensureOrganizationAndMember } from "@/lib/api/sync"

interface SessionData {
  organizationId: string // DB internal org ID
  memberId: string       // DB internal member ID
  role: "admin" | "sales_rep" | "viewer"
  isLoaded: boolean
}

export function useSession(): SessionData {
  const { user, isLoaded: authLoaded } = useAuth()
  const { organization, isLoaded: orgLoaded } = useAuthOrganization()
  const [session, setSession] = useState<SessionData>({
    organizationId: "",
    memberId: "",
    role: "viewer",
    isLoaded: false,
  })
  const syncedRef = useRef("")

  useEffect(() => {
    if (!authLoaded || !orgLoaded || !user || !organization) return

    const key = `${user.id}:${organization.id}`
    if (syncedRef.current === key) return
    syncedRef.current = key

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
