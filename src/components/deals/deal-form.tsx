"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { createDeal, updateDeal } from "@/lib/api/deals"

interface StageOption {
  id: string
  name: string
}

interface ContactOption {
  id: string
  firstName: string
  lastName: string
}

interface CompanyOption {
  id: string
  name: string
}

interface MemberOption {
  id: string
  name: string | null
  email: string
}

interface DealFormProps {
  orgId: string
  stages: StageOption[]
  contacts: ContactOption[]
  companies: CompanyOption[]
  members: MemberOption[]
  deal?: {
    id: string
    title: string
    value: number
    currency: string
    stageId: string
    ownerId: string
    contactId: string | null
    companyId: string | null
    expectedCloseDate: string | null
    description: string | null
  } | null
  trigger: React.ReactNode
  onSuccess?: () => void
}

export function DealForm({
  orgId,
  stages,
  contacts,
  companies,
  members,
  deal,
  trigger,
  onSuccess,
}: DealFormProps) {
  const isEdit = !!deal
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState(deal?.title ?? "")
  const [value, setValue] = useState(deal?.value?.toString() ?? "0")
  const [currency, setCurrency] = useState(deal?.currency ?? "USD")
  const [stageId, setStageId] = useState(deal?.stageId ?? "")
  const [ownerId, setOwnerId] = useState(deal?.ownerId ?? "")
  const [contactId, setContactId] = useState(deal?.contactId ?? "")
  const [companyId, setCompanyId] = useState(deal?.companyId ?? "")
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    deal?.expectedCloseDate
      ? new Date(deal.expectedCloseDate).toISOString().split("T")[0]
      : ""
  )
  const [description, setDescription] = useState(deal?.description ?? "")

  function resetForm() {
    if (!isEdit) {
      setTitle("")
      setValue("0")
      setCurrency("USD")
      setStageId("")
      setOwnerId("")
      setContactId("")
      setCompanyId("")
      setExpectedCloseDate("")
      setDescription("")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEdit && deal) {
        await updateDeal(deal.id, {
          title,
          value: parseFloat(value) || 0,
          currency,
          stageId: stageId || undefined,
          ownerId: ownerId || undefined,
          contactId: contactId || null,
          companyId: companyId || null,
          expectedCloseDate: expectedCloseDate || null,
          description: description || null,
        })
      } else {
        await createDeal({
          organizationId: orgId,
          title,
          value: parseFloat(value) || 0,
          currency,
          stageId,
          ownerId,
          contactId: contactId || null,
          companyId: companyId || null,
          expectedCloseDate: expectedCloseDate || null,
          description: description || null,
        })
      }

      resetForm()
      setOpen(false)
      onSuccess?.()
    } catch {
      // Error is handled silently for now
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />}>{trigger}</DialogTrigger>
      <DialogContent
        data-arcy="deal-form"
        className="sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Deal" : "New Deal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal-title">Title</Label>
            <Input
              id="deal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Deal title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal-value">Value</Label>
              <Input
                id="deal-value"
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-currency">Currency</Label>
              <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                <SelectTrigger className="w-full" id="deal-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-stage">Stage</Label>
            <Select value={stageId} onValueChange={(v) => v && setStageId(v)} required>
              <SelectTrigger className="w-full" id="deal-stage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-owner">Owner</Label>
            <Select value={ownerId} onValueChange={(v) => v && setOwnerId(v)} required>
              <SelectTrigger className="w-full" id="deal-owner">
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name ?? m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-contact">Contact</Label>
            <Select value={contactId} onValueChange={(v) => setContactId(v ?? "")}>
              <SelectTrigger className="w-full" id="deal-contact">
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
            <Label htmlFor="deal-company">Company</Label>
            <Select value={companyId} onValueChange={(v) => setCompanyId(v ?? "")}>
              <SelectTrigger className="w-full" id="deal-company">
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

          <div className="space-y-2">
            <Label htmlFor="deal-close-date">Expected Close Date</Label>
            <Input
              id="deal-close-date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-description">Description</Label>
            <Textarea
              id="deal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deal description (optional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || !title || !stageId || !ownerId}>
              {loading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
