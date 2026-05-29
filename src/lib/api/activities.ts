"use server"

import { prisma } from "@/lib/db"

export async function getActivities(
  orgId: string,
  filters?: {
    dealId?: string
    contactId?: string
    createdById?: string
    type?: string
  }
) {
  if (!orgId) throw new Error("Organization ID is required")

  const where: Record<string, unknown> = { organizationId: orgId }

  if (filters?.dealId) where.dealId = filters.dealId
  if (filters?.contactId) where.contactId = filters.contactId
  if (filters?.createdById) where.createdById = filters.createdById
  if (filters?.type) where.type = filters.type

  const activities = await prisma.activity.findMany({
    where,
    include: {
      deal: true,
      contact: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return activities
}

export async function createActivity(data: {
  organizationId: string
  dealId?: string | null
  contactId?: string | null
  createdById: string
  type: string
  title: string
  description?: string | null
  dueDate?: string | null
}) {
  if (!data.organizationId) throw new Error("Organization ID is required")
  if (!data.title?.trim()) throw new Error("Title is required")
  if (!data.createdById) throw new Error("Creator is required")
  if (!data.type) throw new Error("Activity type is required")

  const activity = await prisma.activity.create({
    data: {
      organizationId: data.organizationId,
      dealId: data.dealId || null,
      contactId: data.contactId || null,
      createdById: data.createdById,
      type: data.type as "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE",
      title: data.title.trim(),
      description: data.description?.trim() || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: {
      deal: true,
      contact: true,
      createdBy: true,
    },
  })

  return activity
}

export async function deleteActivity(id: string) {
  if (!id) throw new Error("Activity ID is required")

  await prisma.activity.delete({
    where: { id },
  })

  return { success: true }
}
