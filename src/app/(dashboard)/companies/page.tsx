"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useAuthOrganization } from "@/auth/hooks"
import {
  getCompanies,
  createCompany,
} from "@/lib/api/companies"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Search } from "lucide-react"

type CompanyWithCounts = Awaited<ReturnType<typeof getCompanies>>[number]

export default function CompaniesPage() {
  const router = useRouter()
  const { user, isLoaded: authLoaded } = useAuth()
  const { organization, isLoaded: orgLoaded } = useAuthOrganization()

  const [companies, setCompanies] = useState<CompanyWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [industry, setIndustry] = useState("")
  const [size, setSize] = useState("")
  const [website, setWebsite] = useState("")

  const isLoaded = authLoaded && orgLoaded

  const fetchData = useCallback(
    async (searchTerm?: string) => {
      if (!organization?.id) return

      setLoading(true)
      try {
        const companiesData = await getCompanies(organization.id, searchTerm)
        setCompanies(companiesData)
      } catch {
        // Silently handle errors for now
      } finally {
        setLoading(false)
      }
    },
    [organization?.id]
  )

  useEffect(() => {
    if (isLoaded && organization?.id) {
      fetchData(search)
    }
  }, [isLoaded, organization?.id, fetchData, search])

  const resetForm = () => {
    setName("")
    setIndustry("")
    setSize("")
    setWebsite("")
  }

  const handleCreate = async () => {
    if (!organization?.id) return

    setCreating(true)
    try {
      await createCompany({
        organizationId: organization.id,
        name,
        industry: industry || null,
        size: size || null,
        website: website || null,
      })
      setDialogOpen(false)
      resetForm()
      fetchData(search)
    } catch {
      // Silently handle errors for now
    } finally {
      setCreating(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div data-arcy="companies-page" className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading companies...</p>
      </div>
    )
  }

  if (!user || !organization) {
    return (
      <div data-arcy="companies-page" className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">
          Please sign in and select an organization.
        </p>
      </div>
    )
  }

  const canEdit = user.role !== "viewer"

  return (
    <div data-arcy="companies-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Companies</h2>
          <p className="text-sm text-muted-foreground">
            {companies.length} compan{companies.length !== 1 ? "ies" : "y"} in
            your organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-arcy="companies-search-input"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={
                  <Button data-arcy="create-company-button">
                    <Plus className="mr-1 size-4" />
                    Add Company
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Company</DialogTitle>
                  <DialogDescription>
                    Add a new company to your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      data-arcy="company-name-input"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      data-arcy="company-industry-input"
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Technology"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input
                      data-arcy="company-size-input"
                      id="size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="50-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      data-arcy="company-website-input"
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    data-arcy="company-submit-button"
                    onClick={handleCreate}
                    disabled={creating || !name.trim()}
                  >
                    {creating ? "Creating..." : "Create Company"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Deals</TableHead>
              <TableHead>Website</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">
                    {search
                      ? "No companies match your search."
                      : "No companies yet."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow
                  key={company.id}
                  data-arcy={`company-row-${company.id}`}
                  className="cursor-pointer"
                  onClick={() => router.push(`/companies/${company.id}`)}
                >
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.industry ?? "—"}</TableCell>
                  <TableCell>{company.size ?? "—"}</TableCell>
                  <TableCell>{company._count.contacts}</TableCell>
                  <TableCell>{company._count.deals}</TableCell>
                  <TableCell>
                    {company.website ? (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
