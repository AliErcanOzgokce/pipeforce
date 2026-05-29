import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ---------------------------------------------------------------------------
// Prisma client (pg adapter, same pattern as src/lib/db.ts)
// ---------------------------------------------------------------------------
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Fixed base date for deterministic timestamps
// ---------------------------------------------------------------------------
const BASE_DATE = new Date("2026-05-15T10:00:00.000Z");

function daysAgo(n: number): Date {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + n);
  return d;
}

// ---------------------------------------------------------------------------
// Fixed CUID-like IDs
// ---------------------------------------------------------------------------

// Organizations
const ORG_ACME = "clseed_org_acme_000001";
const ORG_GLOBAL = "clseed_org_global_000001";

// Members – Acme
const MEMBER_ACME_ADMIN = "clseed_mem_acme_admin_01";
const MEMBER_ACME_SALES = "clseed_mem_acme_sales_01";
const MEMBER_ACME_VIEWER = "clseed_mem_acme_viewer01";

// Members – Global
const MEMBER_GLOBAL_ADMIN = "clseed_mem_glob_admin_01";
const MEMBER_GLOBAL_SALES = "clseed_mem_glob_sales_01";
const MEMBER_GLOBAL_VIEWER = "clseed_mem_glob_viewer01";

// Pipelines
const PIPELINE_ACME = "clseed_pipe_acme_000001";
const PIPELINE_GLOBAL = "clseed_pipe_glob_000001";

// Stage IDs per org – 6 stages each
const STAGES_ACME = [
  "clseed_stg_acme_lead_001",
  "clseed_stg_acme_qual_001",
  "clseed_stg_acme_prop_001",
  "clseed_stg_acme_nego_001",
  "clseed_stg_acme_won__001",
  "clseed_stg_acme_lost_001",
] as const;

const STAGES_GLOBAL = [
  "clseed_stg_glob_lead_001",
  "clseed_stg_glob_qual_001",
  "clseed_stg_glob_prop_001",
  "clseed_stg_glob_nego_001",
  "clseed_stg_glob_won__001",
  "clseed_stg_glob_lost_001",
] as const;

const STAGE_NAMES = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
const STAGE_COLORS = ["#6366f1", "#8b5cf6", "#3b82f6", "#f59e0b", "#22c55e", "#ef4444"];

// Company IDs – 8 per org
function companyId(org: "acme" | "glob", n: number) {
  return `clseed_comp_${org}_${String(n).padStart(6, "0")}`;
}

// Contact IDs – 22 per org
function contactId(org: "acme" | "glob", n: number) {
  return `clseed_cont_${org}_${String(n).padStart(6, "0")}`;
}

// Deal IDs – 18 per org
function dealId(org: "acme" | "glob", n: number) {
  return `clseed_deal_${org}_${String(n).padStart(6, "0")}`;
}

// Activity IDs – 45 per org
function activityId(org: "acme" | "glob", n: number) {
  return `clseed_actv_${org}_${String(n).padStart(6, "0")}`;
}

