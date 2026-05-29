"use server"

import { prisma } from "@/lib/db"

export async function getPipeline(orgId: string) {
  if (!orgId) throw new Error("Organization ID is required")

  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId: orgId },
    include: {
      stages: {
        orderBy: { order: "asc" },
      },
    },
  })

  return pipeline
}

export async function createStage(data: {
  pipelineId: string
  name: string
  color?: string
}) {
  if (!data.pipelineId) throw new Error("Pipeline ID is required")
  if (!data.name?.trim()) throw new Error("Stage name is required")

  // Get the next order value
  const lastStage = await prisma.stage.findFirst({
    where: { pipelineId: data.pipelineId },
    orderBy: { order: "desc" },
  })

  const nextOrder = (lastStage?.order ?? -1) + 1

  const stage = await prisma.stage.create({
    data: {
      pipelineId: data.pipelineId,
      name: data.name.trim(),
      color: data.color ?? "#6366f1",
      order: nextOrder,
    },
  })

  return stage
}

export async function updateStage(
  id: string,
  data: { name?: string; color?: string }
) {
  if (!id) throw new Error("Stage ID is required")

  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.color !== undefined) updateData.color = data.color

  const stage = await prisma.stage.update({
    where: { id },
    data: updateData,
  })

  return stage
}

export async function deleteStage(id: string) {
  if (!id) throw new Error("Stage ID is required")

  await prisma.stage.delete({
    where: { id },
  })

  return { success: true }
}

export async function reorderStages(pipelineId: string, stageIds: string[]) {
  if (!pipelineId) throw new Error("Pipeline ID is required")
  if (!stageIds.length) throw new Error("Stage IDs are required")

  // Use a transaction to update all stage orders atomically
  // First, set all to negative offsets to avoid unique constraint violations
  await prisma.$transaction(async (tx) => {
    // Temporarily set negative orders to avoid unique constraint conflicts
    for (let i = 0; i < stageIds.length; i++) {
      await tx.stage.update({
        where: { id: stageIds[i] },
        data: { order: -(i + 1) },
      })
    }

    // Now set the actual orders
    for (let i = 0; i < stageIds.length; i++) {
      await tx.stage.update({
        where: { id: stageIds[i] },
        data: { order: i },
      })
    }
  })

  return { success: true }
}
