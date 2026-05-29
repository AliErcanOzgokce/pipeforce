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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Close Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No deals found.
              </TableCell>
            </TableRow>
          )}
          {deals.map((deal) => (
            <TableRow
              key={deal.id}
              className="cursor-pointer"
              onClick={() => router.push(`/deals/${deal.id}`)}
            >
              <TableCell className="font-medium">{deal.title}</TableCell>
              <TableCell>
                {formatCurrency(Number(deal.value), deal.currency)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  <span
                    className="mr-1 inline-block size-2 rounded-full"
                    style={{ backgroundColor: deal.stage.color }}
                  />
                  {deal.stage.name}
                </Badge>
              </TableCell>
              <TableCell>
                {deal.contact
                  ? `${deal.contact.firstName} ${deal.contact.lastName}`
                  : "-"}
              </TableCell>
              <TableCell>{deal.company?.name ?? "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    {deal.owner.imageUrl && (
                      <AvatarImage src={deal.owner.imageUrl} />
                    )}
                    <AvatarFallback>
                      {getInitials(deal.owner.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{deal.owner.name ?? "-"}</span>
                </div>
              </TableCell>
              <TableCell>
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
