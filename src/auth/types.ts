export interface AuthUser {
  id: string
  email: string
  name: string | null
  imageUrl: string | null
  role: "admin" | "sales_rep" | "viewer"
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
