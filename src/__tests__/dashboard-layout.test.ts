import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const srcRoot = path.resolve(__dirname, "..")

describe("Issue #5: Dashboard Layout", () => {
  describe("Layout components exist", () => {
    const components = [
      "components/layout/sidebar.tsx",
      "components/layout/header.tsx",
      "components/layout/nav-item.tsx",
    ]

    it.each(components)("%s exists", (file) => {
      expect(fs.existsSync(path.join(srcRoot, file))).toBe(true)
    })
  })

  describe("Dashboard layout", () => {
    it("(dashboard)/layout.tsx uses Sidebar and Header", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "app/(dashboard)/layout.tsx"),
        "utf-8"
      )
      expect(content).toContain("Sidebar")
      expect(content).toContain("Header")
    })

    it("(dashboard)/page.tsx exists as dashboard homepage", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "app/(dashboard)/page.tsx"),
        "utf-8"
      )
      expect(content).toContain("Dashboard")
      expect(content).toContain("data-arcy")
    })
  })

  describe("Sidebar navigation routes", () => {
    const sidebarContent = fs.readFileSync(
      path.join(srcRoot, "components/layout/sidebar.tsx"),
      "utf-8"
    )

    it("defines all navigation routes", () => {
      const routeLabels = [
        "Dashboard",
        "Deals",
        "Contacts",
        "Companies",
        "Activities",
        "Pipeline",
        "Analytics",
        "Settings",
      ]
      for (const label of routeLabels) {
        expect(sidebarContent).toContain(label)
      }
    })

    it("Pipeline is admin-only", () => {
      const pipelineMatch = sidebarContent.match(
        /label:\s*"Pipeline".*?roles:\s*\[([^\]]+)\]/s
      )
      expect(pipelineMatch).not.toBeNull()
      const roles = pipelineMatch![1]
      expect(roles).toContain('"admin"')
      expect(roles).not.toContain('"sales_rep"')
      expect(roles).not.toContain('"viewer"')
    })

    it("Settings is admin-only", () => {
      const settingsMatch = sidebarContent.match(
        /label:\s*"Settings".*?roles:\s*\[([^\]]+)\]/s
      )
      expect(settingsMatch).not.toBeNull()
      const roles = settingsMatch![1]
      expect(roles).toContain('"admin"')
      expect(roles).not.toContain('"sales_rep"')
      expect(roles).not.toContain('"viewer"')
    })

    it("filters routes by user role", () => {
      expect(sidebarContent).toContain("visibleRoutes")
      expect(sidebarContent).toContain("route.roles.includes(role)")
    })
  })

  describe("Header", () => {
    const headerContent = fs.readFileSync(
      path.join(srcRoot, "components/layout/header.tsx"),
      "utf-8"
    )

    it("includes Clerk OrganizationSwitcher", () => {
      expect(headerContent).toContain("OrganizationSwitcher")
    })

    it("includes Clerk UserButton", () => {
      expect(headerContent).toContain("UserButton")
    })

    it("has data-arcy attribute", () => {
      expect(headerContent).toContain('data-arcy="header"')
    })
  })

  describe("NavItem", () => {
    const navItemContent = fs.readFileSync(
      path.join(srcRoot, "components/layout/nav-item.tsx"),
      "utf-8"
    )

    it("uses Next.js Link", () => {
      expect(navItemContent).toContain("next/link")
    })

    it("highlights active route", () => {
      expect(navItemContent).toContain("usePathname")
      expect(navItemContent).toContain("isActive")
    })

    it("has data-arcy attribute", () => {
      expect(navItemContent).toContain("data-arcy")
    })
  })

  describe("Icons", () => {
    const sidebarContent = fs.readFileSync(
      path.join(srcRoot, "components/layout/sidebar.tsx"),
      "utf-8"
    )

    it("uses lucide-react icons", () => {
      expect(sidebarContent).toContain("lucide-react")
      expect(sidebarContent).toContain("LayoutDashboard")
      expect(sidebarContent).toContain("Handshake")
      expect(sidebarContent).toContain("Building2")
    })
  })
})
