"use server"

import { prisma } from "@/lib/db"

interface RecentDeal {
  id: string
  title: string
  value: number
  stageName: string
  stageColor: string
  contactName: string | null
  ownerName: string | null
  ownerImageUrl: string | null
  updatedAt: Date
}

interface UpcomingActivity {
  id: string
  type: string
  title: string
  dealTitle: string | null
  contactName: string | null
  dueDate: Date
  isOverdue: boolean
}

interface FunnelStage {
  stageName: string
  stageColor: string
  dealCount: number
  totalValue: number
}

interface WinRateData {
  rate: number
  won: number
  total: number
}

interface RevenueThisMonth {
  total: number
  deals: { title: string; value: number }[]
}

interface PreviousMonthData {
  totalDeals: number
  pipelineValue: number
  wonDeals: number
  lostDeals: number
}

interface DashboardMetrics {
  totalDeals: number
  totalPipelineValue: number
  dealsWonThisMonth: number
  dealsLostThisMonth: number
  upcomingActivities: number
  recentDeals: RecentDeal[]
  upcomingActivitiesList: UpcomingActivity[]
  pipelineFunnel: FunnelStage[]
  winRate: WinRateData
  revenueThisMonth: RevenueThisMonth
  previousMonth: PreviousMonthData
}

export async function getDashboardMetrics(
  orgId: string,
  memberId?: string,
  role?: string
): Promise<DashboardMetrics> {
  if (!orgId) throw new Error("Organization ID is required")

  const dealWhere: Record<string, unknown> = { organizationId: orgId }

  if (role === "sales_rep" && memberId) {
    dealWhere.ownerId = memberId
  }

  const activityWhere: Record<string, unknown> = { organizationId: orgId }
  if (role === "sales_rep" && memberId) {
    activityWhere.createdById = memberId
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Get all deals with relations
  const deals = await prisma.deal.findMany({
    where: dealWhere,
    include: {
      stage: { select: { name: true, color: true, order: true } },
      contact: { select: { firstName: true, lastName: true } },
      owner: { select: { name: true, imageUrl: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  const totalDeals = deals.length
  const totalPipelineValue = deals.reduce(
    (sum, d) => sum + Number(d.value),
    0
  )

  // Won/lost this month
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

  // Upcoming activities count
  const upcomingActivitiesCount = await prisma.activity.count({
    where: {
      ...activityWhere,
      completedAt: null,
      dueDate: { gte: now },
    },
  })

  // Recent deals (top 8)
  const recentDeals: RecentDeal[] = deals.slice(0, 8).map((d) => ({
    id: d.id,
    title: d.title,
    value: Number(d.value),
    stageName: d.stage.name,
    stageColor: d.stage.color,
    contactName: d.contact
      ? `${d.contact.firstName} ${d.contact.lastName}`
      : null,
    ownerName: d.owner.name,
    ownerImageUrl: d.owner.imageUrl,
    updatedAt: d.updatedAt,
  }))

  // Upcoming activities list (next 8)
  const activities = await prisma.activity.findMany({
    where: {
      ...activityWhere,
      completedAt: null,
      dueDate: { not: null },
    },
    include: {
      deal: { select: { title: true } },
      contact: { select: { firstName: true, lastName: true } },
    },
    orderBy: { dueDate: "asc" },
    take: 8,
  })

  const upcomingActivitiesList: UpcomingActivity[] = activities.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    dealTitle: a.deal?.title ?? null,
    contactName: a.contact
      ? `${a.contact.firstName} ${a.contact.lastName}`
      : null,
    dueDate: a.dueDate!,
    isOverdue: a.dueDate! < now,
  }))

  // Pipeline funnel — group by stage including empty stages
  const allStages = await prisma.stage.findMany({
    where: { pipeline: { organizationId: orgId } },
    orderBy: { order: "asc" },
  })

  const stageMap = new Map<string, FunnelStage>()
  for (const stage of allStages) {
    stageMap.set(stage.id, {
      stageName: stage.name,
      stageColor: stage.color,
      dealCount: 0,
      totalValue: 0,
    })
  }
  for (const deal of deals) {
    const entry = stageMap.get(deal.stageId)
    if (entry) {
      entry.dealCount++
      entry.totalValue += Number(deal.value)
    }
  }
  const pipelineFunnel = Array.from(stageMap.values())

  // Win rate
  const wonDeals = deals.filter((d) =>
    d.stage.name.toLowerCase().includes("won")
  )
  const lostDeals = deals.filter((d) =>
    d.stage.name.toLowerCase().includes("lost")
  )
  const closedTotal = wonDeals.length + lostDeals.length
  const winRate: WinRateData = {
    rate: closedTotal > 0 ? (wonDeals.length / closedTotal) * 100 : 0,
    won: wonDeals.length,
    total: closedTotal,
  }

  // Revenue this month (won deals this month)
  const wonThisMonth = deals.filter(
    (d) =>
      d.stage.name.toLowerCase().includes("won") &&
      d.updatedAt >= startOfMonth
  )
  const revenueThisMonth: RevenueThisMonth = {
    total: wonThisMonth.reduce((sum, d) => sum + Number(d.value), 0),
    deals: wonThisMonth.map((d) => ({
      title: d.title,
      value: Number(d.value),
    })),
  }

  // Previous month data for trend comparison
  const prevMonthDeals = deals.filter(
    (d) => d.updatedAt >= startOfPrevMonth && d.updatedAt < startOfMonth
  )
  const previousMonth: PreviousMonthData = {
    totalDeals: prevMonthDeals.length,
    pipelineValue: prevMonthDeals.reduce(
      (sum, d) => sum + Number(d.value),
      0
    ),
    wonDeals: prevMonthDeals.filter((d) =>
      d.stage.name.toLowerCase().includes("won")
    ).length,
    lostDeals: prevMonthDeals.filter((d) =>
      d.stage.name.toLowerCase().includes("lost")
    ).length,
  }

  return {
    totalDeals,
    totalPipelineValue,
    dealsWonThisMonth,
    dealsLostThisMonth,
    upcomingActivities: upcomingActivitiesCount,
    recentDeals,
    upcomingActivitiesList,
    pipelineFunnel,
    winRate,
    revenueThisMonth,
    previousMonth,
  }
}
