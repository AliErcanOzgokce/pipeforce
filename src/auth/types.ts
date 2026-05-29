export type UserRole = "admin" | "sales_rep" | "viewer"

export interface AuthUser {
  id: string
  email: string
  name: string | null
  imageUrl: string | null
  role: UserRole
}

export interface AuthOrganization {
  id: string
  name: string
  slug: string
}

export interface AuthSession {
  user: AuthUser | null
  organization: AuthOrganization | null
}
