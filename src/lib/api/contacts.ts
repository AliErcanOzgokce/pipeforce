"use server"

import { prisma } from "@/lib/db"

export async function getContacts(orgId: string, search?: string) {
  if (!orgId) {
    throw new Error("Organization ID is required")
  }

  const where: {
    organizationId: string
    OR?: Array<Record<string, { contains: string; mode: "insensitive" }>>
  } = {
    organizationId: orgId,
  }

  if (search?.trim()) {
    where.OR = [
      { firstName: { contains: search.trim(), mode: "insensitive" } },
      { lastName: { contains: search.trim(), mode: "insensitive" } },
      { email: { contains: search.trim(), mode: "insensitive" } },
    ]
  }

  const contacts = await prisma.contact.findMany({
    where,
    include: {
      company: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return contacts
}

export async function getContact(id: string) {
  if (!id) throw new Error("Contact ID is required")

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      deals: {
        include: {
          stage: true,
          owner: true,
        },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: {
          createdBy: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!contact) throw new Error("Contact not found")

  return {
    ...contact,
    deals: contact.deals.map((d) => ({ ...d, value: Number(d.value) })),
  }
}

export async function createContact(data: {
  organizationId: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  status?: "PROSPECT" | "ACTIVE" | "CUSTOMER" | "CHURNED"
  companyId?: string | null
}) {
  if (!data.organizationId) throw new Error("Organization ID is required")
  if (!data.firstName?.trim()) throw new Error("First name is required")
  if (!data.lastName?.trim()) throw new Error("Last name is required")

  const contact = await prisma.contact.create({
    data: {
      organizationId: data.organizationId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      status: data.status ?? "PROSPECT",
      companyId: data.companyId || null,
    },
    include: {
      company: true,
    },
  })

  return contact
}

export async function updateContact(
  id: string,
  data: {
    firstName?: string
    lastName?: string
    email?: string | null
    phone?: string | null
    status?: "PROSPECT" | "ACTIVE" | "CUSTOMER" | "CHURNED"
    companyId?: string | null
  }
) {
  if (!id) throw new Error("Contact ID is required")

  const updateData: Record<string, unknown> = {}

  if (data.firstName !== undefined) updateData.firstName = data.firstName.trim()
  if (data.lastName !== undefined) updateData.lastName = data.lastName.trim()
  if (data.email !== undefined)
    updateData.email = data.email?.trim() || null
  if (data.phone !== undefined)
    updateData.phone = data.phone?.trim() || null
  if (data.status !== undefined) updateData.status = data.status
  if (data.companyId !== undefined)
    updateData.companyId = data.companyId || null

  const contact = await prisma.contact.update({
    where: { id },
    data: updateData,
    include: {
      company: true,
    },
  })

  return contact
}

export async function deleteContact(id: string) {
  if (!id) throw new Error("Contact ID is required")

  await prisma.contact.delete({
    where: { id },
  })

  return { success: true }
}
