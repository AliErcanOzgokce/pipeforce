"use client"

import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"

/** Map pathname segment to a human-readable page name. */
function pageName(pathname: string): string {
  if (pathname === "/") return "Dashboard"
  const segment = pathname.split("/").filter(Boolean)[0] ?? ""
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Header() {
  const pathname = usePathname()
  const current = pageName(pathname)

  return (
    <header
      className="flex h-[52px] items-center justify-between border-b bg-card px-6"
      data-arcy="header"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>Home</span>
        <span className="select-none">/</span>
        <span className="text-foreground">{current}</span>
      </nav>

      {/* User */}
      <div className="flex items-center gap-4">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  )
}
