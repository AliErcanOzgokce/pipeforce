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

const activityTypeColors: Record<string, { bg: string; text: string; iconBg: string; iconText: string }> = {
  CALL: { bg: "bg-green-50", text: "text-green-700", iconBg: "bg-green-100", iconText: "text-green-700" },
  EMAIL: { bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-100", iconText: "text-blue-700" },
  MEETING: { bg: "bg-purple-50", text: "text-purple-700", iconBg: "bg-purple-100", iconText: "text-purple-700" },
  TASK: { bg: "bg-amber-50", text: "text-amber-700", iconBg: "bg-amber-100", iconText: "text-amber-700" },
  NOTE: { bg: "bg-gray-50", text: "text-gray-700", iconBg: "bg-gray-100", iconText: "text-gray-700" },
}

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
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-32 rounded-md" />
            <div className="skeleton mt-2 h-4 w-24 rounded-md" />
          </div>
          <div className="skeleton h-9 w-32 rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="relative pl-8 space-y-4">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="skeleton h-8 w-8 rounded-full shrink-0" />
              <div className="bg-card border rounded-lg shadow-sm p-4 flex-1 space-y-2">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-64 rounded" />
                <div className="flex gap-3">
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!organizationId || !memberId) {
    return (
      <div
        data-arcy="activities-page"
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <p className="text-muted-foreground text-[15px]">
          Please sign in and select an organization.
        </p>
      </div>
    )
  }

  return (
    <div data-arcy="activities-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[28px] tracking-tight">
            Activities
          </h2>
          <p className="text-[13px] text-muted-foreground">
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

      {/* Type filter pill buttons */}
      <div data-arcy="activity-type-filters" className="flex flex-wrap gap-2">
        <button
          className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-100 ${
            typeFilter === null
              ? "bg-primary text-white"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
          onClick={() => setTypeFilter(null)}
          data-arcy="filter-all"
        >
          All
        </button>
        {ACTIVITY_TYPES.map((t) => {
          const Icon = t.icon
          const isActive = typeFilter === t.value
          return (
            <button
              key={t.value}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-100 ${
                isActive
                  ? "bg-primary text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
              onClick={() =>
                setTypeFilter(typeFilter === t.value ? null : t.value)
              }
              data-arcy={`filter-${t.value.toLowerCase()}`}
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Activity timeline */}
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-[15px]">No activities found.</p>
          {canEdit && (
            <Button
              size="sm"
              className="mt-4"
              onClick={() => setOpen(true)}
            >
              <Plus className="mr-1 size-4" />
              Log your first activity
            </Button>
          )}
        </div>
      ) : (
        <div data-arcy="activity-list" className="relative pl-8">
          {/* Vertical timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              const colors = activityTypeColors[activity.type] ?? activityTypeColors.NOTE
              return (
                <div
                  key={activity.id}
                  data-arcy={`activity-item-${activity.id}`}
                  className="relative flex items-start gap-4"
                >
                  {/* Timeline dot / icon */}
                  <div className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${colors.iconBg} -ml-8`}>
                    <Icon className={`size-4 ${colors.iconText}`} />
                  </div>

                  {/* Activity card */}
                  <div className="flex-1 bg-card border rounded-lg shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[15px]">{activity.title}</p>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                            {activity.type.charAt(0) +
                              activity.type.slice(1).toLowerCase()}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="mt-1 text-[13px] text-muted-foreground">
                            {activity.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
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
                          className="text-muted-foreground hover:text-destructive"
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
        </div>
      )}
    </div>
  )
}
