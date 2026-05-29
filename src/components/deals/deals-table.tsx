"use client"

import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DealRow {
  id: string
  title: string
  value: number
  currency: string
  stage: { name: string; color: string }
  contact: { firstName: string; lastName: string } | null
  company: { name: string } | null
  owner: { name: string | null; imageUrl: string | null }
  expectedCloseDate: string | null
}

interface DealsTableProps {
  deals: DealRow[]
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getInitials(name: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function DealsTable({ deals }: DealsTableProps) {
  const router = useRouter()

  return (
    <div data-arcy="deals-table">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Title
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Value
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Stage
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Contact
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Company
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Owner
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Close Date
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No deals found.
              </TableCell>
            </TableRow>
          )}
          {deals.map((deal) => (
            <TableRow
              key={deal.id}
              className="hover:bg-muted/50 cursor-pointer transition-colors duration-100"
              onClick={() => router.push(`/deals/${deal.id}`)}
            >
              <TableCell className="font-medium text-foreground">
                {deal.title}
              </TableCell>
              <TableCell className="font-mono text-sm text-green-600">
                {formatCurrency(Number(deal.value), deal.currency)}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                  <span
                    className="inline-block size-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: deal.stage.color }}
                  />
                  {deal.stage.name}
                </span>
              </TableCell>
              <TableCell className="text-sm">
                {deal.contact
                  ? `${deal.contact.firstName} ${deal.contact.lastName}`
                  : "-"}
              </TableCell>
              <TableCell className="text-sm">
                {deal.company?.name ?? "-"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {deal.owner.imageUrl ? (
                    <img
                      src={deal.owner.imageUrl}
                      alt={deal.owner.name ?? "Owner"}
                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-medium flex-shrink-0">
                      {getInitials(deal.owner.name)}
                    </div>
                  )}
                  <span className="text-sm">{deal.owner.name ?? "-"}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {deal.expectedCloseDate
                  ? new Date(deal.expectedCloseDate).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
