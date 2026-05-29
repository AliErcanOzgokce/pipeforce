"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "@/auth/use-session"
import { KanbanBoard } from "@/components/deals/kanban-board"
import { DealsTable } from "@/components/deals/deals-table"
import { DealForm } from "@/components/deals/deal-form"
import { ViewToggle } from "@/components/deals/view-toggle"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  getDeals,
  getStages,
  getContacts,
  getCompanies,
  getMembers,
} from "@/lib/api/deals"

type DealWithRelations = Awaited<ReturnType<typeof getDeals>>[number]
type Stage = Awaited<ReturnType<typeof getStages>>[number]
type Contact = Awaited<ReturnType<typeof getContacts>>[number]
type Company = Awaited<ReturnType<typeof getCompanies>>[number]
type Member = Awaited<ReturnType<typeof getMembers>>[number]

export default function DealsPage() {
  const { organizationId, memberId, role, isLoaded } = useSession()

  const [view, setView] = useState<"kanban" | "table">("kanban")
  const [deals, setDeals] = useState<DealWithRelations[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!organizationId || !memberId) return

    setLoading(true)
    try {
      // Sales reps only see their own deals
      const ownerId = role === "sales_rep" ? memberId : undefined

      const [dealsData, stagesData, contactsData, companiesData, membersData] =
        await Promise.all([
          getDeals(organizationId, ownerId),
          getStages(organizationId),
          getContacts(organizationId),
          getCompanies(organizationId),
          getMembers(organizationId),
        ])

      setDeals(dealsData)
      setStages(stagesData)
      setContacts(contactsData)
      setCompanies(companiesData)
      setMembers(membersData)
    } catch {
      // Silently handle errors for now
    } finally {
      setLoading(false)
    }
  }, [organizationId, memberId, role])

  useEffect(() => {
    if (isLoaded && organizationId && memberId) {
      fetchData()
    }
  }, [isLoaded, organizationId, memberId, fetchData])

  if (!isLoaded || loading) {
    return (
      <div data-arcy="deals-page" className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading deals...</p>
      </div>
    )
  }

  if (!organizationId || !memberId) {
    return (
      <div data-arcy="deals-page" className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">
          Please sign in and select an organization.
        </p>
      </div>
    )
  }

  const canEdit = role !== "viewer"

  // Serialize deals for child components (convert Decimal/Date to primitives)
  const serializedDeals = deals.map((d) => ({
    id: d.id,
    title: d.title,
    value: Number(d.value),
    currency: d.currency,
    stageId: d.stageId,
    contactId: d.contactId,
    companyId: d.companyId,
    ownerId: d.ownerId,
    expectedCloseDate: d.expectedCloseDate
      ? d.expectedCloseDate.toISOString()
      : null,
    description: d.description,
    stage: { name: d.stage.name, color: d.stage.color },
    contact: d.contact
      ? { firstName: d.contact.firstName, lastName: d.contact.lastName }
      : null,
    company: d.company ? { name: d.company.name } : null,
    owner: { name: d.owner.name, imageUrl: d.owner.imageUrl },
  }))

  const serializedStages = stages.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    order: s.order,
  }))

  return (
    <div data-arcy="deals-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Deals</h2>
          <p className="text-sm text-muted-foreground">
            {deals.length} deal{deals.length !== 1 ? "s" : ""} in your pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onViewChange={setView} />
          {canEdit && (
            <DealForm
              orgId={organizationId}
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
              trigger={
                <Button data-arcy="create-deal-button">
                  <Plus className="mr-1 size-4" />
                  Add Deal
                </Button>
              }
              onSuccess={fetchData}
            />
          )}
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanBoard deals={serializedDeals} stages={serializedStages} />
      ) : (
        <DealsTable deals={serializedDeals} />
      )}
    </div>
  )
}
