"use client"

import { useCallback, useState } from "react"
import {
  DndContext,
  DragOverlay,
  DragOverEvent,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import { KanbanColumn } from "./kanban-column"
import { DealCard } from "./deal-card"
import { updateDealStage } from "@/lib/api/deals"

interface DealData {
  id: string
  title: string
  value: number
  currency: string
  stageId: string
  contact: { firstName: string; lastName: string } | null
  owner: { name: string | null; imageUrl: string | null }
  expectedCloseDate: string | null
}

interface StageData {
  id: string
  name: string
  color: string
  order: number
}

interface KanbanBoardProps {
  deals: DealData[]
  stages: StageData[]
}

function toColumnDeal(deal: DealData) {
  return {
    id: deal.id,
    title: deal.title,
    value: Number(deal.value),
    currency: deal.currency,
    contactName: deal.contact
      ? `${deal.contact.firstName} ${deal.contact.lastName}`
      : null,
    ownerName: deal.owner.name,
    ownerImageUrl: deal.owner.imageUrl,
    expectedCloseDate: deal.expectedCloseDate,
  }
}

export function KanbanBoard({ deals: initialDeals, stages }: KanbanBoardProps) {
  const [deals, setDeals] = useState(initialDeals)
  const [activeDealId, setActiveDealId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const findStageForDeal = useCallback(
    (dealId: string) => {
      const deal = deals.find((d) => d.id === dealId)
      return deal?.stageId ?? null
    },
    [deals]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDealId(event.active.id as string)
  }, [])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      const activeStageId = findStageForDeal(activeId)
      // over could be a stage or another deal
      const isOverStage = stages.some((s) => s.id === overId)
      const overStageId = isOverStage ? overId : findStageForDeal(overId)

      if (!activeStageId || !overStageId || activeStageId === overStageId) return

      setDeals((prev) =>
        prev.map((d) =>
          d.id === activeId ? { ...d, stageId: overStageId } : d
        )
      )
    },
    [findStageForDeal, stages]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDealId(null)

      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      const isOverStage = stages.some((s) => s.id === overId)
      const targetStageId = isOverStage ? overId : findStageForDeal(overId)

      if (!targetStageId) return

      const deal = deals.find((d) => d.id === activeId)
      if (!deal) return

      // Only call the server if the stage actually changed from original
      const originalDeal = initialDeals.find((d) => d.id === activeId)
      if (originalDeal && originalDeal.stageId !== targetStageId) {
        try {
          await updateDealStage(activeId, targetStageId)
        } catch {
          // Revert on failure
          setDeals(initialDeals)
        }
      }
    },
    [deals, stages, findStageForDeal, initialDeals]
  )

  const activeDeal = activeDealId
    ? deals.find((d) => d.id === activeDealId)
    : null

  return (
    <div data-arcy="kanban-board" className="flex gap-4 overflow-x-auto pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {stages.map((stage) => {
          const stageDeals = deals
            .filter((d) => d.stageId === stage.id)
            .map(toColumnDeal)

          return (
            <div key={stage.id} className="min-w-[280px] w-[280px] flex-shrink-0">
              <KanbanColumn
                stageId={stage.id}
                stageName={stage.name}
                stageColor={stage.color}
                deals={stageDeals}
              />
            </div>
          )
        })}
        <DragOverlay>
          {activeDeal ? (
            <div className="shadow-lg scale-[1.02] rotate-[1deg]">
              <DealCard {...toColumnDeal(activeDeal)} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
