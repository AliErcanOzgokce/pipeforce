"use server"

import { prisma } from "@/lib/db"

export async function getNotes(dealId: string) {
  if (!dealId) throw new Error("Deal ID is required")

  const notes = await prisma.note.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
  })

  return notes
}

export async function createNote(data: { dealId: string; content: string }) {
  if (!data.dealId) throw new Error("Deal ID is required")
  if (!data.content?.trim()) throw new Error("Content is required")

  const note = await prisma.note.create({
    data: {
      dealId: data.dealId,
      content: data.content.trim(),
    },
  })

  return note
}

export async function deleteNote(id: string) {
  if (!id) throw new Error("Note ID is required")

  await prisma.note.delete({
    where: { id },
  })

  return { success: true }
}
