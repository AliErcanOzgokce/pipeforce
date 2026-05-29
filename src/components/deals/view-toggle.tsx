"use client"

import { LayoutGrid, Table2 } from "lucide-react"

interface ViewToggleProps {
  view: "kanban" | "table"
  onViewChange: (view: "kanban" | "table") => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div data-arcy="view-toggle" className="inline-flex bg-muted rounded-md p-0.5">
      <button
        type="button"
        onClick={() => onViewChange("kanban")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-150 ${
          view === "kanban"
            ? "bg-card shadow-sm text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGrid className="size-4" />
        Board
      </button>
      <button
        type="button"
        onClick={() => onViewChange("table")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-150 ${
          view === "table"
            ? "bg-card shadow-sm text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Table2 className="size-4" />
        Table
      </button>
    </div>
  )
}
