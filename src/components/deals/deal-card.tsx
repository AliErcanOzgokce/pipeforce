"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-arcy={`deal-card-${id}`}
      className={`bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-150 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 scale-[1.02]" : ""
      }`}
    >
      <p className="font-medium text-sm truncate">{title}</p>
      <p className="font-mono text-xs text-green-600 font-medium mt-1">
        {formatCurrency(value, currency)}
      </p>
      {contactName && (
        <p className="text-xs text-muted-foreground truncate mt-1">
          {contactName}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        {expectedCloseDate ? (
          <span className="text-xs text-muted-foreground">
            {new Date(expectedCloseDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : (
          <span />
        )}
        <div className="ml-auto">
          {ownerImageUrl ? (
            <img
              src={ownerImageUrl}
              alt={ownerName ?? "Owner"}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-medium">
              {getInitials(ownerName)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
