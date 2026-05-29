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
import { Badge } from "@/components/ui/badge"
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

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PROSPECT: "outline",
  ACTIVE: "default",
  CUSTOMER: "secondary",
  CHURNED: "destructive",
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
      <div data-arcy="contact-detail-page" className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading contact...</p>
      </div>
    )
  }

  if (!organizationId || !contact) {
    return (
      <div data-arcy="contact-detail-page" className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Contact not found.</p>
      </div>
    )
  }

  const canEdit = role !== "viewer"

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
              <h2 className="text-2xl font-bold tracking-tight">
                {contact.firstName} {contact.lastName}
              </h2>
              <Badge variant={statusVariant[contact.status] ?? "outline"}>
                {contact.status.charAt(0) +
                  contact.status.slice(1).toLowerCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
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
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="text-sm font-medium">
                  {contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-primary underline underline-offset-2"
                    >
                      {contact.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Phone</dt>
                <dd className="text-sm font-medium">{contact.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Status</dt>
                <dd className="text-sm">
                  <Badge variant={statusVariant[contact.status] ?? "outline"}>
                    {contact.status.charAt(0) +
                      contact.status.slice(1).toLowerCase()}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Company</dt>
                <dd className="text-sm font-medium">
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
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Created</dt>
                <dd className="text-sm font-medium">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Related Deals */}
      <Card>
        <CardHeader>
          <CardTitle>
            Deals ({contact.deals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contact.deals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No deals associated with this contact.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contact.deals.map((deal) => (
                  <TableRow
                    key={deal.id}
                    data-arcy={`contact-deal-row-${deal.id}`}
                    className="cursor-pointer"
                    onClick={() => router.push(`/deals`)}
                  >
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: deal.currency,
                      }).format(Number(deal.value))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{deal.stage.name}</Badge>
                    </TableCell>
                    <TableCell>{deal.owner.name ?? "—"}</TableCell>
                    <TableCell>
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
      <Card>
        <CardHeader>
          <CardTitle>
            Activities ({contact.activities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contact.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No activities recorded for this contact.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contact.activities.map((activity) => (
                  <TableRow
                    key={activity.id}
                    data-arcy={`contact-activity-row-${activity.id}`}
                  >
                    <TableCell>
                      <Badge variant="outline">
                        {activity.type.charAt(0) +
                          activity.type.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {activity.title}
                    </TableCell>
                    <TableCell>
                      {activity.createdBy.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
