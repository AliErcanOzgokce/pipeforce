"use client"

import { useUser, useOrganization as useClerkOrganization } from "@clerk/nextjs"
import type { AuthUser, AuthOrganization, UserRole } from "@/auth/types"

function resolveRole(clerkRole: string | undefined): UserRole {
  switch (clerkRole) {
    case "org:admin":
      return "admin"
    case "org:viewer":
      return "viewer"
    case "org:member":
    default:
      return "sales_rep"
  }
}

export function useAuth(): { user: AuthUser | null; isLoaded: boolean } {
  const { user: clerkUser, isLoaded: userLoaded } = useUser()
  const { membership, isLoaded: orgLoaded } = useClerkOrganization()

  const isLoaded = userLoaded && orgLoaded

  if (!isLoaded || !clerkUser) {
    return { user: null, isLoaded }
  }

  const user: AuthUser = {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
    name: clerkUser.fullName,
    imageUrl: clerkUser.imageUrl,
    role: resolveRole(membership?.role),
  }

  return { user, isLoaded }
}

export function useAuthOrganization(): {
  organization: AuthOrganization | null
  isLoaded: boolean
} {
  const { organization: clerkOrg, isLoaded } = useClerkOrganization()

  if (!isLoaded || !clerkOrg) {
    return { organization: null, isLoaded }
  }

  const organization: AuthOrganization = {
    id: clerkOrg.id,
    name: clerkOrg.name,
    slug: clerkOrg.slug ?? "",
  }

  return { organization, isLoaded }
}
