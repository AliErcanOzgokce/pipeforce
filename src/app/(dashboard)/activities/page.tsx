"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "@/auth/use-session"
import {
  getActivities,
  createActivity,
  deleteActivity,
} from "@/lib/api/activities"
import { getDeals, getContacts } from "@/lib/api/deals"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  StickyNote,
  Trash2,
} from "lucide-react"

type Activity = Awaited<ReturnType<typeof getActivities>>[number]

const ACTIVITY_TYPES = [
  { value: "CALL", label: "Call", icon: Phone },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "MEETING", label: "Meeting", icon: Calendar },
  { value: "TASK", label: "Task", icon: CheckSquare },
  { value: "NOTE", label: "Note", icon: StickyNote },
] as const

function getActivityIcon(type: string) {
  const found = ACTIVITY_TYPES.find((t) => t.value === type)
  if (!found) return StickyNote
  return found.icon
}

function formatTimestamp(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function ActivitiesPage() {
  const { organizationId, memberId, role, isLoaded } = useSession()

  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  // Form state
  const [open, setOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [type, setType] = useState("")
  const [description, setDescription] = useState("")
  const [dealId, setDealId] = useState("")
  const [contactId, setContactId] = useState("")
  const [dueDate, setDueDate] = useState("")

  // Related data for the form
  const [deals, setDeals] = useState<{ id: string; title: string }[]>([])
  const [contacts, setContacts] = useState<
    { id: string; firstName: string; lastName: string }[]
  >([])

  const canEdit = role !== "viewer"

  const fetchActivities = useCallback(async () => {
    if (!organizationId || !memberId) return

    setLoading(true)
    try {
      const filters: { type?: string; createdById?: string } = {}
      if (typeFilter) filters.type = typeFilter
      if (role === "sales_rep") filters.createdById = memberId

      const data = await getActivities(organizationId, filters)
      setActivities(data)
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false)
    }
  }, [organizationId, memberId, role, typeFilter])

  const fetchFormData = useCallback(async () => {
    if (!organizationId) return
    try {
      const [dealsData, contactsData] = await Promise.all([
        getDeals(organizationId),
        getContacts(organizationId),
      ])
      setDeals(dealsData.map((d) => ({ id: d.id, title: d.title })))
      setContacts(
        contactsData.map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
        }))
      )
    } catch {
      // Silently handle errors
    }
  }, [organizationId])

  useEffect(() => {
    if (isLoaded && organizationId && memberId) {
      fetchActivities()
    }
  }, [isLoaded, organizationId, memberId, fetchActivities])

  useEffect(() => {
    if (open && organizationId) {
      fetchFormData()
    }
  }, [open, organizationId, fetchFormData])

  function resetForm() {
    setTitle("")
    setType("")
    setDescription("")
    setDealId("")
    setContactId("")
    setDueDate("")
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!organizationId || !memberId) return

    setFormLoading(true)
    try {
      await createActivity({
        organizationId,
        type,
        title,
        description: description || null,
        dealId: dealId || null,
        contactId: contactId || null,
        createdById: memberId,
        dueDate: dueDate || null,
      })
      resetForm()
      setOpen(false)
      fetchActivities()
    } catch {
      // Silently handle errors
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteActivity(id)
      fetchActivities()
    } catch {
      // Silently handle errors
    }
  }

  if (!isLoaded || loading) {
    return (
      <div
        data-arcy="activities-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">Loading activities...</p>
      </div>
    )
  }

  if (!organizationId || !memberId) {
    return (
      <div
        data-arcy="activities-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">
          Please sign in and select an organization.
        </p>
      </div>
    )
  }

  return (
    <div data-arcy="activities-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activities</h2>
          <p className="text-sm text-muted-foreground">
            {activities.length} activit{activities.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button data-arcy="create-activity-button">
                  <Plus className="mr-1 size-4" />
                  Add Activity
                </Button>
              }
            />
            <DialogContent
              data-arcy="activity-form"
              className="sm:max-w-lg"
            >
              <DialogHeader>
                <DialogTitle>New Activity</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="activity-type">Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => v && setType(v)}
                    required
                  >
                    <SelectTrigger
                      className="w-full"
                      id="activity-type"
                      data-arcy="activity-type-select"
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity-title">Title</Label>
                  <Input
                    id="activity-title"
                    data-arcy="activity-title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Activity title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity-description">Description</Label>
                  <Textarea
                    id="activity-description"
                    data-arcy="activity-description-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity-deal">Related Deal</Label>
                  <Select
                    value={dealId}
                    onValueChange={(v) => setDealId(v ?? "")}
                  >
                    <SelectTrigger
                      className="w-full"
                      id="activity-deal"
                      data-arcy="activity-deal-select"
                    >
                      <SelectValue placeholder="Select deal (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {deals.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity-contact">Related Contact</Label>
                  <Select
                    value={contactId}
                    onValueChange={(v) => setContactId(v ?? "")}
                  >
                    <SelectTrigger
                      className="w-full"
                      id="activity-contact"
                      data-arcy="activity-contact-select"
                    >
                      <SelectValue placeholder="Select contact (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity-due-date">Due Date</Label>
                  <Input
                    id="activity-due-date"
                    data-arcy="activity-due-date-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    data-arcy="activity-submit-button"
                    disabled={formLoading || !title || !type}
                  >
                    {formLoading ? "Creating..." : "Create Activity"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Type filter buttons */}
      <div data-arcy="activity-type-filters" className="flex flex-wrap gap-2">
        <Button
          variant={typeFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter(null)}
          data-arcy="filter-all"
        >
          All
        </Button>
        {ACTIVITY_TYPES.map((t) => {
          const Icon = t.icon
          return (
            <Button
              key={t.value}
              variant={typeFilter === t.value ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setTypeFilter(typeFilter === t.value ? null : t.value)
              }
              data-arcy={`filter-${t.value.toLowerCase()}`}
            >
              <Icon className="mr-1 size-3.5" />
              {t.label}
            </Button>
          )
        })}
      </div>

      {/* Activity timeline */}
      {activities.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No activities found.</p>
        </div>
      ) : (
        <div data-arcy="activity-list" className="space-y-3">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type)
            return (
              <div
                key={activity.id}
                data-arcy={`activity-item-${activity.id}`}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{activity.title}</p>
                        <Badge variant="secondary">
                          {activity.type.charAt(0) +
                            activity.type.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {activity.deal && (
                          <span>
                            Deal:{" "}
                            <span className="font-medium text-foreground">
                              {activity.deal.title}
                            </span>
                          </span>
                        )}
                        {activity.contact && (
                          <span>
                            Contact:{" "}
                            <span className="font-medium text-foreground">
                              {activity.contact.firstName}{" "}
                              {activity.contact.lastName}
                            </span>
                          </span>
                        )}
                        <span>
                          By:{" "}
                          {activity.createdBy.name ?? activity.createdBy.email}
                        </span>
                        <span>{formatTimestamp(activity.createdAt)}</span>
                      </div>
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        data-arcy={`delete-activity-${activity.id}`}
                        onClick={() => handleDelete(activity.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
