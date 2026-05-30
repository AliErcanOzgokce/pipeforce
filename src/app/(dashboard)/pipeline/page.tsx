"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "@/auth/use-session"
import {
  getPipeline,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
} from "@/lib/api/pipeline"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, GripVertical, Pencil, Trash2 } from "lucide-react"

interface StageData {
  id: string
  name: string
  color: string
  order: number
  dealCount: number
  totalValue: number
  avgValue: number
  topDeals: string[]
}

interface PipelineData {
  id: string
  name: string
  totalStages: number
  totalDeals: number
  totalValue: number
  stages: StageData[]
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`
  }
  return `$${value.toLocaleString()}`
}

function SortableStageItem({
  stage,
  canEdit,
  onEdit,
  onDelete,
}: {
  stage: StageData
  canEdit: boolean
  onEdit: (stage: StageData) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms ease-in-out",
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? "1.02" : "1",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-arcy={`stage-item-${stage.id}`}
      className="flex items-stretch rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Left: drag handle + color bar */}
      <div className="flex items-center gap-0">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="flex items-center self-stretch cursor-grab touch-none px-3 text-muted-foreground transition-colors duration-150 hover:text-foreground"
            data-arcy={`stage-drag-handle-${stage.id}`}
          >
            <GripVertical className="size-5" />
          </button>
        )}
        <div
          className="w-1 self-stretch shrink-0 rounded-l"
          style={{ backgroundColor: stage.color }}
        />
      </div>

      {/* Middle: stage info */}
      <div className="flex-1 py-4 px-4 min-w-0">
        <p className="text-[15px] font-semibold">{stage.name}</p>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {stage.dealCount} {stage.dealCount === 1 ? "deal" : "deals"}
          {" | "}
          <span className="font-mono text-green-600">
            {formatCurrency(stage.totalValue)}
          </span>
          {" total | "}
          <span className="font-mono text-green-600">
            {formatCurrency(stage.avgValue)}
          </span>
          {" avg"}
        </p>
        {stage.topDeals.length > 0 && (
          <p className="text-[12px] text-muted-foreground italic mt-1 truncate">
            {stage.topDeals.join(" · ")}
          </p>
        )}
      </div>

      {/* Right: edit / delete */}
      {canEdit && (
        <div className="flex items-center gap-1 pr-4">
          <Button
            variant="ghost"
            size="icon-sm"
            data-arcy={`edit-stage-${stage.id}`}
            onClick={() => onEdit(stage)}
            className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            data-arcy={`delete-stage-${stage.id}`}
            onClick={() => onDelete(stage.id)}
            className="text-muted-foreground transition-colors duration-150 hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function StageHealthBar({ stages }: { stages: StageData[] }) {
  const totalDeals = stages.reduce((sum, s) => sum + s.dealCount, 0)

  if (totalDeals === 0) {
    return (
      <div
        data-arcy="stage-health-summary"
        className="rounded-lg border bg-card p-6 shadow-sm"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
          Stage Health
        </p>
        <div className="flex items-center justify-center py-8">
          <p className="text-[13px] text-muted-foreground">
            No deals in the pipeline yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      data-arcy="stage-health-summary"
      className="rounded-lg border bg-card p-6 shadow-sm"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
        Stage Health
      </p>
      <div className="flex h-10 w-full overflow-hidden rounded-md">
        {stages.map((stage) => {
          const hasDeals = stage.dealCount > 0
          const widthPercent = hasDeals
            ? (stage.dealCount / totalDeals) * 100
            : 0

          return (
            <div
              key={stage.id}
              className={`flex items-center justify-center transition-all ${
                hasDeals ? "" : "opacity-40"
              }`}
              style={{
                backgroundColor: stage.color,
                width: hasDeals ? `${widthPercent}%` : undefined,
                minWidth: "48px",
                flexShrink: hasDeals ? 1 : 0,
              }}
              title={`${stage.name}: ${stage.dealCount} deals`}
            >
              <span className="text-[11px] font-medium text-white truncate px-1.5 drop-shadow-sm">
                {stage.name} ({stage.dealCount})
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const { organizationId, role, isLoaded } = useSession()

  const [pipeline, setPipeline] = useState<PipelineData | null>(null)
  const [stages, setStages] = useState<StageData[]>([])
  const [loading, setLoading] = useState(true)

  // Add stage dialog
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState("")
  const [addColor, setAddColor] = useState("#6366f1")
  const [addLoading, setAddLoading] = useState(false)

  // Edit stage dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editStage, setEditStage] = useState<StageData | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  const isAdmin = role === "admin"

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const fetchPipeline = useCallback(async () => {
    if (!organizationId) return

    setLoading(true)
    try {
      const data = await getPipeline(organizationId)
      if (data) {
        setPipeline(data)
        setStages(data.stages)
      }
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (isLoaded && organizationId) {
      fetchPipeline()
    }
  }, [isLoaded, organizationId, fetchPipeline])

  async function handleAddStage(e: React.FormEvent) {
    e.preventDefault()
    if (!pipeline) return

    setAddLoading(true)
    try {
      await createStage({
        pipelineId: pipeline.id,
        name: addName,
        color: addColor,
      })
      setAddName("")
      setAddColor("#6366f1")
      setAddOpen(false)
      fetchPipeline()
    } catch {
      // Silently handle errors
    } finally {
      setAddLoading(false)
    }
  }

  function openEdit(stage: StageData) {
    setEditStage(stage)
    setEditName(stage.name)
    setEditColor(stage.color)
    setEditOpen(true)
  }

  async function handleEditStage(e: React.FormEvent) {
    e.preventDefault()
    if (!editStage) return

    setEditLoading(true)
    try {
      await updateStage(editStage.id, {
        name: editName,
        color: editColor,
      })
      setEditOpen(false)
      setEditStage(null)
      fetchPipeline()
    } catch {
      // Silently handle errors
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteStage(id)
      fetchPipeline()
    } catch {
      // Silently handle errors
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !pipeline) return

    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(stages, oldIndex, newIndex)
    setStages(reordered)

    try {
      await reorderStages(
        pipeline.id,
        reordered.map((s) => s.id)
      )
    } catch {
      // Revert on failure
      fetchPipeline()
    }
  }

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div data-arcy="pipeline-page" className="space-y-6">
        {/* Overview skeleton */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="h-8 w-48 animate-pulse rounded bg-muted mb-4" />
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-7 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
        {/* Stage cards skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
        {/* Health bar skeleton */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="h-3 w-24 animate-pulse rounded bg-muted mb-4" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div
        data-arcy="pipeline-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">
          Please sign in and select an organization.
        </p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div
        data-arcy="pipeline-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">
          Only admins can manage pipeline settings.
        </p>
      </div>
    )
  }

  return (
    <div data-arcy="pipeline-page" className="space-y-6">
      {/* Section 1: Pipeline Overview Card */}
      <div
        data-arcy="pipeline-overview"
        className="rounded-lg border bg-card p-6 shadow-sm"
      >
        <h2 className="font-[family-name:var(--font-display)] text-[28px] tracking-tight mb-4">
          {pipeline?.name ?? "Pipeline"}
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Stages
            </p>
            <p className="font-[family-name:var(--font-display)] text-[24px] tracking-tight mt-1">
              {pipeline?.totalStages ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Active Deals
            </p>
            <p className="font-[family-name:var(--font-display)] text-[24px] tracking-tight mt-1">
              {pipeline?.totalDeals ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pipeline Value
            </p>
            <p className="font-[family-name:var(--font-display)] text-[24px] tracking-tight mt-1 font-mono text-green-600">
              {formatCurrency(pipeline?.totalValue ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Stage Cards */}
      <div data-arcy="stages-section">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Stages
          </p>
          <p className="text-[13px] text-muted-foreground">
            Drag to reorder
          </p>
        </div>

        {stages.length === 0 ? (
          <div className="rounded-lg border bg-card py-16 text-center shadow-sm">
            <p className="text-[15px] text-muted-foreground">
              No stages configured. Add your first stage to get started.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div data-arcy="stages-list" className="space-y-2">
                {stages.map((stage) => (
                  <SortableStageItem
                    key={stage.id}
                    stage={stage}
                    canEdit={isAdmin}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Section 3: Stage Health Summary */}
      {stages.length > 0 && <StageHealthBar stages={stages} />}

      {/* Section 4: Add Stage */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger
          render={
            <Button data-arcy="add-stage-button" size="lg" className="w-full">
              <Plus className="mr-2 size-4" />
              Add Stage
            </Button>
          }
        />
        <DialogContent data-arcy="add-stage-form">
          <DialogHeader>
            <DialogTitle>Add Stage</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stage-name">Stage Name</Label>
              <Input
                id="stage-name"
                data-arcy="stage-name-input"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Qualification"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-color">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="stage-color"
                  data-arcy="stage-color-input"
                  type="color"
                  value={addColor}
                  onChange={(e) => setAddColor(e.target.value)}
                  className="h-8 w-16 cursor-pointer p-1"
                />
                <Input
                  value={addColor}
                  onChange={(e) => setAddColor(e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                data-arcy="stage-submit-button"
                disabled={addLoading || !addName.trim()}
              >
                {addLoading ? "Adding..." : "Add Stage"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit stage dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent data-arcy="edit-stage-form">
          <DialogHeader>
            <DialogTitle>Edit Stage</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-stage-name">Stage Name</Label>
              <Input
                id="edit-stage-name"
                data-arcy="edit-stage-name-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stage-color">Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="edit-stage-color"
                  data-arcy="edit-stage-color-input"
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="h-8 w-16 cursor-pointer p-1"
                />
                <Input
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                data-arcy="edit-stage-submit-button"
                disabled={editLoading || !editName.trim()}
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