// Note IDs
function noteId(org: "acme" | "glob", n: number) {
  return `clseed_note_${org}_${String(n).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// Data definitions
// ---------------------------------------------------------------------------

interface OrgSeed {
  orgId: string;
  orgKey: "acme" | "glob";
  clerkOrgId: string;
  name: string;
  slug: string;
  members: {
    id: string;
    clerkUserId: string;
    email: string;
    name: string;
    role: "ADMIN" | "SALES_REP" | "VIEWER";
  }[];
  pipelineId: string;
  stageIds: readonly string[];
}

const ORGS: OrgSeed[] = [
  {
    orgId: ORG_ACME,
    orgKey: "acme",
    clerkOrgId: "org_acme_test_001",
    name: "Acme Corp",
    slug: "acme-corp",
    members: [
      { id: MEMBER_ACME_ADMIN, clerkUserId: "user_admin_acme_001", email: "admin@acme-corp.test", name: "Alice Johnson", role: "ADMIN" },
      { id: MEMBER_ACME_SALES, clerkUserId: "user_sales_acme_001", email: "sales@acme-corp.test", name: "Bob Martinez", role: "SALES_REP" },
      { id: MEMBER_ACME_VIEWER, clerkUserId: "user_viewer_acme_001", email: "viewer@acme-corp.test", name: "Carol Chen", role: "VIEWER" },
    ],
    pipelineId: PIPELINE_ACME,
    stageIds: STAGES_ACME,
  },
  {
    orgId: ORG_GLOBAL,
    orgKey: "glob",
    clerkOrgId: "org_global_test_001",
    name: "GlobalTrade Inc",
    slug: "globaltrade",
    members: [
      { id: MEMBER_GLOBAL_ADMIN, clerkUserId: "user_admin_global_001", email: "admin@globaltrade.test", name: "David Kim", role: "ADMIN" },
      { id: MEMBER_GLOBAL_SALES, clerkUserId: "user_sales_global_001", email: "sales@globaltrade.test", name: "Emily Davis", role: "SALES_REP" },
      { id: MEMBER_GLOBAL_VIEWER, clerkUserId: "user_viewer_global_001", email: "viewer@globaltrade.test", name: "Frank Wilson", role: "VIEWER" },
    ],
    pipelineId: PIPELINE_GLOBAL,
    stageIds: STAGES_GLOBAL,
  },
];

// ---------------------------------------------------------------------------
// Company data per org
// ---------------------------------------------------------------------------
interface CompanySeed {
  name: string;
  industry: string;
  size: string;
  website: string;
}

const COMPANIES_TEMPLATE: CompanySeed[] = [
  { name: "TechNova Solutions", industry: "Technology", size: "51-200", website: "https://technova.test" },
  { name: "Meridian Healthcare", industry: "Healthcare", size: "201-500", website: "https://meridian-health.test" },
  { name: "BlueSky Manufacturing", industry: "Manufacturing", size: "501-1000", website: "https://bluesky-mfg.test" },
  { name: "Pinnacle Financial", industry: "Financial Services", size: "1001-5000", website: "https://pinnacle-fin.test" },
  { name: "Evergreen Retail", industry: "Retail", size: "201-500", website: "https://evergreen-retail.test" },
  { name: "Apex Logistics", industry: "Logistics", size: "51-200", website: "https://apex-logistics.test" },
  { name: "Horizon Education", industry: "Education", size: "11-50", website: "https://horizon-edu.test" },
  { name: "Stratos Energy", industry: "Energy", size: "1001-5000", website: "https://stratos-energy.test" },
];

// ---------------------------------------------------------------------------
// Contact data per org (22 contacts, 15 linked to companies)
// ---------------------------------------------------------------------------
interface ContactSeed {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "PROSPECT" | "ACTIVE" | "CUSTOMER" | "CHURNED";
  companyIndex: number | null; // index into COMPANIES_TEMPLATE, null = no company
}

const CONTACTS_TEMPLATE: ContactSeed[] = [
  // Company 0 – TechNova (3 contacts)
  { firstName: "James", lastName: "Harper", email: "james.harper@technova.test", phone: "+1-555-0101", status: "CUSTOMER", companyIndex: 0 },
  { firstName: "Sophia", lastName: "Reyes", email: "sophia.reyes@technova.test", phone: "+1-555-0102", status: "ACTIVE", companyIndex: 0 },
  { firstName: "Liam", lastName: "Patel", email: "liam.patel@technova.test", phone: "+1-555-0103", status: "PROSPECT", companyIndex: 0 },
  // Company 1 – Meridian (2 contacts)
  { firstName: "Olivia", lastName: "Foster", email: "olivia.foster@meridian.test", phone: "+1-555-0201", status: "ACTIVE", companyIndex: 1 },
  { firstName: "Noah", lastName: "Grant", email: "noah.grant@meridian.test", phone: "+1-555-0202", status: "CUSTOMER", companyIndex: 1 },
  // Company 2 – BlueSky (2 contacts)
  { firstName: "Emma", lastName: "Walsh", email: "emma.walsh@bluesky.test", phone: "+1-555-0301", status: "PROSPECT", companyIndex: 2 },
  { firstName: "Mason", lastName: "Torres", email: "mason.torres@bluesky.test", phone: "+1-555-0302", status: "ACTIVE", companyIndex: 2 },
  // Company 3 – Pinnacle (2 contacts)
  { firstName: "Ava", lastName: "Brooks", email: "ava.brooks@pinnacle.test", phone: "+1-555-0401", status: "CUSTOMER", companyIndex: 3 },
  { firstName: "Ethan", lastName: "Reed", email: "ethan.reed@pinnacle.test", phone: "+1-555-0402", status: "ACTIVE", companyIndex: 3 },
  // Company 4 – Evergreen (2 contacts)
  { firstName: "Isabella", lastName: "Murphy", email: "isabella.murphy@evergreen.test", phone: "+1-555-0501", status: "PROSPECT", companyIndex: 4 },
  { firstName: "Lucas", lastName: "Stewart", email: "lucas.stewart@evergreen.test", phone: "+1-555-0502", status: "CHURNED", companyIndex: 4 },
  // Company 5 – Apex (2 contacts)
  { firstName: "Mia", lastName: "Cooper", email: "mia.cooper@apex.test", phone: "+1-555-0601", status: "ACTIVE", companyIndex: 5 },
  { firstName: "Alexander", lastName: "Price", email: "alexander.price@apex.test", phone: "+1-555-0602", status: "PROSPECT", companyIndex: 5 },
  // Company 6 – Horizon (1 contact)
  { firstName: "Charlotte", lastName: "Bennett", email: "charlotte.bennett@horizon.test", phone: "+1-555-0701", status: "CUSTOMER", companyIndex: 6 },
  // Company 7 – Stratos (1 contact)
  { firstName: "Benjamin", lastName: "Howard", email: "benjamin.howard@stratos.test", phone: "+1-555-0801", status: "ACTIVE", companyIndex: 7 },
  // Unlinked contacts (7)
  { firstName: "Amelia", lastName: "Cox", email: "amelia.cox@example.test", phone: "+1-555-0901", status: "PROSPECT", companyIndex: null },
  { firstName: "Daniel", lastName: "Ward", email: "daniel.ward@example.test", phone: "+1-555-0902", status: "ACTIVE", companyIndex: null },
  { firstName: "Harper", lastName: "Morgan", email: "harper.morgan@example.test", phone: "+1-555-0903", status: "PROSPECT", companyIndex: null },
  { firstName: "Sebastian", lastName: "Bailey", email: "sebastian.bailey@example.test", phone: "+1-555-0904", status: "CHURNED", companyIndex: null },
  { firstName: "Ella", lastName: "Rivera", email: "ella.rivera@example.test", phone: "+1-555-0905", status: "CUSTOMER", companyIndex: null },
  { firstName: "Jack", lastName: "Hughes", email: "jack.hughes@example.test", phone: "+1-555-0906", status: "ACTIVE", companyIndex: null },
  { firstName: "Scarlett", lastName: "Long", email: "scarlett.long@example.test", phone: "+1-555-0907", status: "PROSPECT", companyIndex: null },
];

// ---------------------------------------------------------------------------
// Deal data per org (18 deals)
// ---------------------------------------------------------------------------
interface DealSeed {
  title: string;
  value: number;
  stageIndex: number; // 0-5 → Lead..Closed Lost
  contactIndex: number; // into CONTACTS_TEMPLATE
  companyIndex: number | null;
  ownerIndex: number; // 0 = admin, 1 = sales rep
  expectedCloseOffset: number; // days from BASE_DATE (negative = past)
  description: string;
}

const DEALS_TEMPLATE: DealSeed[] = [
  // Lead (3)
  { title: "TechNova CRM Integration", value: 45000, stageIndex: 0, contactIndex: 0, companyIndex: 0, ownerIndex: 1, expectedCloseOffset: 45, description: "Full CRM suite integration for engineering team" },
  { title: "Website Redesign Proposal", value: 15000, stageIndex: 0, contactIndex: 15, companyIndex: null, ownerIndex: 1, expectedCloseOffset: 30, description: "Complete website overhaul with new branding" },
  { title: "Data Analytics Platform", value: 85000, stageIndex: 0, contactIndex: 5, companyIndex: 2, ownerIndex: 0, expectedCloseOffset: 60, description: "Enterprise analytics platform deployment" },
  // Qualified (3)
  { title: "Meridian EHR Upgrade", value: 120000, stageIndex: 1, contactIndex: 3, companyIndex: 1, ownerIndex: 1, expectedCloseOffset: 20, description: "Electronic health records system upgrade" },
  { title: "Supply Chain Optimization", value: 67000, stageIndex: 1, contactIndex: 6, companyIndex: 2, ownerIndex: 0, expectedCloseOffset: 35, description: "End-to-end supply chain software" },
  { title: "Employee Training Portal", value: 28000, stageIndex: 1, contactIndex: 13, companyIndex: 6, ownerIndex: 1, expectedCloseOffset: 25, description: "LMS platform for staff development" },
  // Proposal (3)
  { title: "Financial Dashboard Suite", value: 195000, stageIndex: 2, contactIndex: 7, companyIndex: 3, ownerIndex: 0, expectedCloseOffset: 15, description: "Real-time financial reporting dashboards" },
  { title: "Retail POS Modernization", value: 55000, stageIndex: 2, contactIndex: 9, companyIndex: 4, ownerIndex: 1, expectedCloseOffset: 10, description: "Next-gen point-of-sale system rollout" },
  { title: "Logistics Route Planner", value: 42000, stageIndex: 2, contactIndex: 11, companyIndex: 5, ownerIndex: 1, expectedCloseOffset: 18, description: "AI-powered delivery route optimization" },
  // Negotiation (3)
  { title: "Cloud Migration Project", value: 310000, stageIndex: 3, contactIndex: 1, companyIndex: 0, ownerIndex: 0, expectedCloseOffset: 5, description: "Full infrastructure migration to cloud" },
  { title: "Compliance Automation", value: 78000, stageIndex: 3, contactIndex: 4, companyIndex: 1, ownerIndex: 1, expectedCloseOffset: 8, description: "Automated regulatory compliance system" },
  { title: "Energy Grid Monitoring", value: 250000, stageIndex: 3, contactIndex: 14, companyIndex: 7, ownerIndex: 0, expectedCloseOffset: 12, description: "Real-time grid monitoring and alerting" },
  // Closed Won (3)
  { title: "Security Audit Package", value: 35000, stageIndex: 4, contactIndex: 2, companyIndex: 0, ownerIndex: 1, expectedCloseOffset: -10, description: "Comprehensive security audit and remediation" },
  { title: "Inventory Management System", value: 92000, stageIndex: 4, contactIndex: 10, companyIndex: 4, ownerIndex: 0, expectedCloseOffset: -15, description: "Warehouse inventory tracking system" },
  { title: "API Integration Hub", value: 48000, stageIndex: 4, contactIndex: 16, companyIndex: null, ownerIndex: 1, expectedCloseOffset: -5, description: "Centralized API gateway and management" },
  // Closed Lost (3)
  { title: "Mobile App Development", value: 175000, stageIndex: 5, contactIndex: 8, companyIndex: 3, ownerIndex: 0, expectedCloseOffset: -20, description: "Native mobile application for field teams" },
  { title: "HR Payroll Integration", value: 62000, stageIndex: 5, contactIndex: 17, companyIndex: null, ownerIndex: 1, expectedCloseOffset: -25, description: "Payroll system integration with HR platform" },
  { title: "Customer Portal Redesign", value: 5000, stageIndex: 5, contactIndex: 12, companyIndex: 5, ownerIndex: 1, expectedCloseOffset: -30, description: "Self-service customer portal" },
];

// ---------------------------------------------------------------------------
// Activity data per org (45 activities: 10 calls, 10 emails, 8 meetings, 10 tasks, 7 notes)
// ---------------------------------------------------------------------------
interface ActivitySeed {
  type: "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE";
  title: string;
  description: string;
  daysAgoCreated: number;
  completed: boolean;
  dealIndex: number | null;
  contactIndex: number;
  ownerIndex: number; // 0 = admin, 1 = sales rep
}

const ACTIVITIES_TEMPLATE: ActivitySeed[] = [
  // CALLS (10)
  { type: "CALL", title: "Discovery call with James Harper", description: "Initial requirements gathering for CRM integration", daysAgoCreated: 2, completed: true, dealIndex: 0, contactIndex: 0, ownerIndex: 1 },
  { type: "CALL", title: "Follow-up call with Olivia Foster", description: "Discussed EHR upgrade timeline and budget", daysAgoCreated: 5, completed: true, dealIndex: 3, contactIndex: 3, ownerIndex: 1 },
  { type: "CALL", title: "Cold call to Amelia Cox", description: "Introduced our services, scheduled a follow-up", daysAgoCreated: 8, completed: true, dealIndex: null, contactIndex: 15, ownerIndex: 1 },
  { type: "CALL", title: "Pricing discussion with Ava Brooks", description: "Reviewed financial dashboard pricing tiers", daysAgoCreated: 12, completed: true, dealIndex: 6, contactIndex: 7, ownerIndex: 0 },
  { type: "CALL", title: "Technical review with Sophia Reyes", description: "Cloud migration architecture discussion", daysAgoCreated: 15, completed: true, dealIndex: 9, contactIndex: 1, ownerIndex: 0 },
  { type: "CALL", title: "Contract negotiation with Noah Grant", description: "Final terms for compliance automation", daysAgoCreated: 20, completed: true, dealIndex: 10, contactIndex: 4, ownerIndex: 1 },
  { type: "CALL", title: "Onboarding call with Liam Patel", description: "Security audit kickoff and scope review", daysAgoCreated: 30, completed: true, dealIndex: 12, contactIndex: 2, ownerIndex: 1 },
  { type: "CALL", title: "Quarterly review with Isabella Murphy", description: "Reviewed retail POS project progress", daysAgoCreated: 40, completed: true, dealIndex: 7, contactIndex: 9, ownerIndex: 1 },
  { type: "CALL", title: "Reference check with Daniel Ward", description: "Customer reference for API integration", daysAgoCreated: 55, completed: true, dealIndex: 14, contactIndex: 16, ownerIndex: 1 },
  { type: "CALL", title: "Renewal discussion with Charlotte Bennett", description: "Training portal annual renewal", daysAgoCreated: 70, completed: true, dealIndex: 5, contactIndex: 13, ownerIndex: 1 },

  // EMAILS (10)
  { type: "EMAIL", title: "Proposal sent to Ava Brooks", description: "Attached financial dashboard suite proposal PDF", daysAgoCreated: 1, completed: true, dealIndex: 6, contactIndex: 7, ownerIndex: 0 },
  { type: "EMAIL", title: "Follow-up email to Emma Walsh", description: "Sent analytics platform brochure and case studies", daysAgoCreated: 4, completed: true, dealIndex: 2, contactIndex: 5, ownerIndex: 0 },
  { type: "EMAIL", title: "Contract draft to Sophia Reyes", description: "Cloud migration contract for legal review", daysAgoCreated: 7, completed: true, dealIndex: 9, contactIndex: 1, ownerIndex: 0 },
  { type: "EMAIL", title: "Meeting recap to Olivia Foster", description: "Summary of EHR upgrade requirements discussion", daysAgoCreated: 10, completed: true, dealIndex: 3, contactIndex: 3, ownerIndex: 1 },
  { type: "EMAIL", title: "Pricing update to Mia Cooper", description: "Updated logistics route planner pricing sheet", daysAgoCreated: 18, completed: true, dealIndex: 8, contactIndex: 11, ownerIndex: 1 },
  { type: "EMAIL", title: "Thank you email to Lucas Stewart", description: "Post-meeting appreciation and next steps", daysAgoCreated: 25, completed: true, dealIndex: null, contactIndex: 10, ownerIndex: 1 },
  { type: "EMAIL", title: "Case study shared with Harper Morgan", description: "Relevant industry case study for prospect nurturing", daysAgoCreated: 35, completed: true, dealIndex: null, contactIndex: 17, ownerIndex: 1 },
  { type: "EMAIL", title: "Invoice sent to Liam Patel", description: "Security audit milestone 1 invoice", daysAgoCreated: 45, completed: true, dealIndex: 12, contactIndex: 2, ownerIndex: 1 },
  { type: "EMAIL", title: "Welcome email to Ella Rivera", description: "Onboarding welcome and portal access credentials", daysAgoCreated: 60, completed: true, dealIndex: null, contactIndex: 19, ownerIndex: 0 },
  { type: "EMAIL", title: "NDA sent to Benjamin Howard", description: "Non-disclosure agreement for energy grid project", daysAgoCreated: 75, completed: true, dealIndex: 11, contactIndex: 14, ownerIndex: 0 },

  // MEETINGS (8)
  { type: "MEETING", title: "Demo presentation for TechNova", description: "Product demo for CRM integration features", daysAgoCreated: 3, completed: true, dealIndex: 0, contactIndex: 0, ownerIndex: 1 },
  { type: "MEETING", title: "Executive briefing at Pinnacle", description: "C-suite presentation for financial dashboards", daysAgoCreated: 9, completed: true, dealIndex: 6, contactIndex: 7, ownerIndex: 0 },
  { type: "MEETING", title: "Technical workshop with BlueSky", description: "Supply chain optimization technical deep-dive", daysAgoCreated: 16, completed: true, dealIndex: 4, contactIndex: 6, ownerIndex: 0 },
  { type: "MEETING", title: "Contract signing with Meridian", description: "Compliance automation contract finalization", daysAgoCreated: 22, completed: true, dealIndex: 10, contactIndex: 4, ownerIndex: 1 },
  { type: "MEETING", title: "Kickoff meeting for security audit", description: "Project kickoff with TechNova security team", daysAgoCreated: 32, completed: true, dealIndex: 12, contactIndex: 2, ownerIndex: 1 },
  { type: "MEETING", title: "QBR with Evergreen Retail", description: "Quarterly business review with retail team", daysAgoCreated: 42, completed: true, dealIndex: 13, contactIndex: 10, ownerIndex: 0 },
  { type: "MEETING", title: "Strategy session for energy grid", description: "Architecture planning for grid monitoring system", daysAgoCreated: 50, completed: false, dealIndex: 11, contactIndex: 14, ownerIndex: 0 },
  { type: "MEETING", title: "Lunch meeting with Apex team", description: "Relationship building with logistics team leads", daysAgoCreated: 65, completed: true, dealIndex: 8, contactIndex: 11, ownerIndex: 1 },

  // TASKS (10)
  { type: "TASK", title: "Prepare proposal for cloud migration", description: "Draft SOW and timeline for cloud migration project", daysAgoCreated: 1, completed: false, dealIndex: 9, contactIndex: 1, ownerIndex: 0 },
  { type: "TASK", title: "Update CRM pricing model", description: "Revise pricing tiers based on competitor analysis", daysAgoCreated: 3, completed: false, dealIndex: 0, contactIndex: 0, ownerIndex: 1 },
  { type: "TASK", title: "Send reference contacts to Olivia", description: "Compile customer references for EHR upgrade deal", daysAgoCreated: 6, completed: true, dealIndex: 3, contactIndex: 3, ownerIndex: 1 },
  { type: "TASK", title: "Review contract redlines", description: "Legal review of compliance automation contract changes", daysAgoCreated: 14, completed: true, dealIndex: 10, contactIndex: 4, ownerIndex: 1 },
  { type: "TASK", title: "Schedule product demo", description: "Coordinate demo schedule with BlueSky manufacturing", daysAgoCreated: 19, completed: true, dealIndex: 2, contactIndex: 5, ownerIndex: 0 },
  { type: "TASK", title: "Create ROI calculator", description: "Build custom ROI spreadsheet for financial dashboard deal", daysAgoCreated: 28, completed: true, dealIndex: 6, contactIndex: 7, ownerIndex: 0 },
  { type: "TASK", title: "Follow up on stale leads", description: "Re-engage prospects who have not responded in 2 weeks", daysAgoCreated: 36, completed: true, dealIndex: null, contactIndex: 17, ownerIndex: 1 },
  { type: "TASK", title: "Update deal forecasts", description: "Monthly pipeline forecast update for management review", daysAgoCreated: 48, completed: true, dealIndex: null, contactIndex: 16, ownerIndex: 0 },
  { type: "TASK", title: "Prepare case study draft", description: "Write up inventory management success story", daysAgoCreated: 58, completed: true, dealIndex: 13, contactIndex: 10, ownerIndex: 0 },
  { type: "TASK", title: "Competitor analysis report", description: "Research competitor pricing and feature comparison", daysAgoCreated: 80, completed: true, dealIndex: null, contactIndex: 15, ownerIndex: 1 },

  // NOTES (7)
  { type: "NOTE", title: "Decision maker identified at TechNova", description: "James Harper confirmed as primary decision maker for all tech purchases", daysAgoCreated: 4, completed: true, dealIndex: 0, contactIndex: 0, ownerIndex: 1 },
  { type: "NOTE", title: "Budget approval pending at Meridian", description: "Olivia mentioned Q3 budget cycle, decision expected by mid-month", daysAgoCreated: 11, completed: true, dealIndex: 3, contactIndex: 3, ownerIndex: 1 },
  { type: "NOTE", title: "Competitor evaluation at Pinnacle", description: "Pinnacle is also evaluating two other vendors for financial dashboards", daysAgoCreated: 17, completed: true, dealIndex: 6, contactIndex: 7, ownerIndex: 0 },
  { type: "NOTE", title: "Technical requirements clarified", description: "Cloud migration must support hybrid deployment for first 6 months", daysAgoCreated: 24, completed: true, dealIndex: 9, contactIndex: 1, ownerIndex: 0 },
  { type: "NOTE", title: "Stakeholder map updated", description: "Added CFO and CTO as additional stakeholders for energy grid project", daysAgoCreated: 38, completed: true, dealIndex: 11, contactIndex: 14, ownerIndex: 0 },
  { type: "NOTE", title: "Lost deal post-mortem", description: "Mobile app deal lost to competitor with lower pricing. Need to review enterprise tier", daysAgoCreated: 52, completed: true, dealIndex: 15, contactIndex: 8, ownerIndex: 0 },
  { type: "NOTE", title: "Upsell opportunity at Evergreen", description: "Lucas mentioned interest in additional POS locations for 2027 expansion", daysAgoCreated: 68, completed: true, dealIndex: 13, contactIndex: 10, ownerIndex: 0 },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function main() {
  console.log("Seeding database...\n");

  // ── 1. Clear all data in FK-safe order ──────────────────────────────
  console.log("Clearing existing data...");
  await prisma.note.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.member.deleteMany();
  await prisma.organization.deleteMany();
  console.log("  Done.\n");

  for (const org of ORGS) {
    console.log(`Creating org: ${org.name}`);

    // ── 2. Organization ─────────────────────────────────────────────
    await prisma.organization.create({
      data: {
        id: org.orgId,
        clerkOrgId: org.clerkOrgId,
        name: org.name,
        slug: org.slug,
        createdAt: daysAgo(90),
      },
    });

    // ── 3. Members ──────────────────────────────────────────────────
    for (const m of org.members) {
      await prisma.member.create({
        data: {
          id: m.id,
          clerkUserId: m.clerkUserId,
          organizationId: org.orgId,
          email: m.email,
          name: m.name,
          role: m.role,
          createdAt: daysAgo(90),
        },
      });
    }
    console.log(`  ${org.members.length} members created`);

    // ── 4. Pipeline & Stages ────────────────────────────────────────
    await prisma.pipeline.create({
      data: {
        id: org.pipelineId,
        organizationId: org.orgId,
        name: "Sales Pipeline",
        createdAt: daysAgo(90),
      },
    });

    for (let i = 0; i < 6; i++) {
      await prisma.stage.create({
        data: {
          id: org.stageIds[i],
          pipelineId: org.pipelineId,
          name: STAGE_NAMES[i],
          order: i,
          color: STAGE_COLORS[i],
          createdAt: daysAgo(90),
        },
      });
    }
    console.log("  1 pipeline with 6 stages created");

    // ── 5. Companies ────────────────────────────────────────────────
    for (let i = 0; i < COMPANIES_TEMPLATE.length; i++) {
      const c = COMPANIES_TEMPLATE[i];
      await prisma.company.create({
        data: {
          id: companyId(org.orgKey, i + 1),
          organizationId: org.orgId,
          name: c.name,
          industry: c.industry,
          size: c.size,
          website: c.website,
          createdAt: daysAgo(85 - i * 3),
          updatedAt: daysAgo(10 - i),
        },
      });
    }
    console.log(`  ${COMPANIES_TEMPLATE.length} companies created`);

    // ── 6. Contacts ─────────────────────────────────────────────────
    for (let i = 0; i < CONTACTS_TEMPLATE.length; i++) {
      const ct = CONTACTS_TEMPLATE[i];
      await prisma.contact.create({
        data: {
          id: contactId(org.orgKey, i + 1),
          organizationId: org.orgId,
          companyId: ct.companyIndex !== null ? companyId(org.orgKey, ct.companyIndex + 1) : null,
          firstName: ct.firstName,
          lastName: ct.lastName,
          email: ct.email,
          phone: ct.phone,
          status: ct.status,
          createdAt: daysAgo(80 - i * 2),
          updatedAt: daysAgo(5),
        },
      });
    }
    console.log(`  ${CONTACTS_TEMPLATE.length} contacts created`);

    // Helper: resolve member ID from ownerIndex
    const ownerIds = [org.members[0].id, org.members[1].id]; // admin, sales

    // ── 7. Deals ────────────────────────────────────────────────────
    for (let i = 0; i < DEALS_TEMPLATE.length; i++) {
      const d = DEALS_TEMPLATE[i];
      await prisma.deal.create({
        data: {
          id: dealId(org.orgKey, i + 1),
          organizationId: org.orgId,
          stageId: org.stageIds[d.stageIndex],
          contactId: contactId(org.orgKey, d.contactIndex + 1),
          companyId: d.companyIndex !== null ? companyId(org.orgKey, d.companyIndex + 1) : null,
          ownerId: ownerIds[d.ownerIndex],
          title: d.title,
          value: d.value,
          currency: "USD",
          expectedCloseDate: daysFromNow(d.expectedCloseOffset),
          description: d.description,
          createdAt: daysAgo(60 - i * 2),
          updatedAt: daysAgo(i),
        },
      });
    }
    console.log(`  ${DEALS_TEMPLATE.length} deals created`);

    // ── 8. Activities ───────────────────────────────────────────────
    for (let i = 0; i < ACTIVITIES_TEMPLATE.length; i++) {
      const a = ACTIVITIES_TEMPLATE[i];
      await prisma.activity.create({
        data: {
          id: activityId(org.orgKey, i + 1),
          organizationId: org.orgId,
          dealId: a.dealIndex !== null ? dealId(org.orgKey, a.dealIndex + 1) : null,
          contactId: contactId(org.orgKey, a.contactIndex + 1),
          createdById: ownerIds[a.ownerIndex],
          type: a.type,
          title: a.title,
          description: a.description,
          completedAt: a.completed ? daysAgo(a.daysAgoCreated) : null,
          dueDate: a.type === "TASK" ? daysAgo(a.daysAgoCreated - 3) : null,
          createdAt: daysAgo(a.daysAgoCreated),
        },
      });
    }
    console.log(`  ${ACTIVITIES_TEMPLATE.length} activities created`);

    // ── 9. Notes (on deals with activities that are NOTE type) ──────
    // Create a few notes on deals to populate the Note model
    const noteDeals = [0, 3, 6, 9, 11, 13, 15]; // deal indices that get notes
    for (let i = 0; i < noteDeals.length; i++) {
      const di = noteDeals[i];
      const deal = DEALS_TEMPLATE[di];
      await prisma.note.create({
        data: {
          id: noteId(org.orgKey, i + 1),
          dealId: dealId(org.orgKey, di + 1),
          content: `Internal note for "${deal.title}": ${deal.description}. Follow up scheduled.`,
          createdAt: daysAgo(30 - i * 3),
        },
      });
    }
    console.log(`  ${noteDeals.length} notes created`);

    console.log();
  }

  console.log("Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
