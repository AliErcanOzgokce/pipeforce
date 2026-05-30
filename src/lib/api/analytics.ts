"use server"

import { prisma } from "@/lib/db"

interface KeyMetrics {
  winRate: number
  avgDealValue: number
  avgSalesCycleDays: number
  pipelineVelocity: number
}

interface FunnelItem {
  stageName: string
  stageColor: string
  count: number
  value: number
  conversionRate: number | null
}

interface StageBreakdown {
  stageName: string
  stageColor: string
  count: number
  totalValue: number
  avgValue: number
  avgAgeDays: number
}

interface ActivityBreakdownItem {
  type: string
  count: number
  percentage: number
}

interface TopDeal {
  id: string
  title: string
  value: number
  stageName: string
  stageColor: string
  ownerName: string | null
  ownerImageUrl: string | null
  expectedCloseDate: Date | null
  daysInStage: number
}

interface RevenueMonth {
  month: string
  dealsClosed: number
  revenue: number
  avgDealSize: number
  runningTotal: number
}

interface RepPerformance {
  memberId: string
  memberName: string
  memberImageUrl: string | null
  dealsWon: number
  revenue: number
  winRate: number
  avgDealSize: number
  activitiesCount: number
}

interface AnalyticsData {
  keyMetrics: KeyMetrics
  funnel: FunnelItem[]
  stageBreakdown: StageBreakdown[]
  activityBreakdown: ActivityBreakdownItem[]
  topDeals: TopDeal[]
  revenueByMonth: RevenueMonth[]
  repPerformance: RepPerformance[]
  totalDeals: number
  wonDeals: number
  lostDeals: number
}

