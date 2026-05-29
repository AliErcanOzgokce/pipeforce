"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "@/auth/use-session"
import { getDashboardMetrics } from "@/lib/api/dashboard"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  CalendarClock,
} from "lucide-react"

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

  if (!isLoaded || loading) {
    return (
      <div
        data-arcy="dashboard-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (!organizationId || !memberId) {
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

  const roleLabel =
    role === "admin"
      ? "Team Overview"
      : role === "sales_rep"
        ? "Your Overview"
        : "Team Overview (Read-Only)"

  return (
    <div data-arcy="dashboard-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">{roleLabel}</p>
      </div>

      <div
        data-arcy="dashboard-metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Card>
          <CardHeader>
            <CardDescription>Total Deals</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BarChart3 className="size-5 text-muted-foreground" />
              {metrics?.totalDeals ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {role === "sales_rep"
                ? "Your active deals"
                : "All deals in pipeline"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Pipeline Value</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <DollarSign className="size-5 text-muted-foreground" />
              {formatCurrency(metrics?.totalPipelineValue ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Total value of all deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Won This Month</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="size-5 text-green-500" />
              {metrics?.dealsWonThisMonth ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Deals closed won this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Lost This Month</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingDown className="size-5 text-red-500" />
              {metrics?.dealsLostThisMonth ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Deals lost this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Upcoming Activities</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CalendarClock className="size-5 text-muted-foreground" />
              {metrics?.upcomingActivities ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Scheduled activities pending
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
