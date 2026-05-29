"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth, useAuthOrganization } from "@/auth/hooks"
import {
  getDeal,
  getStages,
  getContacts,
  getCompanies,
  getMembers,
  getMemberByClerkId,
  updateDealStage,
  deleteDeal,
} from "@/lib/api/deals"
import { getActivities, createActivity, deleteActivity } from "@/lib/api/activities"
import { getNotes, createNote, deleteNote } from "@/lib/api/notes"
import { DealForm } from "@/components/deals/deal-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  ArrowLeft,
  Building2,
  CalendarDays,
  DollarSign,
  Edit,
  Mail,
  Phone as PhoneIcon,
  Plus,
  Trash2,
  User,
} from "lucide-react"

type DealData = NonNullable<Awaited<ReturnType<typeof getDeal>>>
type StageOption = Awaited<ReturnType<typeof getStages>>[number]
type ContactOption = Awaited<ReturnType<typeof getContacts>>[number]
type CompanyOption = Awaited<ReturnType<typeof getCompanies>>[number]
type MemberOption = Awaited<ReturnType<typeof getMembers>>[number]
type ActivityData = Awaited<ReturnType<typeof getActivities>>[number]
type NoteData = Awaited<ReturnType<typeof getNotes>>[number]

const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "TASK", "NOTE"] as const

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
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

