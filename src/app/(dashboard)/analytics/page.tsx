"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "@/auth/use-session"
import { getAnalytics } from "@/lib/api/analytics"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
      <div
        data-arcy="analytics-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">Loading analytics...</p>
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

  return (
    <div data-arcy="analytics-page" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">{roleLabel}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Win Rate Card */}
        <Card data-arcy="win-rate-card">
          <CardHeader>
            <CardDescription>Deal Win Rate</CardDescription>
            <CardTitle className="text-2xl">
              {data ? `${data.winRate.toFixed(1)}%` : "0%"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data?.wonDeals ?? 0} won / {data?.lostDeals ?? 0} lost of{" "}
              {data?.totalDeals ?? 0} total deals
            </p>
          </CardContent>
        </Card>

        {/* Total Deals Card */}
        <Card data-arcy="total-deals-card">
          <CardHeader>
            <CardDescription>Total Deals</CardDescription>
            <CardTitle className="text-2xl">
              {data?.totalDeals ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Across all pipeline stages
            </p>
          </CardContent>
        </Card>

        {/* Won Deals Card */}
        <Card data-arcy="won-deals-card">
          <CardHeader>
            <CardDescription>Won Deals</CardDescription>
            <CardTitle className="text-2xl">
              {data?.wonDeals ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Successfully closed deals
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pipeline Funnel */}
        <Card data-arcy="pipeline-funnel-card">
          <CardHeader>
            <CardTitle>Pipeline Funnel</CardTitle>
            <CardDescription>Deals per stage</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.funnel && data.funnel.length > 0 ? (
              <div className="space-y-3">
                {data.funnel.map((item) => {
                  const maxCount = Math.max(
                    ...data.funnel.map((f) => f.count),
                    1
                  )
                  const widthPercent = (item.count / maxCount) * 100
                  return (
                    <div key={item.stageName} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="size-3 rounded"
                            style={{ backgroundColor: item.stageColor }}
                          />
                          <span>{item.stageName}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {item.count} deal{item.count !== 1 ? "s" : ""} -{" "}
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full transition-all"
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
              <p className="py-4 text-center text-sm text-muted-foreground">
                No deals data available.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Deals by Value */}
        <Card data-arcy="top-deals-card">
          <CardHeader>
            <CardTitle>Top Deals by Value</CardTitle>
            <CardDescription>Highest value deals</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.topDeals && data.topDeals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topDeals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{deal.title}</p>
                          {deal.ownerName && (
                            <p className="text-xs text-muted-foreground">
                              {deal.ownerName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{deal.stageName}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(deal.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No deals data available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Month */}
      <Card data-arcy="revenue-by-month-card">
        <CardHeader>
          <CardTitle>Revenue by Month</CardTitle>
          <CardDescription>Deal values by creation month</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.revenue && data.revenue.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Deals</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.revenue.map((item) => (
                  <TableRow key={item.month}>
                    <TableCell className="font-medium">
                      {formatMonth(item.month)}
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No revenue data available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
