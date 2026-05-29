"use client"

import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { DealCard } from "./deal-card"

interface ColumnDeal {
  id: string
  title: string
  value: number
  currency: string
  contactName: string | null
  ownerName: string | null
  ownerImageUrl: string | null
  expectedCloseDate: string | null
}

interface KanbanColumnProps {
  stageId: string
  stageName: string
  stageColor: string
  deals: ColumnDeal[]
}

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function KanbanColumn({
  stageId,
  stageName,
  stageColor,
  deals,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId })

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0)
  const dealIds = deals.map((d) => d.id)

  return (
    <div
      data-arcy={`kanban-column-${stageName}`}
      className="flex flex-col"
    >
      <div className="mb-3 space-y-1">
        <div className="flex items-center gap-2">
          <div
            className="size-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: stageColor }}
          />
          <h3 className="text-sm font-medium truncate">{stageName}</h3>
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {deals.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          {formatCurrency(totalValue)}
        </p>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col rounded-lg min-h-[200px] transition-colors ${
          isOver ? "bg-accent/50" : "bg-muted/30"
        }`}
      >
        <div
          className="h-[3px] rounded-t-lg flex-shrink-0"
          style={{ backgroundColor: stageColor }}
        />
        <div className="flex flex-col gap-2 p-2 flex-1">
          <SortableContext
            items={dealIds}
            strategy={verticalListSortingStrategy}
          >
            {deals.map((deal) => (
              <DealCard key={deal.id} {...deal} />
            ))}
          </SortableContext>
          {deals.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No deals
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
