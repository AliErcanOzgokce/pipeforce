# Design System -- PipeForce

## Product Context
- **What this is:** B2B CRM Sales Pipeline Manager
- **Who it's for:** Sales teams managing deals through a pipeline
- **Space/industry:** CRM (HubSpot, Pipedrive, Attio, Close)
- **Project type:** Web app (dashboard)
- **Memorable thing:** "This feels like $200/seat software"

## Aesthetic Direction
- **Direction:** Industrial/Refined -- data-dense but elegant
- **Decoration level:** Minimal -- typography and spacing do the work
- **Mood:** Premium professional tool. Every element earns its space. No decoration for decoration's sake.
- **Competitors analyzed:** HubSpot (corporate/orange), Pipedrive (generic/green), Attio (minimal/monochrome), Close (dark/bold)

## Typography
- **Display/Hero:** Instrument Serif -- warm, sophisticated, breaks the CRM mold. Page titles and hero metric numbers only.
- **Body:** DM Sans -- geometric clarity, tabular number support. Everything else.
- **Data/Tables:** DM Sans with tabular-nums feature
- **Code/IDs:** JetBrains Mono
- **Loading:** Google Fonts CDN
- **Scale:**
  - Display: 40px / 2.5rem (Instrument Serif)
  - Page title: 28px / 1.75rem (Instrument Serif)
  - Section heading: 20px / 1.25rem (DM Sans 600)
  - Card title: 16px / 1rem (DM Sans 600)
  - Body: 15px / 0.9375rem (DM Sans 400)
  - Small/Label: 13px / 0.8125rem (DM Sans 500)
  - Micro/Caption: 12px / 0.75rem (DM Sans 500, uppercase, tracking 0.04em)

## Color

### Approach: Restrained
One accent (indigo) + warm grays. Color is rare and meaningful.

### Light Mode
```css
--background: #fafaf9;
--surface: #ffffff;
--surface-elevated: #ffffff;
--border: #e7e5e4;
--border-subtle: #f5f5f4;
--text: #1c1917;
--text-secondary: #57534e;
--text-muted: #a8a29e;
--primary: #4f46e5;
--primary-hover: #4338ca;
--primary-light: #eef2ff;
--primary-foreground: #ffffff;
```

### Dark Mode
```css
--background: #0c0a09;
--surface: #1c1917;
--surface-elevated: #292524;
--border: #292524;
--border-subtle: #1c1917;
--text: #fafaf9;
--text-secondary: #a8a29e;
--text-muted: #78716c;
--primary-light: #1e1b4b;
```

### Sidebar
```css
--sidebar-bg: #1c1917;
--sidebar-text: #d6d3d1;
--sidebar-active-bg: #4f46e5;
--sidebar-hover-bg: rgba(255,255,255,0.06);
```

### Semantic
```css
--success: #16a34a;
--success-light: #f0fdf4;
--warning: #d97706;
--warning-light: #fffbeb;
--error: #dc2626;
--error-light: #fef2f2;
--info: #2563eb;
--info-light: #eff6ff;
```

### Pipeline Stages
```css
--stage-lead: #6366f1;
--stage-qualified: #8b5cf6;
--stage-proposal: #3b82f6;
--stage-negotiation: #f59e0b;
--stage-won: #16a34a;
--stage-lost: #dc2626;
```

### Contact Status
```css
--status-prospect: #3b82f6;
--status-active: #16a34a;
--status-customer: #8b5cf6;
--status-churned: #78716c;
```

### Activity Types
```css
--activity-call: #16a34a;
--activity-email: #3b82f6;
--activity-meeting: #8b5cf6;
--activity-task: #f59e0b;
--activity-note: #78716c;
```

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)
- **Page padding:** 24px
- **Card internal padding:** 16px (compact), 24px (detail)
- **Section gap:** 24px (space-y-6)
- **Form field gap:** 16px

## Layout
- **Approach:** Grid-disciplined
- **Sidebar:** 240px fixed, dark (--sidebar-bg), collapsible
- **Header:** 52px fixed height
- **Content max-width:** None (full-width within main area)
- **Border radius:** sm: 6px, md: 8px, lg: 12px, full: 9999px (badges/avatars)
- **Card elevation:** 1px border + shadow-sm (0 1px 2px rgba(0,0,0,0.04))
- **Card hover elevation:** shadow-md (0 2px 8px rgba(0,0,0,0.06))

## Motion
- **Approach:** Intentional
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(100ms) short(150ms) medium(250ms) long(400ms)
- **Hover transitions:** 150ms ease-out
- **Page transitions:** 200ms ease-out
- **Drag overlay:** 200ms ease-in-out with subtle scale(1.02)

## Component Patterns

### Buttons
- Primary: bg-primary, text-white, hover:bg-primary-hover
- Secondary: bg-surface, border, hover:bg-background
- Ghost: transparent, hover:bg-background
- Destructive: bg-error, text-white

### Badges
- Use pill shape (border-radius: 9999px)
- Semantic colors with light background + darker text
- Stage badges: colored dot + text in neutral pill

### Tables
- Header: uppercase 12px, muted color, bg-background
- Rows: hover:bg-background, 1px subtle border between rows
- Values: mono font, right-aligned, green-tinted for currency
- Clickable rows: cursor-pointer + hover effect

### Cards (Metrics)
- Surface background, 1px border, shadow-sm
- Label: micro size, uppercase, muted
- Value: display font (Instrument Serif), 28px
- Trend: small text, green (up) / red (down)

### Loading States
- Skeleton loaders with shimmer animation
- Match card/table/list dimensions

### Empty States
- Centered in content area
- Descriptive text + CTA button
- "No deals yet. Create your first deal to get started."

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-29 | Initial design system | Created via /design-consultation. Competitor research: HubSpot, Pipedrive, Attio, Close. Indigo primary chosen for distinction. Instrument Serif display font for premium feel. |
