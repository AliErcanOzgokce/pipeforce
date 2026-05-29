"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/auth/use-session"
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
  const { organizationId, role, isLoaded } = useSession()

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

  const fetchData = useCallback(
    async (searchTerm?: string) => {
      if (!organizationId) return

      setLoading(true)
      try {
        const companiesData = await getCompanies(organizationId, searchTerm)
        setCompanies(companiesData)
      } catch {
        // Silently handle errors for now
      } finally {
        setLoading(false)
      }
    },
    [organizationId]
  )

  useEffect(() => {
    if (isLoaded && organizationId) {
      fetchData(search)
    }
  }, [isLoaded, organizationId, fetchData, search])

  const resetForm = () => {
    setName("")
    setIndustry("")
    setSize("")
    setWebsite("")
  }

  const handleCreate = async () => {
    if (!organizationId) return

    setCreating(true)
    try {
      await createCompany({
        organizationId,
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
      <div data-arcy="companies-page" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-36 rounded-md" />
            <div className="skeleton mt-2 h-4 w-48 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <div className="skeleton h-9 w-64 rounded-md" />
            <div className="skeleton h-9 w-32 rounded-md" />
          </div>
        </div>
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-4 w-36 rounded" />
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-4 w-12 rounded" />
                <div className="skeleton h-4 w-12 rounded" />
                <div className="skeleton h-4 w-32 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div data-arcy="companies-page" className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground text-[15px]">
          Please sign in and select an organization.
        </p>
      </div>
    )
  }

  const canEdit = role !== "viewer"

  return (
    <div data-arcy="companies-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[28px] tracking-tight">
            Companies
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {companies.length} compan{companies.length !== 1 ? "ies" : "y"} in
            your organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-arcy="companies-search-input"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-full rounded-md"
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

      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Industry</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Size</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Contacts</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Deals</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Website</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-muted-foreground text-[15px]">
                      {search
                        ? "No companies match your search."
                        : "No companies yet."}
                    </p>
                    {!search && canEdit && (
                      <Button
                        size="sm"
                        onClick={() => setDialogOpen(true)}
                      >
                        <Plus className="mr-1 size-4" />
                        Create your first company
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow
                  key={company.id}
                  data-arcy={`company-row-${company.id}`}
                  className="cursor-pointer hover:bg-muted/50 transition-colors duration-100"
                  onClick={() => router.push(`/companies/${company.id}`)}
                >
                  <TableCell className="font-medium text-[15px]">{company.name}</TableCell>
                  <TableCell className="text-[15px]">{company.industry ?? "\u2014"}</TableCell>
                  <TableCell className="text-[15px]">{company.size ?? "\u2014"}</TableCell>
                  <TableCell className="text-[15px] tabular-nums">{company._count.contacts}</TableCell>
                  <TableCell className="text-[15px] tabular-nums">{company._count.deals}</TableCell>
                  <TableCell>
                    {company.website ? (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 text-[15px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "\u2014"
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
