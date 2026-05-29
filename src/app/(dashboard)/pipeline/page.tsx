"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth, useAuthOrganization } from "@/auth/hooks"
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
import { Card, CardContent } from "@/components/ui/card"
import { Plus, GripVertical, Pencil, Trash2 } from "lucide-react"

interface StageData {
  id: string
  name: string
  color: string
  order: number
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
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-arcy={`stage-item-${stage.id}`}
      className="flex items-center gap-3 rounded-lg border bg-card p-3"
    >
      {canEdit && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          data-arcy={`stage-drag-handle-${stage.id}`}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <div
        className="size-4 shrink-0 rounded"
        style={{ backgroundColor: stage.color }}
      />
      <span className="flex-1 font-medium">{stage.name}</span>
      {canEdit && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            data-arcy={`edit-stage-${stage.id}`}
            onClick={() => onEdit(stage)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            data-arcy={`delete-stage-${stage.id}`}
            onClick={() => onDelete(stage.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function PipelinePage() {
  const { user, isLoaded: authLoaded } = useAuth()
  const { organization, isLoaded: orgLoaded } = useAuthOrganization()

  const [stages, setStages] = useState<StageData[]>([])
  const [pipelineId, setPipelineId] = useState<string | null>(null)
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

  const isLoaded = authLoaded && orgLoaded
  const isAdmin = user?.role === "admin"

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const fetchPipeline = useCallback(async () => {
    if (!organization?.id) return

    setLoading(true)
    try {
      const pipeline = await getPipeline(organization.id)
      if (pipeline) {
        setPipelineId(pipeline.id)
        setStages(
          pipeline.stages.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            order: s.order,
          }))
        )
      }
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false)
    }
  }, [organization?.id])

  useEffect(() => {
    if (isLoaded && organization?.id) {
      fetchPipeline()
    }
  }, [isLoaded, organization?.id, fetchPipeline])

  async function handleAddStage(e: React.FormEvent) {
    e.preventDefault()
    if (!pipelineId) return

    setAddLoading(true)
    try {
      await createStage({
        pipelineId,
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
    if (!over || active.id === over.id || !pipelineId) return

    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(stages, oldIndex, newIndex)
    setStages(reordered)

    try {
      await reorderStages(
        pipelineId,
        reordered.map((s) => s.id)
      )
    } catch {
      // Revert on failure
      fetchPipeline()
    }
  }

  if (!isLoaded || loading) {
    return (
      <div
        data-arcy="pipeline-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">Loading pipeline settings...</p>
      </div>
    )
  }

  if (!user || !organization) {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Pipeline Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure your pipeline stages. Drag to reorder.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button data-arcy="add-stage-button">
                <Plus className="mr-1 size-4" />
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
                    className="flex-1"
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
      </div>

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
                  className="flex-1"
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

      {/* Stages list with drag-and-drop */}
      <Card>
        <CardContent>
          {stages.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No stages configured. Add your first stage to get started.
            </p>
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
        </CardContent>
      </Card>
    </div>
  )
}
