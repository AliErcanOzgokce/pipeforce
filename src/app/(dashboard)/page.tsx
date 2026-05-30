"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "@/auth/use-session"
import { getDashboardMetrics } from "@/lib/api/dashboard"
import Link from "next/link"
import {
  Phone,
  Mail,
  Users,
  CheckSquare,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowRight,
} from "lucide-react"

interface DashboardMetrics {
  totalDeals: number
  totalPipelineValue: number
  dealsWonThisMonth: number
  dealsLostThisMonth: number
  upcomingActivities: number
  recentDeals: {
    id: string
    title: string
    value: number
    stageName: string
    stageColor: string
    contactName: string | null
    ownerName: string | null
    ownerImageUrl: string | null
    updatedAt: Date
  }[]
  upcomingActivitiesList: {
    id: string
    type: string
    title: string
    dealTitle: string | null
    contactName: string | null
    dueDate: Date
    isOverdue: boolean
  }[]
  pipelineFunnel: {
    stageName: string
    stageColor: string
    dealCount: number
    totalValue: number
  }[]
  winRate: { rate: number; won: number; total: number }
  revenueThisMonth: { total: number; deals: { title: string; value: number }[] }
  previousMonth: {
    totalDeals: number
    pipelineValue: number
    wonDeals: number
    lostDeals: number
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const target = new Date(date)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetStart = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  )
  const diffMs = targetStart.getTime() - todayStart.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays === -1) return "Yesterday"
  if (diffDays > 1 && diffDays <= 7) return `in ${diffDays} days`
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`
  return target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function getTrendInfo(
  current: number,
  previous: number
): { direction: "up" | "down"; text: string } | undefined {
  if (previous === 0 && current === 0) return undefined
  if (previous === 0)
    return { direction: "up", text: `+${current} from last month` }
  const diff = current - previous
  const pct = Math.round((Math.abs(diff) / previous) * 100)
  if (diff === 0) return { direction: "up", text: "Same as last month" }
  if (diff > 0) return { direction: "up", text: `+${pct}% vs last month` }
  return { direction: "down", text: `${pct}% down vs last month` }
}

function getActivityIcon(type: string) {
  const cls = "h-4 w-4"
  switch (type.toUpperCase()) {
    case "CALL":
      return <Phone className={cls} />
    case "EMAIL":
      return <Mail className={cls} />
    case "MEETING":
      return <Users className={cls} />
    case "TASK":
      return <CheckSquare className={cls} />
    case "NOTE":
      return <FileText className={cls} />
    default:
      return <Calendar className={cls} />
  }
}

function getActivityIconColor(type: string): string {
  switch (type.toUpperCase()) {
    case "CALL":
      return "text-green-600 bg-green-50"
    case "EMAIL":
      return "text-blue-600 bg-blue-50"
    case "MEETING":
      return "text-purple-600 bg-purple-50"
    case "TASK":
      return "text-amber-600 bg-amber-50"
    case "NOTE":
      return "text-stone-600 bg-stone-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}

/* ---------- Metric Card ---------- */
interface MetricCardProps {
  label: string
  value: string
  trend?: { direction: "up" | "down"; text: string }
  valueClassName?: string
  children?: React.ReactNode
}

function MetricCard({
  label,
  value,
  trend,
  valueClassName,
  children,
}: MetricCardProps) {
  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`font-[family-name:var(--font-display)] text-[28px] tracking-tight mt-1 ${valueClassName ?? ""}`}
      >
        {value}
      </p>
      {trend && (
        <p
          className={`text-xs font-medium mt-1 flex items-center gap-1 ${
            trend.direction === "up" ? "text-green-600" : "text-red-500"
          }`}
        >
          {trend.direction === "up" ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {trend.text}
        </p>
      )}
      {children}
    </div>
  )
}

/* ---------- Skeletons ---------- */
function MetricCardSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-[28px] w-20 rounded mt-1" />
      <div className="skeleton h-3 w-16 rounded mt-1" />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      <div className="skeleton h-5 w-32 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-4 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      <div className="skeleton h-5 w-40 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FunnelSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      <div className="skeleton h-5 w-36 rounded mb-4" />
      <div className="skeleton h-12 w-full rounded" />
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      <div className="skeleton h-5 w-28 rounded mb-2" />
      <div className="skeleton h-10 w-24 rounded" />
      <div className="skeleton h-3 w-32 rounded mt-2" />
    </div>
  )
}

/* ---------- Main Page ---------- */
export default function DashboardPage() {
  const { organizationId, memberId, role, isLoaded } = useSession()

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    if (!organizationId || !memberId) return

    setLoading(true)
    try {
      const data = await getDashboardMetrics(organizationId, memberId, role)
      setMetrics(data)
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false)
    }
  }, [organizationId, memberId, role])

  useEffect(() => {
    if (isLoaded && organizationId && memberId) {
      fetchMetrics()
    }
  }, [isLoaded, organizationId, memberId, fetchMetrics])

  if (!organizationId || !memberId) {
    if (isLoaded) {
      return (
        <div
          data-arcy="dashboard-page"
          className="flex items-center justify-center py-12"
        >
          <p className="text-muted-foreground">
            Please sign in and select an organization.
          </p>
        </div>
      )
    }
  }

  if (!isLoaded || loading) {
    return (
      <div data-arcy="dashboard-page" className="space-y-6">
        <div>
          <div className="skeleton h-[28px] w-40 rounded" />
          <div className="skeleton h-4 w-28 rounded mt-1" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <TableSkeleton />
          </div>
          <div className="lg:col-span-2">
            <ActivitySkeleton />
          </div>
        </div>
        <FunnelSkeleton />
        <div className="grid gap-4 lg:grid-cols-2">
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div data-arcy="dashboard-page" className="space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[28px] tracking-tight">
            Dashboard
          </h2>
        </div>
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground text-sm">No data yet</p>
        </div>
      </div>
    )
  }

  const roleLabel =
    role === "admin"
      ? "Team Overview"
      : role === "sales_rep"
        ? "Your Overview"
        : "Team Overview (Read-Only)"

  const maxFunnelCount = Math.max(
    ...metrics.pipelineFunnel.map((s) => s.dealCount),
    1
  )

  return (
    <div data-arcy="dashboard-page" className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-[28px] tracking-tight">
          Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">{roleLabel}</p>
      </div>

      {/* Row 1: Hero Metrics */}
      <div
        data-arcy="dashboard-metrics"
        className="grid gap-4 grid-cols-2 lg:grid-cols-5"
      >
        <MetricCard
          label="Total Deals"
          value={String(metrics.totalDeals)}
          trend={getTrendInfo(
            metrics.totalDeals,
            metrics.previousMonth.totalDeals
          )}
        />

        <MetricCard
          label="Pipeline Value"
          value={formatCurrency(metrics.totalPipelineValue)}
          valueClassName="font-mono text-green-600"
          trend={getTrendInfo(
            metrics.totalPipelineValue,
            metrics.previousMonth.pipelineValue
          )}
        >
          {/* Mini pipeline bar breakdown */}
          {metrics.pipelineFunnel.length > 0 &&
            metrics.totalPipelineValue > 0 && (
              <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full">
                {metrics.pipelineFunnel
                  .filter((s) => s.totalValue > 0)
                  .map((stage, i) => (
                    <div
                      key={i}
                      className="h-full"
                      style={{
                        backgroundColor: stage.stageColor,
                        width: `${(stage.totalValue / metrics.totalPipelineValue) * 100}%`,
                      }}
                      title={`${stage.stageName}: ${formatCurrency(stage.totalValue)}`}
                    />
                  ))}
              </div>
            )}
        </MetricCard>

        <MetricCard
          label="Won This Month"
          value={String(metrics.dealsWonThisMonth)}
          trend={getTrendInfo(
            metrics.dealsWonThisMonth,
            metrics.previousMonth.wonDeals
          )}
        />

        <MetricCard
          label="Lost This Month"
          value={String(metrics.dealsLostThisMonth)}
          trend={getTrendInfo(
            metrics.dealsLostThisMonth,
            metrics.previousMonth.lostDeals
          )}
        />

        <MetricCard
          label="Upcoming Activities"
          value={String(metrics.upcomingActivities)}
          trend={{ direction: "up", text: "Scheduled pending" }}
        />
      </div>

      {/* Row 2: Recent Deals + Upcoming Activities */}
      <div
        data-arcy="dashboard-row-2"
        className="grid gap-4 lg:grid-cols-5"
      >
        {/* Left: Recent Deals (60%) */}
        <div
          data-arcy="recent-deals"
          className="lg:col-span-3 bg-card border rounded-lg p-6 shadow-sm"
        >
          <h3 className="text-[16px] font-semibold mb-4">Recent Deals</h3>
          {metrics.recentDeals.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-[13px] text-muted-foreground">
                No deals yet
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-left pb-2">
                        Deal
                      </th>
                      <th className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right pb-2">
                        Value
                      </th>
                      <th className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-left pb-2 pl-4">
                        Stage
                      </th>
                      <th className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-left pb-2 pl-4 hidden md:table-cell">
                        Owner
                      </th>
                      <th className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-right pb-2 hidden sm:table-cell">
                        Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentDeals.map((deal) => (
                      <tr
                        key={deal.id}
                        className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-2.5 pr-2">
                          <Link
                            href="/deals"
                            className="text-[15px] font-medium hover:text-indigo-600 transition-colors truncate block max-w-[180px]"
                            title={deal.title}
                          >
                            {deal.title}
                          </Link>
                          {deal.contactName && (
                            <p className="text-[13px] text-muted-foreground truncate max-w-[180px]">
                              {deal.contactName}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="font-mono text-green-600 text-[15px]">
                            {formatCurrency(deal.value)}
                          </span>
                        </td>
                        <td className="py-2.5 pl-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[13px]">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: deal.stageColor }}
                            />
                            {deal.stageName}
                          </span>
                        </td>
                        <td className="py-2.5 pl-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            {deal.ownerImageUrl ? (
                              <img
                                src={deal.ownerImageUrl}
                                alt={deal.ownerName ?? ""}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : deal.ownerName ? (
                              <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-medium">
                                {deal.ownerName.charAt(0).toUpperCase()}
                              </div>
                            ) : null}
                            <span className="text-[13px] text-muted-foreground truncate max-w-[100px]">
                              {deal.ownerName ?? "--"}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right hidden sm:table-cell">
                          <span className="text-[13px] text-muted-foreground">
                            {formatRelativeDate(deal.updatedAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 pt-3 border-t">
                <Link
                  href="/deals"
                  className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors"
                >
                  View all deals
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Right: Upcoming Activities (40%) */}
        <div
          data-arcy="upcoming-activities"
          className="lg:col-span-2 bg-card border rounded-lg p-6 shadow-sm"
        >
          <h3 className="text-[16px] font-semibold mb-4">
            Upcoming Activities
          </h3>
          {metrics.upcomingActivitiesList.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-[13px] text-muted-foreground">
                No upcoming activities
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {metrics.upcomingActivitiesList.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-muted/50 ${
                      activity.isOverdue ? "bg-red-50/50" : ""
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getActivityIconColor(activity.type)}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[15px] font-medium truncate ${
                          activity.isOverdue ? "text-red-700" : ""
                        }`}
                      >
                        {activity.title}
                      </p>
                      <p className="text-[13px] text-muted-foreground truncate">
                        {[activity.dealTitle, activity.contactName]
                          .filter(Boolean)
                          .join(" · ") || "No linked record"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[13px] font-medium ${
                        activity.isOverdue
                          ? "text-red-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {activity.isOverdue
                        ? `Overdue`
                        : formatRelativeDate(activity.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <Link
                  href="/activities"
                  className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 transition-colors"
                >
                  View all activities
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 3: Pipeline Funnel */}
      <div
        data-arcy="pipeline-funnel"
        className="bg-card border rounded-lg p-6 shadow-sm"
      >
        <h3 className="text-[16px] font-semibold mb-4">Pipeline Funnel</h3>
        {metrics.pipelineFunnel.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-[13px] text-muted-foreground">
              No pipeline stages configured
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {metrics.pipelineFunnel.map((stage, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-28 shrink-0">
                  <span className="text-[13px] font-medium truncate block">
                    {stage.stageName}
                  </span>
                </div>
                <div className="flex-1 h-8 bg-muted/50 rounded overflow-hidden">
                  <div
                    className="h-full rounded flex items-center px-3 transition-all"
                    style={{
                      backgroundColor: stage.stageColor,
                      width:
                        maxFunnelCount > 0
                          ? `${Math.max((stage.dealCount / maxFunnelCount) * 100, stage.dealCount > 0 ? 8 : 0)}%`
                          : "0%",
                      minWidth: stage.dealCount > 0 ? "60px" : "0px",
                    }}
                  >
                    {stage.dealCount > 0 && (
                      <span className="text-[13px] font-medium text-white whitespace-nowrap">
                        {stage.dealCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-24 shrink-0 text-right">
                  <span className="font-mono text-green-600 text-[13px]">
                    {formatCurrency(stage.totalValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 4: Win Rate + Revenue */}
      <div
        data-arcy="dashboard-row-4"
        className="grid gap-4 lg:grid-cols-2"
      >
        {/* Win Rate */}
        <div
          data-arcy="win-rate"
          className="bg-card border rounded-lg p-6 shadow-sm"
        >
          <h3 className="text-[16px] font-semibold mb-2">Win Rate</h3>
          {metrics.winRate.total === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-[13px] text-muted-foreground">
                No closed deals yet
              </p>
            </div>
          ) : (
            <>
              <p className="font-[family-name:var(--font-display)] text-[40px] tracking-tight">
                {Math.round(metrics.winRate.rate)}%
              </p>
              <p className="text-[15px] text-muted-foreground mt-1">
                {metrics.winRate.won} won out of {metrics.winRate.total} closed
              </p>
              {metrics.previousMonth.wonDeals +
                metrics.previousMonth.lostDeals >
                0 && (
                <p className="text-[13px] text-muted-foreground mt-2">
                  Last month:{" "}
                  {Math.round(
                    (metrics.previousMonth.wonDeals /
                      (metrics.previousMonth.wonDeals +
                        metrics.previousMonth.lostDeals)) *
                      100
                  )}
                  % win rate
                </p>
              )}
            </>
          )}
        </div>

        {/* Revenue This Month */}
        <div
          data-arcy="revenue-this-month"
          className="bg-card border rounded-lg p-6 shadow-sm"
        >
          <h3 className="text-[16px] font-semibold mb-2">
            Revenue This Month
          </h3>
          <p className="font-[family-name:var(--font-display)] text-[40px] tracking-tight font-mono text-green-600">
            {formatCurrency(metrics.revenueThisMonth.total)}
          </p>
          {metrics.previousMonth.wonDeals > 0 && (
            <p className="text-[13px] text-muted-foreground mt-1">
              Last month: {metrics.previousMonth.wonDeals} deal
              {metrics.previousMonth.wonDeals !== 1 ? "s" : ""} closed
            </p>
          )}
          {metrics.revenueThisMonth.deals.length > 0 ? (
            <div className="mt-4 space-y-2 border-t pt-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Won Deals
              </p>
              {metrics.revenueThisMonth.deals.map((deal, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="truncate mr-2">{deal.title}</span>
                  <span className="font-mono text-green-600 shrink-0">
                    {formatCurrency(deal.value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground mt-4">
              No deals closed this month yet
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
