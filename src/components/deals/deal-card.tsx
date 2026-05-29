"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, DollarSign } from "lucide-react"

interface DealCardProps {
  id: string
  title: string
  value: number
  currency: string
  contactName: string | null
  ownerName: string | null
  ownerImageUrl: string | null
  expectedCloseDate: string | null
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

export function DealCard({
  id,
  title,
  value,
  currency,
  contactName,
  ownerName,
  ownerImageUrl,
  expectedCloseDate,
}: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-arcy={`deal-card-${id}`}
    >
      <Card size="sm" className="cursor-grab active:cursor-grabbing">
        <CardContent className="space-y-2">
          <p className="font-medium leading-tight">{title}</p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <DollarSign className="size-3.5" />
            <span>{formatCurrency(value, currency)}</span>
          </div>
          {contactName && (
            <p className="text-xs text-muted-foreground">{contactName}</p>
          )}
          <div className="flex items-center justify-between">
            {expectedCloseDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3" />
                <span>
                  {new Date(expectedCloseDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            <div className="ml-auto">
              <Avatar size="sm">
                {ownerImageUrl && <AvatarImage src={ownerImageUrl} />}
                <AvatarFallback>{getInitials(ownerName)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
