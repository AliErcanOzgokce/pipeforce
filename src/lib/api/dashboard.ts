"use server"

import { prisma } from "@/lib/db"

interface DashboardMetrics {
  totalDeals: number
  totalPipelineValue: number
  dealsWonThisMonth: number
  dealsLostThisMonth: number
  upcomingActivities: number
}

export async function getDashboardMetrics(
  orgId: string,
  memberId?: string,
  role?: string
): Promise<DashboardMetrics> {
  if (!orgId) throw new Error("Organization ID is required")

  const dealWhere: Record<string, unknown> = { organizationId: orgId }

  // Sales reps only see their own deals
  if (role === "sales_rep" && memberId) {
    dealWhere.ownerId = memberId
  }

  const activityWhere: Record<string, unknown> = { organizationId: orgId }
  if (role === "sales_rep" && memberId) {
    activityWhere.createdById = memberId
  }

  // Get all deals matching filter
  const deals = await prisma.deal.findMany({
    where: dealWhere,
    include: {
      stage: { select: { name: true } },
    },
  })

  const totalDeals = deals.length
  const totalPipelineValue = deals.reduce(
    (sum, d) => sum + Number(d.value),
    0
  )

  // Deals won/lost this month — based on stage name convention
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const dealsWonThisMonth = deals.filter(
    (d) =>
      d.stage.name.toLowerCase().includes("won") &&
      d.updatedAt >= startOfMonth
  ).length

  const dealsLostThisMonth = deals.filter(
    (d) =>
      d.stage.name.toLowerCase().includes("lost") &&
      d.updatedAt >= startOfMonth
  ).length

  // Upcoming activities (due date in the future, not completed)
  const upcomingActivities = await prisma.activity.count({
    where: {
      ...activityWhere,
      completedAt: null,
      dueDate: { gte: now },
    },
  })

  return {
    totalDeals,
    totalPipelineValue,
    dealsWonThisMonth,
    dealsLostThisMonth,
    upcomingActivities,
  }
}
