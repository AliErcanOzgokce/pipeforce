"use server"

import { prisma } from "@/lib/db"

export async function getCompanies(orgId: string, search?: string) {
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
      { name: { contains: search.trim(), mode: "insensitive" } },
      { industry: { contains: search.trim(), mode: "insensitive" } },
    ]
  }

  const companies = await prisma.company.findMany({
    where,
    include: {
      _count: {
        select: {
          contacts: true,
          deals: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return companies
}

export async function getCompany(id: string) {
  if (!id) throw new Error("Company ID is required")

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: {
        orderBy: { createdAt: "desc" },
      },
      deals: {
        include: {
          stage: true,
          owner: true,
          contact: true,
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          contacts: true,
          deals: true,
        },
      },
    },
  })

  if (!company) throw new Error("Company not found")

  return {
    ...company,
    deals: company.deals.map((d) => ({ ...d, value: Number(d.value) })),
  }
}

export async function createCompany(data: {
  organizationId: string
  name: string
  industry?: string | null
  size?: string | null
  website?: string | null
}) {
  if (!data.organizationId) throw new Error("Organization ID is required")
  if (!data.name?.trim()) throw new Error("Company name is required")

  const company = await prisma.company.create({
    data: {
      organizationId: data.organizationId,
      name: data.name.trim(),
      industry: data.industry?.trim() || null,
      size: data.size?.trim() || null,
      website: data.website?.trim() || null,
    },
    include: {
      _count: {
        select: {
          contacts: true,
          deals: true,
        },
      },
    },
  })

  return company
}

export async function updateCompany(
  id: string,
  data: {
    name?: string
    industry?: string | null
    size?: string | null
    website?: string | null
  }
) {
  if (!id) throw new Error("Company ID is required")

  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.industry !== undefined)
    updateData.industry = data.industry?.trim() || null
  if (data.size !== undefined)
    updateData.size = data.size?.trim() || null
  if (data.website !== undefined)
    updateData.website = data.website?.trim() || null

  const company = await prisma.company.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: {
          contacts: true,
          deals: true,
        },
      },
    },
  })

  return company
}

export async function deleteCompany(id: string) {
  if (!id) throw new Error("Company ID is required")

  await prisma.company.delete({
    where: { id },
  })

  return { success: true }
}