function activityTypeColor(type: string) {
  switch (type) {
    case "CALL":
      return "default"
    case "EMAIL":
      return "secondary"
    case "MEETING":
      return "outline"
    case "TASK":
      return "destructive"
    case "NOTE":
      return "secondary"
    default:
      return "default"
  }
}

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string

  const { user, isLoaded: authLoaded } = useAuth()
  const { organization, isLoaded: orgLoaded } = useAuthOrganization()

  const [deal, setDeal] = useState<DealData | null>(null)
  const [stages, setStages] = useState<StageOption[]>([])
  const [contacts, setContacts] = useState<ContactOption[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [memberId, setMemberId] = useState<string | null>(null)
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [notes, setNotes] = useState<NoteData[]>([])
  const [loading, setLoading] = useState(true)
  const [activityFilter, setActivityFilter] = useState<string>("ALL")
  const [deleting, setDeleting] = useState(false)

  // Add activity form state
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [activityTitle, setActivityTitle] = useState("")
  const [activityType, setActivityType] = useState<string>("CALL")
  const [activityDescription, setActivityDescription] = useState("")
  const [activityDueDate, setActivityDueDate] = useState("")
  const [activitySubmitting, setActivitySubmitting] = useState(false)

  // Add note form state
  const [noteContent, setNoteContent] = useState("")
  const [noteSubmitting, setNoteSubmitting] = useState(false)

  const isLoaded = authLoaded && orgLoaded
  const canEdit = user?.role !== "viewer"

  const fetchDeal = useCallback(async () => {
    if (!dealId) return
    try {
      const dealData = await getDeal(dealId)
      if (!dealData) return
      setDeal(dealData)
      setActivities(
        dealData.activities.map((a) => ({
          ...a,
          deal: null,
          contact: null,
        }))
      )
      setNotes(dealData.notes)
    } catch {
      // silently handle
    }
  }, [dealId])

  const fetchReferenceData = useCallback(async () => {
    if (!organization?.id || !user?.id) return
    try {
      const member = await getMemberByClerkId(user.id, organization.id)
      if (member) setMemberId(member.id)

      const [stagesData, contactsData, companiesData, membersData] =
        await Promise.all([
          getStages(organization.id),
          getContacts(organization.id),
          getCompanies(organization.id),
          getMembers(organization.id),
        ])
      setStages(stagesData)
      setContacts(contactsData)
      setCompanies(companiesData)
      setMembers(membersData)
    } catch {
      // silently handle
    }
  }, [organization?.id, user?.id])

  const fetchActivities = useCallback(async () => {
    if (!organization?.id || !dealId) return
    try {
      const filters: { dealId: string; type?: string } = { dealId }
      if (activityFilter !== "ALL") filters.type = activityFilter
      const data = await getActivities(organization.id, filters)
      setActivities(data)
    } catch {
      // silently handle
    }
  }, [organization?.id, dealId, activityFilter])

  const fetchNotes = useCallback(async () => {
    if (!dealId) return
    try {
      const data = await getNotes(dealId)
      setNotes(data)
    } catch {
      // silently handle
    }
  }, [dealId])

  useEffect(() => {
    if (!isLoaded || !organization?.id || !user?.id) return
    setLoading(true)
    Promise.all([fetchDeal(), fetchReferenceData()]).finally(() =>
      setLoading(false)
    )
  }, [isLoaded, organization?.id, user?.id, fetchDeal, fetchReferenceData])

  useEffect(() => {
    if (organization?.id && dealId) {
      fetchActivities()
    }
  }, [organization?.id, dealId, activityFilter, fetchActivities])

  async function handleStageChange(newStageId: string) {
    if (!deal || !newStageId || newStageId === deal.stageId) return
    try {
      await updateDealStage(deal.id, newStageId)
      await fetchDeal()
    } catch {
      // silently handle
    }
  }

  async function handleDelete() {
    if (!deal) return
    setDeleting(true)
    try {
      await deleteDeal(deal.id)
      router.push("/deals")
    } catch {
      setDeleting(false)
    }
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault()
    if (!organization?.id || !memberId) return
    setActivitySubmitting(true)
    try {
      await createActivity({
        organizationId: organization.id,
        dealId,
        createdById: memberId,
        type: activityType,
        title: activityTitle,
        description: activityDescription || null,
        dueDate: activityDueDate || null,
      })
      setActivityTitle("")
      setActivityType("CALL")
      setActivityDescription("")
      setActivityDueDate("")
      setActivityDialogOpen(false)
      await fetchActivities()
    } catch {
      // silently handle
    } finally {
      setActivitySubmitting(false)
    }
  }

  async function handleDeleteActivity(activityId: string) {
    try {
      await deleteActivity(activityId)
      await fetchActivities()
    } catch {
      // silently handle
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteContent.trim()) return
    setNoteSubmitting(true)
    try {
      await createNote({ dealId, content: noteContent })
      setNoteContent("")
      await fetchNotes()
    } catch {
      // silently handle
    } finally {
      setNoteSubmitting(false)
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      await deleteNote(noteId)
      await fetchNotes()
    } catch {
      // silently handle
    }
  }

  if (!isLoaded || loading) {
    return (
      <div
        data-arcy="deal-detail-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">Loading deal...</p>
      </div>
    )
  }

  if (!user || !organization) {
    return (
      <div
        data-arcy="deal-detail-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">
          Please sign in and select an organization.
        </p>
      </div>
    )
  }

  if (!deal) {
    return (
      <div
        data-arcy="deal-detail-page"
        className="flex items-center justify-center py-12"
      >
        <p className="text-muted-foreground">Deal not found.</p>
      </div>
    )
  }

  const serializedDeal = {
    id: deal.id,
    title: deal.title,
    value: Number(deal.value),
    currency: deal.currency,
    stageId: deal.stageId,
    contactId: deal.contactId,
    companyId: deal.companyId,
    ownerId: deal.ownerId,
    expectedCloseDate: deal.expectedCloseDate
      ? deal.expectedCloseDate.toISOString()
      : null,
    description: deal.description,
  }

  const serializedStages = stages.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    order: s.order,
  }))

  return (
    <div data-arcy="deal-detail-page" className="space-y-6">
      {/* Back button */}
      <Button
        data-arcy="back-to-deals"
        variant="ghost"
        size="sm"
        onClick={() => router.push("/deals")}
      >
        <ArrowLeft className="mr-1 size-4" />
        Back to Deals
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{deal.title}</h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-lg text-muted-foreground">
              <DollarSign className="size-4" />
              {formatCurrency(Number(deal.value), deal.currency)}
            </span>
            <Select
              value={deal.stageId}
              onValueChange={canEdit ? (v) => v && handleStageChange(v) : undefined}
              disabled={!canEdit}
            >
              <SelectTrigger
                data-arcy="deal-stage-select"
                className="h-8 w-[180px]"
              >
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem
                    data-arcy={`stage-option-${s.id}`}
                    key={s.id}
                    value={s.id}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <DealForm
              orgId={organization.id}
              stages={serializedStages}
              contacts={contacts.map((c) => ({
                id: c.id,
                firstName: c.firstName,
                lastName: c.lastName,
              }))}
              companies={companies.map((c) => ({ id: c.id, name: c.name }))}
              members={members.map((m) => ({
                id: m.id,
                name: m.name,
                email: m.email,
              }))}
              deal={serializedDeal}
              trigger={
                <Button data-arcy="edit-deal-button" variant="outline" size="sm">
                  <Edit className="mr-1 size-4" />
                  Edit
                </Button>
              }
              onSuccess={fetchDeal}
            />
            <Button
              data-arcy="delete-deal-button"
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
            >
              <Trash2 className="mr-1 size-4" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Info section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Contact</p>
                <p className="text-sm font-medium">
                  {deal.contact
                    ? `${deal.contact.firstName} ${deal.contact.lastName}`
                    : "No contact assigned"}
                </p>
                {deal.contact?.email && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="size-3" />
                    {deal.contact.email}
                  </p>
                )}
                {deal.contact?.phone && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <PhoneIcon className="size-3" />
                    {deal.contact.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="text-sm font-medium">
                  {deal.company?.name ?? "No company assigned"}
                </p>
                {deal.company?.industry && (
                  <p className="text-xs text-muted-foreground">
                    {deal.company.industry}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Expected Close Date
                </p>
                <p className="text-sm font-medium">
                  {deal.expectedCloseDate
                    ? formatDate(deal.expectedCloseDate)
                    : "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Owner &amp; Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar size="default">
                {deal.owner.imageUrl && (
                  <AvatarImage src={deal.owner.imageUrl} />
                )}
                <AvatarFallback>{getInitials(deal.owner.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="text-sm font-medium">
                  {deal.owner.name ?? deal.owner.email}
                </p>
              </div>
            </div>

            {deal.description && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  Description
                </p>
                <p className="text-sm whitespace-pre-wrap">
                  {deal.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity & Notes Tabs */}
      <Tabs defaultValue="activities">
        <TabsList data-arcy="deal-tabs" variant="line">
          <TabsTrigger data-arcy="activities-tab" value="activities">
            Activities ({activities.length})
          </TabsTrigger>
          <TabsTrigger data-arcy="notes-tab" value="notes">
            Notes ({notes.length})
          </TabsTrigger>
        </TabsList>

        {/* Activities Tab */}
        <TabsContent value="activities" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={activityFilter} onValueChange={(v) => v && setActivityFilter(v)}>
              <SelectTrigger
                data-arcy="activity-type-filter"
                className="h-8 w-[160px]"
              >
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {ACTIVITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canEdit && (
              <Dialog
                open={activityDialogOpen}
                onOpenChange={setActivityDialogOpen}
              >
                <DialogTrigger
                  render={
                    <Button
                      data-arcy="add-activity-button"
                      size="sm"
                    />
                  }
                >
                  <Plus className="mr-1 size-4" />
                  Add Activity
                </DialogTrigger>
                <DialogContent
                  data-arcy="add-activity-dialog"
                  className="sm:max-w-md"
                >
                  <DialogHeader>
                    <DialogTitle>Add Activity</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddActivity} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="activity-title">Title</Label>
                      <Input
                        data-arcy="activity-title-input"
                        id="activity-title"
                        value={activityTitle}
                        onChange={(e) => setActivityTitle(e.target.value)}
                        placeholder="Activity title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="activity-type">Type</Label>
                      <Select value={activityType} onValueChange={(v) => v && setActivityType(v)}>
                        <SelectTrigger
                          data-arcy="activity-type-select"
                          className="w-full"
                          id="activity-type"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.charAt(0) + t.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="activity-description">Description</Label>
                      <Textarea
                        data-arcy="activity-description-input"
                        id="activity-description"
                        value={activityDescription}
                        onChange={(e) =>
                          setActivityDescription(e.target.value)
                        }
                        placeholder="Description (optional)"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="activity-due-date">Due Date</Label>
                      <Input
                        data-arcy="activity-due-date-input"
                        id="activity-due-date"
                        type="date"
                        value={activityDueDate}
                        onChange={(e) => setActivityDueDate(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        data-arcy="submit-activity-button"
                        type="submit"
                        disabled={activitySubmitting || !activityTitle}
                      >
                        {activitySubmitting ? "Adding..." : "Add Activity"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {activities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activities yet.
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id} size="sm">
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            data-arcy={`activity-badge-${activity.id}`}
                            variant={activityTypeColor(activity.type) as "default" | "secondary" | "outline" | "destructive"}
                          >
                            {activity.type}
                          </Badge>
                          <span className="text-sm font-medium">
                            {activity.title}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            by {activity.createdBy?.name ?? "Unknown"}
                          </span>
                          <span>{formatDateTime(activity.createdAt)}</span>
                          {activity.dueDate && (
                            <span>Due: {formatDate(activity.dueDate)}</span>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <Button
                          data-arcy={`delete-activity-${activity.id}`}
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteActivity(activity.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4 space-y-4">
          {canEdit && (
            <form
              data-arcy="add-note-form"
              onSubmit={handleAddNote}
              className="flex gap-2"
            >
              <Textarea
                data-arcy="note-content-input"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write a note..."
                rows={2}
                className="flex-1"
              />
              <Button
                data-arcy="submit-note-button"
                type="submit"
                size="sm"
                disabled={noteSubmitting || !noteContent.trim()}
                className="self-end"
              >
                {noteSubmitting ? "Adding..." : "Add"}
              </Button>
            </form>
          )}

          {notes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No notes yet.
            </p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id} size="sm">
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(note.createdAt)}
                        </p>
                      </div>
                      {canEdit && (
                        <Button
                          data-arcy={`delete-note-${note.id}`}
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
