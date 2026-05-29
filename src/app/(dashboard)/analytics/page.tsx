"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "@/auth/use-session"
import { getAnalytics } from "@/lib/api/analytics"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export default function AnalyticsPage() {
  const { organizationId, memberId, role, isLoaded } = useSession()

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    if (!organizationId || !memberId) return

    setLoading(true)
    try {
      const analytics = await getAnalytics(
        organizationId,
        memberId,
        role
      )
      setData(analytics)
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false)
    }
  }, [organizationId, memberId, role])

  useEffect(() => {
    if (isLoaded && organizationId && memberId) {
      fetchAnalytics()
    }
  }, [isLoaded, organizationId, memberId, fetchAnalytics])

  if (!isLoaded || loading) {
    return (
      <div data-arcy="analytics-page" className="space-y-6">
        <div className="space-y-1">
          <div className="h-8 w-36 animate-pulse rounded bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="h-32 animate-pulse rounded-lg border bg-muted" />
          <div className="h-32 animate-pulse rounded-lg border bg-muted" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg border bg-muted" />
          <div className="h-64 animate-pulse rounded-lg border bg-muted" />
        </div>
        <div className="h-48 animate-pulse rounded-lg border bg-muted" />
      </div>
    )
  }

  if (!organizationId || !memberId) {
    return (
      <div
        data-arcy="analytics-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">
          Please sign in and select an organization.
        </p>
      </div>
    )
  }

  const roleLabel =
    role === "admin"
      ? "Team Analytics"
      : role === "sales_rep"
        ? "Your Analytics"
        : "Team Analytics (Read-Only)"

  const totalRevenue = data?.funnel?.reduce((sum, item) => sum + item.value, 0) ?? 0

  return (
    <div data-arcy="analytics-page" className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-[family-name:var(--font-display)] text-[28px] tracking-tight">
          Analytics
        </h2>
        <p className="text-[13px] text-muted-foreground">{roleLabel}</p>
      </div>

      {/* Top row: Win rate + Total revenue */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div data-arcy="win-rate-card" className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Win Rate
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-[28px]">
            {data ? `${data.winRate.toFixed(1)}%` : "0%"}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {data?.wonDeals ?? 0} won / {data?.lostDeals ?? 0} lost of{" "}
            {data?.totalDeals ?? 0} total
          </p>
        </div>

        <div data-arcy="total-revenue-card" className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Pipeline Value
          </p>
          <p className="mt-2 font-mono text-[28px] text-green-600">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Across {data?.totalDeals ?? 0} deals
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Funnel */}
        <div data-arcy="pipeline-funnel-card" className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-[16px] font-semibold">Pipeline Funnel</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Deals per stage</p>
          <div className="mt-5">
            {data?.funnel && data.funnel.length > 0 ? (
              <div className="space-y-4">
                {data.funnel.map((item) => {
                  const maxCount = Math.max(
                    ...data.funnel.map((f) => f.count),
                    1
                  )
                  const widthPercent = Math.max((item.count / maxCount) * 100, 4)
                  const totalCount = data.funnel.reduce((s, f) => s + f.count, 0)
                  const pctOfTotal = totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(0) : "0"
                  return (
                    <div key={item.stageName} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded"
                            style={{ backgroundColor: item.stageColor }}
                          />
                          <span className="font-medium">{item.stageName}</span>
                        </div>
                        <span className="tabular-nums text-muted-foreground">
                          {item.count} ({pctOfTotal}%)
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted">
                        <div
                          className="h-3 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: item.stageColor,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-muted-foreground">
                No deals data available.
              </p>
            )}
          </div>
        </div>

        {/* Top Deals */}
        <div data-arcy="top-deals-card" className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-[16px] font-semibold">Top Deals</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Highest value deals</p>
          <div className="mt-5">
            {data?.topDeals && data.topDeals.length > 0 ? (
              <div className="space-y-3">
                {data.topDeals.map((deal, index) => (
                  <div
                    key={deal.id}
                    className="flex items-center gap-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-[family-name:var(--font-display)] text-[14px] text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">
                        {deal.title}
                      </p>
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <span>{deal.stageName}</span>
                        {deal.ownerName && (
                          <>
                            <span className="text-border">|</span>
                            <span>{deal.ownerName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[15px] text-green-600">
                      {formatCurrency(deal.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-muted-foreground">
                No deals data available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Revenue by Month */}
      <div data-arcy="revenue-by-month-card" className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-[16px] font-semibold">Revenue by Month</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Deal values by creation month
        </p>
        <div className="mt-5">
          {data?.revenue && data.revenue.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Month
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Deals
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.revenue.map((item) => (
                  <TableRow key={item.month}>
                    <TableCell className="text-[15px] font-medium">
                      {formatMonth(item.month)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[15px]">
                      {item.count}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[15px] text-green-600">
                      {formatCurrency(item.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-[13px] text-muted-foreground">
              No revenue data available.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
