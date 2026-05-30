"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "@/auth/use-session"
import { getAnalytics } from "@/lib/api/analytics"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Phone,
  Mail,
  Users,
  CheckSquare,
  FileText,
} from "lucide-react"

/* ---------- types (mirrors server action return) ---------- */

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

/* ---------- helpers ---------- */

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

function formatDate(date: Date | null) {
  if (!date) return "--"
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const ACTIVITY_CONFIG: Record<string, { color: string; icon: typeof Phone }> = {
  CALL: { color: "#16a34a", icon: Phone },
  EMAIL: { color: "#3b82f6", icon: Mail },
  MEETING: { color: "#8b5cf6", icon: Users },
  TASK: { color: "#f59e0b", icon: CheckSquare },
  NOTE: { color: "#78716c", icon: FileText },
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

/* ---------- skeleton ---------- */

function AnalyticsSkeleton() {
  return (
    <div data-arcy="analytics-page" className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-36 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
      {/* Key metrics row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
      {/* Funnel */}
      <div className="h-64 animate-pulse rounded-lg border bg-muted" />
      {/* Two-column */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg border bg-muted" />
        <div className="h-72 animate-pulse rounded-lg border bg-muted" />
      </div>
      {/* Top deals */}
      <div className="h-64 animate-pulse rounded-lg border bg-muted" />
      {/* Revenue */}
      <div className="h-48 animate-pulse rounded-lg border bg-muted" />
    </div>
  )
}

/* ---------- page ---------- */

export default function AnalyticsPage() {
  const { organizationId, memberId, role, isLoaded } = useSession()

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    if (!organizationId || !memberId) return

    setLoading(true)
    try {
      const analytics = await getAnalytics(organizationId, memberId, role)
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
    return <AnalyticsSkeleton />
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

  const currentMonth = getCurrentMonth()

  return (
    <div data-arcy="analytics-page" className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <h2 className="font-[family-name:var(--font-display)] text-[28px] tracking-tight">
          Analytics
        </h2>
        <p className="text-[13px] text-muted-foreground">{roleLabel}</p>
      </div>

      {/* Section 1: Key Metrics Row */}
      <div data-arcy="key-metrics" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Win Rate */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Win Rate
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-[28px]">
            {data ? `${data.keyMetrics.winRate.toFixed(1)}%` : "0%"}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {data?.wonDeals ?? 0} won of {data?.totalDeals ?? 0} total
          </p>
        </div>

        {/* Avg Deal Value */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Avg Deal Value
          </p>
          <p className="mt-2 font-mono text-[28px] text-green-600">
            {data ? formatCurrency(data.keyMetrics.avgDealValue) : "$0"}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Across {data?.totalDeals ?? 0} deals
          </p>
        </div>

        {/* Avg Sales Cycle */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Avg Sales Cycle
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-[28px]">
            {data ? `${Math.round(data.keyMetrics.avgSalesCycleDays)} days` : "0 days"}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            From creation to close
          </p>
        </div>

        {/* Pipeline Velocity */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pipeline Velocity
          </p>
          <p className="mt-2 font-mono text-[28px] text-green-600">
            {data ? `${formatCurrency(data.keyMetrics.pipelineVelocity)}/d` : "$0/d"}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Revenue per day
          </p>
        </div>
      </div>

      {/* Section 2: Pipeline Funnel */}
      <div data-arcy="pipeline-funnel" className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-[16px] font-semibold">Pipeline Funnel</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Conversion through pipeline stages
        </p>
        <div className="mt-5">
          {data?.funnel && data.funnel.length > 0 ? (
            <div className="space-y-4">
              {data.funnel.map((item, index) => {
                const maxCount = Math.max(...data.funnel.map((f) => f.count), 1)
                const widthPercent = Math.max((item.count / maxCount) * 100, 4)
                const isDimmed = item.count === 0
                return (
                  <div
                    key={item.stageName}
                    className={isDimmed ? "opacity-40" : ""}
                  >
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded"
                          style={{ backgroundColor: item.stageColor }}
                        />
                        <span className="font-medium">{item.stageName}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {item.count} deals
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-green-600">
                          {formatCurrency(item.value)}
                        </span>
                        {item.conversionRate !== null && index > 0 && (
                          <span className="text-muted-foreground">
                            {item.conversionRate.toFixed(0)}% from{" "}
                            {data.funnel[index - 1].stageName}
                          </span>
                        )}
                      </div>
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
              No pipeline data available.
            </p>
          )}
        </div>
      </div>

      {/* Section 3: Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Deals by Stage */}
        <div data-arcy="deals-by-stage" className="space-y-3">
          <div className="mb-1">
            <h3 className="text-[16px] font-semibold">Deals by Stage</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Breakdown per pipeline stage
            </p>
          </div>
          {data?.stageBreakdown && data.stageBreakdown.length > 0 ? (
            data.stageBreakdown.map((stage) => (
              <div
                key={stage.stageName}
                className="rounded-lg border bg-card p-4 shadow-sm"
                style={{ borderLeftWidth: "4px", borderLeftColor: stage.stageColor }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-medium">
                      {stage.stageName}
                    </span>
                    <span className="text-[13px] tabular-nums text-muted-foreground">
                      {stage.count} {stage.count === 1 ? "deal" : "deals"}
                    </span>
                  </div>
                  <span className="font-mono text-[15px] text-green-600">
                    {formatCurrency(stage.totalValue)}
                  </span>
                </div>
                <div className="mt-2 flex gap-4 text-[13px] text-muted-foreground">
                  <span>
                    Avg:{" "}
                    <span className="font-mono text-green-600">
                      {formatCurrency(stage.avgValue)}
                    </span>
                  </span>
                  <span>
                    Avg age:{" "}
                    <span className="tabular-nums">
                      {stage.avgAgeDays} {stage.avgAgeDays === 1 ? "day" : "days"}
                    </span>
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <p className="py-4 text-center text-[13px] text-muted-foreground">
                No stage data available.
              </p>
            </div>
          )}
        </div>

        {/* Right: Activity Breakdown */}
        <div data-arcy="activity-breakdown" className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-[16px] font-semibold">Activity Breakdown</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Activities by type
          </p>
          <div className="mt-5">
            {data?.activityBreakdown && data.activityBreakdown.length > 0 ? (
              <div className="space-y-4">
                {data.activityBreakdown.map((activity) => {
                  const config = ACTIVITY_CONFIG[activity.type] ?? {
                    color: "#6b7280",
                    icon: FileText,
                  }
                  const Icon = config.icon
                  const maxPercentage = Math.max(
                    ...data.activityBreakdown.map((a) => a.percentage),
                    1
                  )
                  const barWidth = Math.max(
                    (activity.percentage / maxPercentage) * 100,
                    4
                  )
                  return (
                    <div key={activity.type} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <div className="flex items-center gap-2">
                          <Icon
                            className="h-4 w-4"
                            style={{ color: config.color }}
                          />
                          <span className="font-medium capitalize">
                            {activity.type.toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 tabular-nums text-muted-foreground">
                          <span>{activity.count}</span>
                          <span>({activity.percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: config.color,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-muted-foreground">
                No activity data available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Top Deals Table */}
      <div data-arcy="top-deals" className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-[16px] font-semibold">Top Deals</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Highest value deals in the pipeline
        </p>
        <div className="mt-5">
          {data?.topDeals && data.topDeals.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Deal
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Value
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Stage
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Owner
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Expected Close
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Days in Stage
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topDeals.map((deal, index) => (
                  <TableRow key={deal.id}>
                    <TableCell className="text-[13px] tabular-nums text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-[15px] font-medium">
                      <Link
                        href={`/deals/${deal.id}`}
                        className="hover:underline"
                      >
                        {deal.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[15px] text-green-600">
                      {formatCurrency(deal.value)}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium"
                        style={{
                          backgroundColor: `${deal.stageColor}18`,
                          color: deal.stageColor,
                        }}
                      >
                        {deal.stageName}
                      </span>
                    </TableCell>
                    <TableCell className="text-[15px]">
                      {deal.ownerName ?? "--"}
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {formatDate(deal.expectedCloseDate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[15px]">
                      {deal.daysInStage}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-[13px] text-muted-foreground">
              No deals data available.
            </p>
          )}
        </div>
      </div>

      {/* Section 5: Revenue Over Time */}
      <div data-arcy="revenue-by-month" className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-[16px] font-semibold">Revenue Over Time</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Monthly closed-won revenue
        </p>
        <div className="mt-5">
          {data?.revenueByMonth && data.revenueByMonth.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Month
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Deals Closed
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Revenue
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Avg Deal Size
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Running Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.revenueByMonth.map((item) => (
                  <TableRow
                    key={item.month}
                    className={
                      item.month === currentMonth ? "bg-primary/5" : ""
                    }
                  >
                    <TableCell className="text-[15px] font-medium">
                      {formatMonth(item.month)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[15px]">
                      {item.dealsClosed}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[15px] text-green-600">
                      {formatCurrency(item.revenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[15px] text-green-600">
                      {formatCurrency(item.avgDealSize)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[15px] text-green-600">
                      {formatCurrency(item.runningTotal)}
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

      {/* Section 6: Rep Performance (admin only) */}
      {role === "admin" &&
        data?.repPerformance &&
        data.repPerformance.length > 0 && (
          <div data-arcy="rep-performance" className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-[16px] font-semibold">Rep Performance</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Team member performance breakdown
            </p>
            <div className="mt-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Member
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Deals Won
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Revenue
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Win Rate
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Avg Deal Size
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Activities
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const maxRevenue = Math.max(
                      ...data.repPerformance.map((r) => r.revenue),
                      1
                    )
                    return data.repPerformance.map((rep) => {
                      const barWidth =
                        maxRevenue > 0
                          ? (rep.revenue / maxRevenue) * 100
                          : 0
                      return (
                        <TableRow key={rep.memberId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-medium">
                                {rep.memberName}
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 w-full max-w-[120px] rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-[15px]">
                            {rep.dealsWon}
                          </TableCell>
                          <TableCell className="text-right font-mono text-[15px] text-green-600">
                            {formatCurrency(rep.revenue)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-[15px]">
                            {rep.winRate.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-[15px] text-green-600">
                            {formatCurrency(rep.avgDealSize)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-[15px]">
                            {rep.activitiesCount}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  })()}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
    </div>
  )
}
