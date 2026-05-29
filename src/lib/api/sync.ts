"use server"

import { prisma } from "@/lib/db"

/**
 * Ensures the Clerk user has a matching Organization + Member in the DB.
 * If not found, creates them on the fly so the app works without pre-seeding.
 */
export async function ensureOrganizationAndMember(params: {
  clerkUserId: string
  clerkOrgId: string
  orgName: string
  orgSlug: string
  userEmail: string
  userName: string | null
  userImageUrl: string | null
  userRole: "admin" | "sales_rep" | "viewer"
}) {
  // Find or create organization
  let org = await prisma.organization.findUnique({
    where: { clerkOrgId: params.clerkOrgId },
  })

  if (!org) {
    org = await prisma.organization.create({
      data: {
        clerkOrgId: params.clerkOrgId,
        name: params.orgName,
        slug: params.orgSlug,
      },
    })

    // Create default pipeline with stages
    const pipeline = await prisma.pipeline.create({
      data: {
        organizationId: org.id,
        name: "Sales Pipeline",
      },
    })

    const stages = [
      { name: "Lead", order: 0, color: "#6366f1" },
      { name: "Qualified", order: 1, color: "#8b5cf6" },
      { name: "Proposal", order: 2, color: "#3b82f6" },
      { name: "Negotiation", order: 3, color: "#f59e0b" },
      { name: "Closed Won", order: 4, color: "#22c55e" },
      { name: "Closed Lost", order: 5, color: "#ef4444" },
    ]

    await prisma.stage.createMany({
      data: stages.map((s) => ({ ...s, pipelineId: pipeline.id })),
    })
  }

  // Find or create member
  let member = await prisma.member.findUnique({
    where: {
      clerkUserId_organizationId: {
        clerkUserId: params.clerkUserId,
        organizationId: org.id,
      },
    },
  })

  if (!member) {
    member = await prisma.member.create({
      data: {
        clerkUserId: params.clerkUserId,
        organizationId: org.id,
        email: params.userEmail,
        name: params.userName,
        imageUrl: params.userImageUrl,
        role: params.userRole === "admin"
          ? "ADMIN"
          : params.userRole === "viewer"
            ? "VIEWER"
            : "SALES_REP",
      },
    })
  }

  return { organizationId: org.id, memberId: member.id }
}
