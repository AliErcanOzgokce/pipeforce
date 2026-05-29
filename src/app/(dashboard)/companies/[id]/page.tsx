"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "@/auth/use-session"
import {
  getCompany,
  updateCompany,
  deleteCompany,
} from "@/lib/api/companies"
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
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"

type CompanyDetail = Awaited<ReturnType<typeof getCompany>>

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PROSPECT: "outline",
  ACTIVE: "default",
  CUSTOMER: "secondary",
  CHURNED: "destructive",
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { organizationId, role, isLoaded } = useSession()

  const [company, setCompany] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit form state
  const [name, setName] = useState("")
  const [industry, setIndustry] = useState("")
  const [size, setSize] = useState("")
  const [website, setWebsite] = useState("")

  const companyId = params.id as string

  const fetchData = useCallback(async () => {
    if (!companyId) return

    setLoading(true)
    try {
      const companyData = await getCompany(companyId)
      setCompany(companyData)
    } catch {
      router.push("/companies")
    } finally {
      setLoading(false)
    }
  }, [companyId, router])

  useEffect(() => {
    if (isLoaded && organizationId) {
      fetchData()
    }
  }, [isLoaded, organizationId, fetchData])

  const populateEditForm = () => {
    if (!company) return
    setName(company.name)
    setIndustry(company.industry ?? "")
    setSize(company.size ?? "")
    setWebsite(company.website ?? "")
  }

  const handleUpdate = async () => {
    if (!company) return

    setSaving(true)
    try {
      await updateCompany(company.id, {
        name,
        industry: industry || null,
        size: size || null,
        website: website || null,
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
    if (!company) return

    setDeleting(true)
    try {
      await deleteCompany(company.id)
      router.push("/companies")
    } catch {
      // Silently handle errors for now
      setDeleting(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div data-arcy="company-detail-page" className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading company...</p>
      </div>
    )
  }

  if (!organizationId || !company) {
    return (
      <div data-arcy="company-detail-page" className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Company not found.</p>
      </div>
    )
  }

  const canEdit = role !== "viewer"

  return (
    <div data-arcy="company-detail-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            data-arcy="company-back-button"
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/companies")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {company.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Company details and related records
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
                  <Button data-arcy="edit-company-button" variant="outline">
                    <Pencil className="mr-1 size-4" />
                    Edit
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Company</DialogTitle>
                  <DialogDescription>
                    Update company information.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Company Name *</Label>
                    <Input
                      data-arcy="edit-company-name-input"
                      id="edit-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-industry">Industry</Label>
                    <Input
                      data-arcy="edit-company-industry-input"
                      id="edit-industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-size">Size</Label>
                    <Input
                      data-arcy="edit-company-size-input"
                      id="edit-size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-website">Website</Label>
                    <Input
                      data-arcy="edit-company-website-input"
                      id="edit-website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    data-arcy="edit-company-submit-button"
                    onClick={handleUpdate}
                    disabled={saving || !name.trim()}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger
                render={
                  <Button data-arcy="delete-company-button" variant="destructive">
                    <Trash2 className="mr-1 size-4" />
                    Delete
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Company</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {company.name}? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteOpen(false)}
                    data-arcy="cancel-delete-company-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-arcy="confirm-delete-company-button"
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

      {/* Company Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">Industry</dt>
                <dd className="text-sm font-medium">
                  {company.industry ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Size</dt>
                <dd className="text-sm font-medium">{company.size ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Website</dt>
                <dd className="text-sm font-medium">
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      {company.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Created</dt>
                <dd className="text-sm font-medium">
                  {new Date(company.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">
                  Total Contacts
                </dt>
                <dd className="text-2xl font-bold">
                  {company._count.contacts}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Total Deals</dt>
                <dd className="text-2xl font-bold">{company._count.deals}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Contacts ({company.contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No contacts associated with this company.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    data-arcy={`company-contact-row-${contact.id}`}
                    className="cursor-pointer"
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                  >
                    <TableCell className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </TableCell>
                    <TableCell>{contact.email ?? "—"}</TableCell>
                    <TableCell>{contact.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant[contact.status] ?? "outline"}
                      >
                        {contact.status.charAt(0) +
                          contact.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Deals List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Deals ({company.deals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.deals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No deals associated with this company.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.deals.map((deal) => (
                  <TableRow
                    key={deal.id}
                    data-arcy={`company-deal-row-${deal.id}`}
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
                    <TableCell>
                      {deal.contact
                        ? `${deal.contact.firstName} ${deal.contact.lastName}`
                        : "—"}
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
    </div>
  )
}
