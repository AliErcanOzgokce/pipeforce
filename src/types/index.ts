export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost"

export type ContactStatus = "prospect" | "active" | "customer" | "churned"

export type ActivityType = "call" | "email" | "meeting" | "task" | "note"

export type UserRole = "admin" | "sales_rep" | "viewer"