export async function getAnalytics(
  orgId: string,
  memberId?: string,
  role?: string
): Promise<AnalyticsData> {
  if (!orgId) throw new Error("Organization ID is required")

  const dealWhere: Record<string, unknown> = { organizationId: orgId }
  if (role === "sales_rep" && memberId) {
    dealWhere.ownerId = memberId
  }

  const now = new Date()

  const deals = await prisma.deal.findMany({
    where: dealWhere,
    include: {
      stage: { select: { name: true, color: true, order: true } },
      owner: { select: { id: true, name: true, imageUrl: true } },
    },
    orderBy: { value: "desc" },
  })

  // All stages (including empty)
  const allStages = await prisma.stage.findMany({
    where: { pipeline: { organizationId: orgId } },
    orderBy: { order: "asc" },
  })

  // Won / lost
  const wonDeals = deals.filter((d) =>
    d.stage.name.toLowerCase().includes("won")
  )
  const lostDeals = deals.filter((d) =>
    d.stage.name.toLowerCase().includes("lost")
  )
  const closedDeals = wonDeals.length + lostDeals.length
  const winRateValue = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0

  // Avg deal value
  const totalValue = deals.reduce((s, d) => s + Number(d.value), 0)
  const avgDealValue = deals.length > 0 ? totalValue / deals.length : 0

  // Avg sales cycle (days from created to won)
  const cycleDays = wonDeals.map((d) => {
    const diffMs = d.updatedAt.getTime() - d.createdAt.getTime()
    return diffMs / (1000 * 60 * 60 * 24)
  })
  const avgSalesCycleDays =
    cycleDays.length > 0
      ? cycleDays.reduce((s, d) => s + d, 0) / cycleDays.length
      : 0

  // Pipeline velocity = (deals * win_rate * avg_value) / avg_cycle_days
  const pipelineVelocity =
    avgSalesCycleDays > 0
      ? (deals.length * (winRateValue / 100) * avgDealValue) / avgSalesCycleDays
      : 0

  const keyMetrics: KeyMetrics = {
    winRate: winRateValue,
    avgDealValue,
    avgSalesCycleDays,
    pipelineVelocity,
  }

  // Funnel with conversion rates
  const stageCounts: { name: string; color: string; count: number; value: number }[] = []
  for (const stage of allStages) {
    const stageDeals = deals.filter((d) => d.stageId === stage.id)
    stageCounts.push({
      name: stage.name,
      color: stage.color,
      count: stageDeals.length,
      value: stageDeals.reduce((s, d) => s + Number(d.value), 0),
    })
  }

  const funnel: FunnelItem[] = stageCounts.map((s, i) => ({
    stageName: s.name,
    stageColor: s.color,
    count: s.count,
    value: s.value,
    conversionRate:
      i > 0 && stageCounts[i - 1].count > 0
        ? (s.count / stageCounts[i - 1].count) * 100
        : null,
  }))

  // Stage breakdown
  const stageBreakdown: StageBreakdown[] = allStages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stageId === stage.id)
    const stageTotal = stageDeals.reduce((s, d) => s + Number(d.value), 0)
    const avgAge =
      stageDeals.length > 0
        ? stageDeals.reduce((s, d) => {
            return s + (now.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          }, 0) / stageDeals.length
        : 0
    return {
      stageName: stage.name,
      stageColor: stage.color,
      count: stageDeals.length,
      totalValue: stageTotal,
      avgValue: stageDeals.length > 0 ? stageTotal / stageDeals.length : 0,
      avgAgeDays: Math.round(avgAge),
    }
  })

  // Activity breakdown
  const activities = await prisma.activity.findMany({
    where: { organizationId: orgId },
    select: { type: true },
  })

  const activityCounts = new Map<string, number>()
  for (const a of activities) {
    activityCounts.set(a.type, (activityCounts.get(a.type) ?? 0) + 1)
  }
  const totalActivities = activities.length
  const activityBreakdown: ActivityBreakdownItem[] = Array.from(
    activityCounts.entries()
  )
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type,
      count,
      percentage: totalActivities > 0 ? (count / totalActivities) * 100 : 0,
    }))

  // Top deals (top 10) with daysInStage
  const topDeals: TopDeal[] = deals.slice(0, 10).map((d) => {
    const daysInStage = Math.round(
      (now.getTime() - d.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    return {
      id: d.id,
      title: d.title,
      value: Number(d.value),
      stageName: d.stage.name,
      stageColor: d.stage.color,
      ownerName: d.owner.name,
      ownerImageUrl: d.owner.imageUrl,
      expectedCloseDate: d.expectedCloseDate,
      daysInStage,
    }
  })

  // Revenue by month (won deals only)
  const revenueMap = new Map<string, { revenue: number; count: number }>()
  for (const deal of wonDeals) {
    const date = deal.updatedAt
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const existing = revenueMap.get(monthKey)
    if (existing) {
      existing.revenue += Number(deal.value)
      existing.count++
    } else {
      revenueMap.set(monthKey, { revenue: Number(deal.value), count: 1 })
    }
  }

  let runningTotal = 0
  const revenueByMonth: RevenueMonth[] = Array.from(revenueMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      runningTotal += data.revenue
      return {
        month,
        dealsClosed: data.count,
        revenue: data.revenue,
        avgDealSize: data.count > 0 ? data.revenue / data.count : 0,
        runningTotal,
      }
    })

  // Rep performance (admin only)
  let repPerformance: RepPerformance[] = []
  if (role === "admin") {
    const members = await prisma.member.findMany({
      where: { organizationId: orgId },
      select: { id: true, name: true, imageUrl: true },
    })

    const memberActivities = await prisma.activity.groupBy({
      by: ["createdById"],
      where: { organizationId: orgId },
      _count: true,
    })
    const activityMap = new Map(
      memberActivities.map((a) => [a.createdById, a._count])
    )

    repPerformance = members.map((m) => {
      const memberDeals = deals.filter((d) => d.owner.id === m.id)
      const memberWon = memberDeals.filter((d) =>
        d.stage.name.toLowerCase().includes("won")
      )
      const memberLost = memberDeals.filter((d) =>
        d.stage.name.toLowerCase().includes("lost")
      )
      const memberClosed = memberWon.length + memberLost.length
      const memberRevenue = memberWon.reduce(
        (s, d) => s + Number(d.value),
        0
      )
      return {
        memberId: m.id,
        memberName: m.name ?? "Unknown",
        memberImageUrl: m.imageUrl,
        dealsWon: memberWon.length,
        revenue: memberRevenue,
        winRate:
          memberClosed > 0
            ? (memberWon.length / memberClosed) * 100
            : 0,
        avgDealSize:
          memberWon.length > 0 ? memberRevenue / memberWon.length : 0,
        activitiesCount: activityMap.get(m.id) ?? 0,
      }
    }).sort((a, b) => b.revenue - a.revenue)
  }

  return {
    keyMetrics,
    funnel,
    stageBreakdown,
    activityBreakdown,
    topDeals,
    revenueByMonth,
    repPerformance,
    totalDeals: deals.length,
    wonDeals: wonDeals.length,
    lostDeals: lostDeals.length,
  }
}
