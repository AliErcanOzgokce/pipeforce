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

const statusColors: Record<string, { bg: string; text: string }> = {
  PROSPECT: { bg: "bg-blue-50", text: "text-blue-700" },
  ACTIVE: { bg: "bg-green-50", text: "text-green-700" },
  CUSTOMER: { bg: "bg-purple-50", text: "text-purple-700" },
  CHURNED: { bg: "bg-stone-100", text: "text-stone-600" },
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
      <div data-arcy="company-detail-page" className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="skeleton h-8 w-8 rounded-md" />
            <div>
              <div className="skeleton h-8 w-48 rounded-md" />
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton h-3 w-16 rounded mb-1" />
                <div className="skeleton h-4 w-32 rounded" />
              </div>
            ))}
          </div>
          <div className="bg-card border rounded-lg shadow-sm p-6 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton h-3 w-24 rounded mb-1" />
                <div className="skeleton h-7 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!organizationId || !company) {
    return (
      <div data-arcy="company-detail-page" className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground text-[15px]">Company not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/companies")}
        >
          <ArrowLeft className="mr-1 size-4" />
          Back to Companies
        </Button>
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
            <h2 className="font-[family-name:var(--font-display)] text-[28px] tracking-tight">
              {company.name}
            </h2>
            <p className="text-[13px] text-muted-foreground">
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
        <Card className="bg-card border rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-[16px] font-semibold">Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-[12px] uppercase tracking-[0.04em] font-medium text-muted-foreground">Industry</dt>
                <dd className="text-[15px] mt-0.5">
                  {company.industry ?? "\u2014"}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.04em] font-medium text-muted-foreground">Size</dt>
                <dd className="text-[15px] mt-0.5">{company.size ?? "\u2014"}</dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.04em] font-medium text-muted-foreground">Website</dt>
                <dd className="text-[15px] mt-0.5">
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
                    "\u2014"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.04em] font-medium text-muted-foreground">Created</dt>
                <dd className="text-[15px] mt-0.5">
                  {new Date(company.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="bg-card border rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-[16px] font-semibold">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-[12px] uppercase tracking-[0.04em] font-medium text-muted-foreground">
                  Total Contacts
                </dt>
                <dd className="font-[family-name:var(--font-display)] text-[28px] tracking-tight mt-0.5">
                  {company._count.contacts}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] uppercase tracking-[0.04em] font-medium text-muted-foreground">Total Deals</dt>
                <dd className="font-[family-name:var(--font-display)] text-[28px] tracking-tight mt-0.5">
                  {company._count.deals}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Contacts List */}
      <Card className="bg-card border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-[16px] font-semibold">
            Contacts ({company.contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-[15px] text-muted-foreground">
                No contacts associated with this company.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Email</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.contacts.map((contact) => {
                  const colors = statusColors[contact.status] ?? { bg: "bg-stone-100", text: "text-stone-600" }
                  return (
                    <TableRow
                      key={contact.id}
                      data-arcy={`company-contact-row-${contact.id}`}
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-100"
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                    >
                      <TableCell className="font-medium text-[15px]">
                        {contact.firstName} {contact.lastName}
                      </TableCell>
                      <TableCell className="text-[15px]">{contact.email ?? "\u2014"}</TableCell>
                      <TableCell className="text-[15px]">{contact.phone ?? "\u2014"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {contact.status.charAt(0) +
                            contact.status.slice(1).toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Deals List */}
      <Card className="bg-card border rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-[16px] font-semibold">
            Deals ({company.deals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-[15px] text-muted-foreground">
                No deals associated with this company.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Title</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Value</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Stage</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Contact</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Owner</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.deals.map((deal) => (
                  <TableRow
                    key={deal.id}
                    data-arcy={`company-deal-row-${deal.id}`}
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
                    <TableCell className="text-[15px]">
                      {deal.contact
                        ? `${deal.contact.firstName} ${deal.contact.lastName}`
                        : "\u2014"}
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
    </div>
  )
}
