import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"

const root = path.resolve(__dirname, "../..")

describe("Issue #2: Project Scaffolding", () => {
  describe("Directory structure", () => {
    const expectedDirs = [
      "src/auth",
      "src/auth/adapters/clerk",
      "src/components/ui",
      "src/components/deals",
      "src/components/contacts",
      "src/components/companies",
      "src/components/activities",
      "src/components/analytics",
      "src/components/pipeline",
      "src/components/layout",
      "src/lib",
      "src/lib/api",
      "src/types",
      "src/app/(auth)",
      "src/app/(dashboard)/deals",
      "src/app/(dashboard)/contacts",
      "src/app/(dashboard)/companies",
      "src/app/(dashboard)/activities",
      "src/app/(dashboard)/pipeline",
      "src/app/(dashboard)/analytics",
      "src/app/(dashboard)/settings",
    ]

    it.each(expectedDirs)("directory %s exists", (dir) => {
      expect(fs.existsSync(path.join(root, dir))).toBe(true)
    })
  })

  describe("TypeScript strict mode", () => {
    it("tsconfig.json has strict: true", () => {
      const tsconfig = JSON.parse(
        fs.readFileSync(path.join(root, "tsconfig.json"), "utf-8")
      )
      expect(tsconfig.compilerOptions.strict).toBe(true)
    })
  })

  describe("Next.js config", () => {
    it("next.config.ts has standalone output", () => {
      const content = fs.readFileSync(
        path.join(root, "next.config.ts"),
        "utf-8"
      )
      expect(content).toContain('output: "standalone"')
    })
  })

  describe("Docker Compose", () => {
    it("docker-compose.yml defines postgres service", () => {
      const content = fs.readFileSync(
        path.join(root, "docker-compose.yml"),
        "utf-8"
      )
      expect(content).toContain("postgres:16")
      expect(content).toContain("5432:5432")
    })
  })

  describe("Prisma", () => {
    it("schema.prisma uses postgresql provider", () => {
      const content = fs.readFileSync(
        path.join(root, "prisma/schema.prisma"),
        "utf-8"
      )
      expect(content).toContain('provider = "postgresql"')
    })
  })

  describe("Environment variables", () => {
    it(".env.local.example documents all required vars", () => {
      const content = fs.readFileSync(
        path.join(root, ".env.local.example"),
        "utf-8"
      )
      expect(content).toContain("DATABASE_URL")
      expect(content).toContain("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
      expect(content).toContain("CLERK_SECRET_KEY")
      expect(content).toContain("NEXT_PUBLIC_ARCY_PUBLISHABLE_KEY")
      expect(content).toContain("ARCY_SECRET_KEY")
    })
  })

  describe("shadcn/ui", () => {
    it("Button component renders", () => {
      render(<Button>Test</Button>)
      expect(screen.getByRole("button", { name: "Test" })).toBeDefined()
    })
  })

  describe("Dependencies", () => {
    it("@dnd-kit packages are installed", () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(root, "package.json"), "utf-8")
      )
      expect(pkg.dependencies["@dnd-kit/core"]).toBeDefined()
      expect(pkg.dependencies["@dnd-kit/sortable"]).toBeDefined()
      expect(pkg.dependencies["@dnd-kit/utilities"]).toBeDefined()
    })
  })
})
