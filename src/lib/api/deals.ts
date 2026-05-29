"use server"

import { prisma } from "@/lib/db"

export async function getDeal(id: string) {
  if (!id) throw new Error("Deal ID is required")

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      stage: {
        include: { pipeline: true },
      },
      contact: true,
      company: true,
      owner: true,
      activities: {
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
      },
      notes: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  return deal
}

export async function getDeals(orgId: string, userId?: string) {
  if (!orgId) {
    throw new Error("Organization ID is required")
  }

  const where: { organizationId: string; ownerId?: string } = {
    organizationId: orgId,
  }

  if (userId) {
    where.ownerId = userId
  }

  const deals = await prisma.deal.findMany({
    where,
    include: {
      stage: true,
      contact: true,
      company: true,
      owner: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return deals
}

export async function createDeal(data: {
  organizationId: string
  title: string
  value: number
  currency?: string
  stageId: string
  ownerId: string
  contactId?: string | null
  companyId?: string | null
  expectedCloseDate?: string | null
  description?: string | null
}) {
  if (!data.organizationId) throw new Error("Organization ID is required")
  if (!data.title?.trim()) throw new Error("Title is required")
  if (!data.stageId) throw new Error("Stage is required")
  if (!data.ownerId) throw new Error("Owner is required")

  const deal = await prisma.deal.create({
    data: {
      organizationId: data.organizationId,
      title: data.title.trim(),
      value: data.value ?? 0,
      currency: data.currency ?? "USD",
      stageId: data.stageId,
      ownerId: data.ownerId,
      contactId: data.contactId || null,
      companyId: data.companyId || null,
      expectedCloseDate: data.expectedCloseDate
        ? new Date(data.expectedCloseDate)
        : null,
      description: data.description?.trim() || null,
    },
    include: {
      stage: true,
      contact: true,
      company: true,
      owner: true,
    },
  })

  return deal
}

export async function updateDeal(
  id: string,
  data: {
    title?: string
    value?: number
    currency?: string
    stageId?: string
    ownerId?: string
    contactId?: string | null
    companyId?: string | null
    expectedCloseDate?: string | null
    description?: string | null
  }
) {
  if (!id) throw new Error("Deal ID is required")

  const updateData: Record<string, unknown> = {}

  if (data.title !== undefined) updateData.title = data.title.trim()
  if (data.value !== undefined) updateData.value = data.value
  if (data.currency !== undefined) updateData.currency = data.currency
  if (data.stageId !== undefined) updateData.stageId = data.stageId
  if (data.ownerId !== undefined) updateData.ownerId = data.ownerId
  if (data.contactId !== undefined) updateData.contactId = data.contactId || null
  if (data.companyId !== undefined) updateData.companyId = data.companyId || null
  if (data.expectedCloseDate !== undefined) {
    updateData.expectedCloseDate = data.expectedCloseDate
      ? new Date(data.expectedCloseDate)
      : null
  }
  if (data.description !== undefined) {
    updateData.description = data.description?.trim() || null
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: updateData,
    include: {
      stage: true,
      contact: true,
      company: true,
      owner: true,
    },
  })

  return deal
}

export async function updateDealStage(dealId: string, stageId: string) {
  if (!dealId) throw new Error("Deal ID is required")
  if (!stageId) throw new Error("Stage ID is required")

  const deal = await prisma.deal.update({
    where: { id: dealId },
    data: { stageId },
    include: {
      stage: true,
      contact: true,
      company: true,
      owner: true,
    },
  })

  return deal
}

export async function deleteDeal(id: string) {
  if (!id) throw new Error("Deal ID is required")

  await prisma.deal.delete({
    where: { id },
  })

  return { success: true }
}

export async function getStages(orgId: string) {
  if (!orgId) throw new Error("Organization ID is required")

  const stages = await prisma.stage.findMany({
    where: {
      pipeline: {
        organizationId: orgId,
      },
    },
    orderBy: { order: "asc" },
  })

  return stages
}

export async function getContacts(orgId: string) {
  if (!orgId) throw new Error("Organization ID is required")

  const contacts = await prisma.contact.findMany({
    where: { organizationId: orgId },
    orderBy: { firstName: "asc" },
  })

  return contacts
}

export async function getCompanies(orgId: string) {
  if (!orgId) throw new Error("Organization ID is required")

  const companies = await prisma.company.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  })

  return companies
}

export async function getMembers(orgId: string) {
  if (!orgId) throw new Error("Organization ID is required")

  const members = await prisma.member.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  })

  return members
}

export async function getMemberByClerkId(
  clerkUserId: string,
  orgId: string
) {
  if (!clerkUserId || !orgId) return null

  const member = await prisma.member.findUnique({
    where: {
      clerkUserId_organizationId: {
        clerkUserId,
        organizationId: orgId,
      },
    },
  })

  return member
}
