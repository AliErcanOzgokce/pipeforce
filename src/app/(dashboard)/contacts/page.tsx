"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/auth/use-session"
import { getContacts, createContact } from "@/lib/api/contacts"
import { getCompanies } from "@/lib/api/companies"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Search } from "lucide-react"

type ContactWithCompany = Awaited<ReturnType<typeof getContacts>>[number]
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

export default function ContactsPage() {
  const router = useRouter()
  const { organizationId, role, isLoaded } = useSession()

  const [contacts, setContacts] = useState<ContactWithCompany[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("PROSPECT")
  const [companyId, setCompanyId] = useState("")

  const fetchData = useCallback(
    async (searchTerm?: string) => {
      if (!organizationId) return

      setLoading(true)
      try {
        const [contactsData, companiesData] = await Promise.all([
          getContacts(organizationId, searchTerm),
          getCompanies(organizationId),
        ])
        setContacts(contactsData)
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
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
    setStatus("PROSPECT")
    setCompanyId("")
  }

  const handleCreate = async () => {
    if (!organizationId) return

    setCreating(true)
    try {
      await createContact({
        organizationId,
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        status,
        companyId: companyId || null,
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
      <div data-arcy="contacts-page" className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading contacts...</p>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div data-arcy="contacts-page" className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">
          Please sign in and select an organization.
        </p>
      </div>
    )
  }

  const canEdit = role !== "viewer"

  return (
    <div data-arcy="contacts-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
          <p className="text-sm text-muted-foreground">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""} in your
            organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-arcy="contacts-search-input"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={
                  <Button data-arcy="create-contact-button">
                    <Plus className="mr-1 size-4" />
                    Add Contact
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Contact</DialogTitle>
                  <DialogDescription>
                    Add a new contact to your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        data-arcy="contact-first-name-input"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        data-arcy="contact-last-name-input"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      data-arcy="contact-email-input"
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      data-arcy="contact-phone-input"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
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
                        data-arcy="contact-status-select"
                        className="w-full"
                      >
                        <SelectValue placeholder="Select status" />
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
                        data-arcy="contact-company-select"
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
                    data-arcy="contact-submit-button"
                    onClick={handleCreate}
                    disabled={creating || !firstName.trim() || !lastName.trim()}
                  >
                    {creating ? "Creating..." : "Create Contact"}
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
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-muted-foreground">
                    {search ? "No contacts match your search." : "No contacts yet."}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  data-arcy={`contact-row-${contact.id}`}
                  className="cursor-pointer"
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                >
                  <TableCell className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </TableCell>
                  <TableCell>{contact.email ?? "—"}</TableCell>
                  <TableCell>{contact.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[contact.status] ?? "outline"}>
                      {contact.status.charAt(0) +
                        contact.status.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{contact.company?.name ?? "—"}</TableCell>
                  <TableCell>
                    {new Date(contact.createdAt).toLocaleDateString()}
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
