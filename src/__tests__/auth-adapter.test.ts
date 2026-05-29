import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const srcRoot = path.resolve(__dirname, "..")

describe("Issue #3: Auth Abstraction Layer", () => {
  describe("Auth types", () => {
    const typesContent = fs.readFileSync(
      path.join(srcRoot, "auth/types.ts"),
      "utf-8"
    )

    it("exports AuthUser interface with role field", () => {
      expect(typesContent).toContain("interface AuthUser")
      expect(typesContent).toContain("role: UserRole")
    })

    it("exports AuthOrganization interface", () => {
      expect(typesContent).toContain("interface AuthOrganization")
      expect(typesContent).toContain("id: string")
      expect(typesContent).toContain("name: string")
      expect(typesContent).toContain("slug: string")
    })

    it("UserRole includes admin, sales_rep, viewer", () => {
      expect(typesContent).toContain('"admin"')
      expect(typesContent).toContain('"sales_rep"')
      expect(typesContent).toContain('"viewer"')
    })
  })

  describe("Adapter pattern (re-exports)", () => {
    it("auth/provider.tsx re-exports from clerk adapter", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "auth/provider.tsx"),
        "utf-8"
      )
      expect(content).toContain("./adapters/clerk/provider")
      expect(content).toContain("AuthProvider")
    })

    it("auth/hooks.ts re-exports from clerk adapter", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "auth/hooks.ts"),
        "utf-8"
      )
      expect(content).toContain("./adapters/clerk/hooks")
      expect(content).toContain("useAuth")
      expect(content).toContain("useAuthOrganization")
    })

    it("auth/middleware.ts re-exports from clerk adapter", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "auth/middleware.ts"),
        "utf-8"
      )
      expect(content).toContain("./adapters/clerk/middleware")
      expect(content).toContain("authMiddleware")
    })
  })

  describe("Clerk adapter", () => {
    it("clerk/provider.tsx wraps ClerkProvider", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "auth/adapters/clerk/provider.tsx"),
        "utf-8"
      )
      expect(content).toContain("ClerkProvider")
      expect(content).toContain("@clerk/nextjs")
    })

    it("clerk/hooks.ts resolves roles correctly", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "auth/adapters/clerk/hooks.ts"),
        "utf-8"
      )
      expect(content).toContain("org:admin")
      expect(content).toContain("org:viewer")
      expect(content).toContain("org:member")
      expect(content).toContain("resolveRole")
    })

    it("clerk/middleware.ts protects non-public routes", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "auth/adapters/clerk/middleware.ts"),
        "utf-8"
      )
      expect(content).toContain("clerkMiddleware")
      expect(content).toContain("sign-in")
      expect(content).toContain("sign-up")
      expect(content).toContain("auth.protect()")
    })
  })

  describe("Root middleware", () => {
    it("src/middleware.ts uses auth abstraction layer", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "middleware.ts"),
        "utf-8"
      )
      expect(content).toContain("@/auth/middleware")
      expect(content).not.toContain("@clerk/nextjs")
    })

    it("exports static config with matcher", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "middleware.ts"),
        "utf-8"
      )
      expect(content).toContain("export const config")
      expect(content).toContain("matcher")
    })
  })

  describe("Auth pages", () => {
    it("sign-in page exists with Clerk SignIn component", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "app/(auth)/sign-in/[[...sign-in]]/page.tsx"),
        "utf-8"
      )
      expect(content).toContain("SignIn")
      expect(content).toContain("@clerk/nextjs")
    })

    it("sign-up page exists with Clerk SignUp component", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "app/(auth)/sign-up/[[...sign-up]]/page.tsx"),
        "utf-8"
      )
      expect(content).toContain("SignUp")
      expect(content).toContain("@clerk/nextjs")
    })
  })

  describe("Layout integration", () => {
    it("root layout wraps children with AuthProvider", () => {
      const content = fs.readFileSync(
        path.join(srcRoot, "app/layout.tsx"),
        "utf-8"
      )
      expect(content).toContain("AuthProvider")
      expect(content).toContain("@/auth/provider")
    })
  })
})
