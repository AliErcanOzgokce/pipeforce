"use client"

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"

export function Header() {
  return (
    <header
      className="flex h-14 items-center justify-between border-b bg-background px-6"
      data-arcy="header"
    >
      <div className="flex items-center gap-4">
        <OrganizationSwitcher
          appearance={{
            elements: {
              rootBox: "flex items-center",
            },
          }}
        />
      </div>
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
