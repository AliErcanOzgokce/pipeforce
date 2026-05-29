"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "@/auth/use-session"
import {
  getContact,
  updateContact,
  deleteContact,
} from "@/lib/api/contacts"
import { getCompanies } from "@/lib/api/companies"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"

type ContactDetail = Awaited<ReturnType<typeof getContact>>
type Company = Awaited<ReturnType<typeof getCompanies>>[number]

const STATUS_OPTIONS = ["PROSPECT", "ACTIVE", "CUSTOMER", "CHURNED"] as const

const statusColors: Record<string, { bg: string; text: string }> = {
  PROSPECT: { bg: "bg-blue-50", text: "text-blue-700" },
  ACTIVE: { bg: "bg-green-50", text: "text-green-700" },
  CUSTOMER: { bg: "bg-purple-50", text: "text-purple-700" },
  CHURNED: { bg: "bg-stone-100", text: "text-stone-600" },
}

const activityTypeColors: Record<string, { bg: string; text: string }> = {
  CALL: { bg: "bg-green-100", text: "text-green-700" },
  EMAIL: { bg: "bg-blue-100", text: "text-blue-700" },
  MEETING: { bg: "bg-purple-100", text: "text-purple-700" },
  TASK: { bg: "bg-amber-100", text: "text-amber-700" },
  NOTE: { bg: "bg-gray-100", text: "text-gray-700" },
}

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { organizationId, role, isLoaded } = useSession()

  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("PROSPECT")
  const [companyId, setCompanyId] = useState("")

  const contactId = params.id as string

  const fetchData = useCallback(async () => {
    if (!contactId || !organizationId) return

    setLoading(true)
    try {
      const [contactData, companiesData] = await Promise.all([
        getContact(contactId),
        getCompanies(organizationId),
      ])
      setContact(contactData)
      setCompanies(companiesData)
    } catch {
      router.push("/contacts")
    } finally {
      setLoading(false)
    }
  }, [contactId, organizationId, router])

  useEffect(() => {
    if (isLoaded && organizationId) {
      fetchData()
    }
  }, [isLoaded, organizationId, fetchData])

  const populateEditForm = () => {
    if (!contact) return
    setFirstName(contact.firstName)
    setLastName(contact.lastName)
    setEmail(contact.email ?? "")
    setPhone(contact.phone ?? "")
    setStatus(contact.status as (typeof STATUS_OPTIONS)[number])
    setCompanyId(contact.companyId ?? "")
  }

  const handleUpdate = async () => {
    if (!contact) return

    setSaving(true)
    try {
      await updateContact(contact.id, {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        status,
        companyId: companyId || null,
      })
      setEditOpen(false)
      fetchData()
    } catch {
      // Silently handle errors for now
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!contact) return

    setDeleting(true)
    try {
      await deleteContact(contact.id)
      router.push("/contacts")
    } catch {
      // Silently handle errors for now
      setDeleting(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div data-arcy="contact-detail-page" className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="skeleton h-8 w-8 rounded-md" />
            <div>
              <div className="flex items-center gap-3">
                <div className="skeleton h-8 w-48 rounded-md" />
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
              <div className="skeleton mt-2 h-4 w-56 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="skeleton h-9 w-20 rounded-md" />
            <div className="skeleton h-9 w-20 rounded-md" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card border rounded-lg shadow-sm p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton h-3 w-16 rounded mb-1" />
                <div className="skeleton h-4 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!organizationId || !contact) {
    return (
      <div data-arcy="contact-detail-page" className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground text-[15px]">Contact not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/contacts")}
        >
          <ArrowLeft className="mr-1 size-4" />
          Back to Contacts
        </Button>
      </div>
    )
  }

  const canEdit = role !== "viewer"
  const contactStatusColors = statusColors[contact.status] ?? { bg: "bg-stone-100", text: "text-stone-600" }

  return (
    <div data-arcy="contact-detail-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            data-arcy="contact-back-button"
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/contacts")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-[family-name:var(--font-display)] text-[28px] tracking-tight">
                {contact.firstName} {contact.lastName}
              </h2>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${contactStatusColors.bg} ${contactStatusColors.text}`}>
                {contact.status.charAt(0) +
                  contact.status.slice(1).toLowerCase()}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground">
              Contact details and related records
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Dialog
              open={editOpen}
              onOpenChange={(open) => {
                setEditOpen(open)
                if (open) populateEditForm()
              }}
            >
              <DialogTrigger
                render={
                  <Button data-arcy="edit-contact-button" variant="outline">
                    <Pencil className="mr-1 size-4" />
                    Edit
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Contact</DialogTitle>
                  <DialogDescription>
                    Update contact information.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstName">First Name *</Label>
                      <Input
                        data-arcy="edit-contact-first-name-input"
                        id="edit-firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lastName">Last Name *</Label>
                      <Input
                        data-arcy="edit-contact-last-name-input"
                        id="edit-lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      data-arcy="edit-contact-email-input"
                      id="edit-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      data-arcy="edit-contact-phone-input"
                      id="edit-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={status}
                      onValueChange={(val) =>
                        setStatus(val as (typeof STATUS_OPTIONS)[number])
                      }
                    >
                      <SelectTrigger
                        data-arcy="edit-contact-status-select"
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Select
                      value={companyId}
                      onValueChange={(v) => setCompanyId(v ?? "")}
                    >
                      <SelectTrigger
                        data-arcy="edit-contact-company-select"
                        className="w-full"
                      >
                        <SelectValue placeholder="Select company (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    data-arcy="edit-contact-submit-button"
                    onClick={handleUpdate}
                    disabled={saving || !firstName.trim() || !lastName.trim()}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger
                render={
                  <Button data-arcy="delete-contact-button" variant="destructive">
                    <Trash2 className="mr-1 size-4" />
                    Delete
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Contact</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {contact.firstName}{" "}
                    {contact.lastName}? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                    data-arcy="cancel-delete-contact-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-arcy="confirm-delete-contact-button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-[16px] font-semibold">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-[12px] uppercase tracking-[0.04em] font-medium text-muted-foreground">Email</dt>
                <dd className="text-[15px] mt-0.5">
                  {contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-primary underline underline-offset-2"
                    >
                      {contact.email}
                    </a>
                  ) : (
                    "\u2014"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.04em] font-medium text-muted-foreground">Phone</dt>
                <dd className="text-[15px] mt-0.5">{contact.phone ?? "\u2014"}</dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.04em] font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${contactStatusColors.bg} ${contactStatusColors.text}`}>
                    {contact.status.charAt(0) +
                      contact.status.slice(1).toLowerCase()}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.04em] font-medium text-muted-foreground">Company</dt>
                <dd className="text-[15px] mt-0.5">
                  {contact.company ? (
                    <button
                      className="text-primary underline underline-offset-2"
                      onClick={() =>
                        router.push(`/companies/${contact.company!.id}`)
                      }
                      data-arcy="contact-company-link"
                    >
                      {contact.company.name}
                    </button>
                  ) : (
                    "\u2014"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.04em] font-medium text-muted-foreground">Created</dt>
                <dd className="text-[15px] mt-0.5">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Related Deals */}
      <Card className="bg-card border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-[16px] font-semibold">
            Deals ({contact.deals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contact.deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-[15px] text-muted-foreground">
                No deals associated with this contact.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Value</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Stage</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Owner</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contact.deals.map((deal) => (
                  <TableRow
                    key={deal.id}
                    data-arcy={`contact-deal-row-${deal.id}`}
                    className="cursor-pointer hover:bg-muted/50 transition-colors duration-100"
                    onClick={() => router.push(`/deals`)}
                  >
                    <TableCell className="font-medium text-[15px]">{deal.title}</TableCell>
                    <TableCell className="font-mono text-green-600">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: deal.currency,
                      }).format(Number(deal.value))}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        {deal.stage.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-[15px]">{deal.owner.name ?? "\u2014"}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Activities */}
      <Card className="bg-card border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-[16px] font-semibold">
            Activities ({contact.activities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contact.activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-[15px] text-muted-foreground">
                No activities recorded for this contact.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Created By</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contact.activities.map((activity) => {
                  const typeColors = activityTypeColors[activity.type] ?? { bg: "bg-gray-100", text: "text-gray-700" }
                  return (
                    <TableRow
                      key={activity.id}
                      data-arcy={`contact-activity-row-${activity.id}`}
                      className="hover:bg-muted/50 transition-colors duration-100"
                    >
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors.bg} ${typeColors.text}`}>
                          {activity.type.charAt(0) +
                            activity.type.slice(1).toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-[15px]">
                        {activity.title}
                      </TableCell>
                      <TableCell className="text-[15px]">
                        {activity.createdBy.name ?? "\u2014"}
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
