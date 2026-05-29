"use server"

import { prisma } from "@/lib/db"

interface FunnelItem {
  stageName: string
  stageColor: string
  count: number
  value: number
}

interface RevenueItem {
  month: string
  value: number
  count: number
}

interface TopDeal {
  id: string
  title: string
  value: number
  stageName: string
  ownerName: string | null
}

interface AnalyticsData {
  funnel: FunnelItem[]
  revenue: RevenueItem[]
  topDeals: TopDeal[]
  winRate: number
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

  const deals = await prisma.deal.findMany({
    where: dealWhere,
    include: {
      stage: { select: { name: true, color: true, order: true } },
      owner: { select: { name: true } },
    },
    orderBy: { value: "desc" },
  })

  // Pipeline funnel: deals per stage
  const stageMap = new Map<
    string,
    { name: string; color: string; order: number; count: number; value: number }
  >()
  for (const deal of deals) {
    const key = deal.stage.name
    const existing = stageMap.get(key)
    if (existing) {
      existing.count++
      existing.value += Number(deal.value)
    } else {
      stageMap.set(key, {
        name: deal.stage.name,
        color: deal.stage.color,
        order: deal.stage.order,
        count: 1,
        value: Number(deal.value),
      })
    }
  }

  const funnel: FunnelItem[] = Array.from(stageMap.values())
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      stageName: s.name,
      stageColor: s.color,
      count: s.count,
      value: s.value,
    }))

  // Revenue by month (based on updatedAt for won deals, or createdAt for all)
  const revenueMap = new Map<string, { value: number; count: number }>()
  for (const deal of deals) {
    const date = deal.createdAt
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const existing = revenueMap.get(monthKey)
    if (existing) {
      existing.value += Number(deal.value)
      existing.count++
    } else {
      revenueMap.set(monthKey, { value: Number(deal.value), count: 1 })
    }
  }

  const revenue: RevenueItem[] = Array.from(revenueMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      value: data.value,
      count: data.count,
    }))

  // Top deals by value
  const topDeals: TopDeal[] = deals.slice(0, 5).map((d) => ({
    id: d.id,
    title: d.title,
    value: Number(d.value),
    stageName: d.stage.name,
    ownerName: d.owner.name,
  }))

  // Win rate
  const wonDeals = deals.filter((d) =>
    d.stage.name.toLowerCase().includes("won")
  ).length
  const lostDeals = deals.filter((d) =>
    d.stage.name.toLowerCase().includes("lost")
  ).length
  const closedDeals = wonDeals + lostDeals
  const winRate = closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0

  return {
    funnel,
    revenue,
    topDeals,
    winRate,
    totalDeals: deals.length,
    wonDeals,
    lostDeals,
  }
}
