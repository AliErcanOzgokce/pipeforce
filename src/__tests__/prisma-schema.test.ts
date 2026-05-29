import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const schemaPath = path.resolve(__dirname, "../../prisma/schema.prisma")
const schema = fs.readFileSync(schemaPath, "utf-8")

describe("Issue #4: Prisma Schema", () => {
  describe("Models", () => {
    const models = [
      "Organization",
      "Member",
      "Pipeline",
      "Stage",
      "Deal",
      "Contact",
      "Company",
      "Activity",
      "Note",
    ]

    it.each(models)("model %s is defined", (model) => {
      expect(schema).toContain(`model ${model} {`)
    })
  })

  describe("Enums", () => {
    it.each(["Role", "ContactStatus", "ActivityType"])(
      "enum %s is defined",
      (enumName) => {
        expect(schema).toContain(`enum ${enumName} {`)
      }
    )

    it("Role has ADMIN, SALES_REP, VIEWER", () => {
      const roleBlock = schema.match(/enum Role \{([^}]+)\}/)?.[1] ?? ""
      expect(roleBlock).toContain("ADMIN")
      expect(roleBlock).toContain("SALES_REP")
      expect(roleBlock).toContain("VIEWER")
    })

    it("ContactStatus has all values", () => {
      const block =
        schema.match(/enum ContactStatus \{([^}]+)\}/)?.[1] ?? ""
      expect(block).toContain("PROSPECT")
      expect(block).toContain("ACTIVE")
      expect(block).toContain("CUSTOMER")
      expect(block).toContain("CHURNED")
    })

    it("ActivityType has all values", () => {
      const block =
        schema.match(/enum ActivityType \{([^}]+)\}/)?.[1] ?? ""
      expect(block).toContain("CALL")
      expect(block).toContain("EMAIL")
      expect(block).toContain("MEETING")
      expect(block).toContain("TASK")
      expect(block).toContain("NOTE")
    })
  })

  describe("Relationships", () => {
    it("Deal references Stage, Contact, Company, Member", () => {
      expect(schema).toContain("stage             Stage")
      expect(schema).toContain("contact           Contact?")
      expect(schema).toContain("company           Company?")
      expect(schema).toContain("owner             Member")
    })

    it("Contact optionally belongs to Company", () => {
      expect(schema).toMatch(/model Contact \{[\s\S]*?companyId\s+String\?/)
    })

    it("Activity optionally belongs to Deal and Contact", () => {
      const activityBlock =
        schema.match(/model Activity \{([\s\S]*?)\n\}/)?.[1] ?? ""
      expect(activityBlock).toContain("dealId         String?")
      expect(activityBlock).toContain("contactId      String?")
    })

    it("All entities have organizationId for tenant isolation", () => {
      for (const model of ["Member", "Deal", "Contact", "Company", "Activity"]) {
        const block =
          schema.match(new RegExp(`model ${model} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? ""
        expect(block).toContain("organizationId")
      }
    })
  })

  describe("Indexes", () => {
    it("Organization has unique clerkOrgId", () => {
      expect(schema).toContain("clerkOrgId String   @unique")
    })

    it("Member has unique [clerkUserId, organizationId]", () => {
      expect(schema).toContain("@@unique([clerkUserId, organizationId])")
    })

    it("Stage has unique [pipelineId, order]", () => {
      expect(schema).toContain("@@unique([pipelineId, order])")
    })

    it("organizationId indexed on tenant-scoped models", () => {
      for (const model of ["Deal", "Contact", "Company", "Activity"]) {
        const block =
          schema.match(new RegExp(`model ${model} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? ""
        expect(block).toContain("@@index([organizationId])")
      }
    })
  })

  describe("Prisma client", () => {
    it("db.ts singleton exists", () => {
      const dbPath = path.resolve(__dirname, "../lib/db.ts")
      expect(fs.existsSync(dbPath)).toBe(true)
      const content = fs.readFileSync(dbPath, "utf-8")
      expect(content).toContain("PrismaClient")
    })
  })
})
