export const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const

export const CONTACT_STATUSES = [
  "prospect",
  "active",
  "customer",
  "churned",
] as const

export const ACTIVITY_TYPES = [
  "call",
  "email",
  "meeting",
  "task",
  "note",
] as const

export const USER_ROLES = ["admin", "sales_rep", "viewer"] as const
