"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "@/auth/use-session"
import { getDashboardMetrics } from "@/lib/api/dashboard"

interface Metrics {
  totalDeals: number
  totalPipelineValue: number
  dealsWonThisMonth: number
  dealsLostThisMonth: number
  upcomingActivities: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface MetricCardProps {
  label: string
  value: string
  trend?: { direction: "up" | "down"; text: string }
  valueClassName?: string
}

function MetricCard({ label, value, trend, valueClassName }: MetricCardProps) {
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
          className={`text-xs font-medium mt-1 ${
            trend.direction === "up" ? "text-green-600" : "text-red-500"
          }`}
        >
          {trend.text}
        </p>
      )}
    </div>
  )
}

function MetricCardSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-[28px] w-20 rounded mt-1" />
      <div className="skeleton h-3 w-16 rounded mt-1" />
    </div>
  )
}

export default function DashboardPage() {
  const { organizationId, memberId, role, isLoaded } = useSession()

  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    if (!organizationId || !memberId) return

    setLoading(true)
    try {
      const data = await getDashboardMetrics(
        organizationId,
        memberId,
        role
      )
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

  return (
    <div data-arcy="dashboard-page" className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-[28px] tracking-tight">
          Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">{roleLabel}</p>
      </div>

      <div
        data-arcy="dashboard-metrics"
        className="grid gap-4 grid-cols-2 lg:grid-cols-5"
      >
        <MetricCard
          label="Total Deals"
          value={String(metrics.totalDeals)}
          trend={{
            direction: "up",
            text: role === "sales_rep" ? "Your active deals" : "All deals in pipeline",
          }}
        />

        <MetricCard
          label="Pipeline Value"
          value={formatCurrency(metrics.totalPipelineValue)}
          valueClassName="text-green-600"
          trend={{ direction: "up", text: "Total value of all deals" }}
        />

        <MetricCard
          label="Won This Month"
          value={String(metrics.dealsWonThisMonth)}
          trend={{ direction: "up", text: "Deals closed won" }}
        />

        <MetricCard
          label="Lost This Month"
          value={String(metrics.dealsLostThisMonth)}
          trend={{ direction: "down", text: "Deals lost" }}
        />

        <MetricCard
          label="Upcoming Activities"
          value={String(metrics.upcomingActivities)}
          trend={{ direction: "up", text: "Scheduled pending" }}
        />
      </div>
    </div>
  )
}
