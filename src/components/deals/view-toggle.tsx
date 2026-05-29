"use client"

import { Button } from "@/components/ui/button"
import { LayoutGrid, Table2 } from "lucide-react"

interface ViewToggleProps {
  view: "kanban" | "table"
  onViewChange: (view: "kanban" | "table") => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div data-arcy="view-toggle" className="flex items-center gap-1 rounded-lg border p-0.5">
      <Button
        variant={view === "kanban" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("kanban")}
      >
        <LayoutGrid className="mr-1 size-4" />
        Board
      </Button>
      <Button
        variant={view === "table" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
      >
        <Table2 className="mr-1 size-4" />
        Table
      </Button>
    </div>
  )
}
