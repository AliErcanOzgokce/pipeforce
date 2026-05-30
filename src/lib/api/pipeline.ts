"use server"

import { prisma } from "@/lib/db"

interface StageWithStats {
  id: string
  name: string
  color: string
  order: number
  dealCount: number
  totalValue: number
  avgValue: number
  topDeals: string[]
}

interface PipelineData {
  id: string
  name: string
  totalStages: number
  totalDeals: number
  totalValue: number
  stages: StageWithStats[]
}

export async function getPipeline(orgId: string): Promise<PipelineData | null> {
  if (!orgId) throw new Error("Organization ID is required")

  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId: orgId },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          deals: {
            select: { title: true, value: true },
            orderBy: { value: "desc" },
          },
        },
      },
    },
  })

  if (!pipeline) return null

  let totalDeals = 0
  let totalValue = 0

  const stages: StageWithStats[] = pipeline.stages.map((s) => {
    const dealCount = s.deals.length
    const stageTotal = s.deals.reduce((sum, d) => sum + Number(d.value), 0)
    totalDeals += dealCount
    totalValue += stageTotal

    return {
      id: s.id,
      name: s.name,
      color: s.color,
      order: s.order,
      dealCount,
      totalValue: stageTotal,
      avgValue: dealCount > 0 ? stageTotal / dealCount : 0,
      topDeals: s.deals.slice(0, 3).map((d) => d.title),
    }
  })

  return {
    id: pipeline.id,
    name: pipeline.name,
    totalStages: stages.length,
    totalDeals,
    totalValue,
    stages,
  }
}

export async function createStage(data: {
  pipelineId: string
  name: string
  color?: string
}) {
  if (!data.pipelineId) throw new Error("Pipeline ID is required")
  if (!data.name?.trim()) throw new Error("Stage name is required")

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

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < stageIds.length; i++) {
      await tx.stage.update({
        where: { id: stageIds[i] },
        data: { order: -(i + 1) },
      })
    }

    for (let i = 0; i < stageIds.length; i++) {
      await tx.stage.update({
        where: { id: stageIds[i] },
        data: { order: i },
      })
    }
  })

  return { success: true }
}
