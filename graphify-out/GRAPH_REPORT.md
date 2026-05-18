# Graph Report - /Users/lovinemanuel/Desktop/PallEx Check/PallEx Check  (2026-05-18)

## Corpus Check
- Corpus is ~26,917 words - fits in a single context window. You may not need a graph.

## Summary
- 372 nodes · 579 edges · 26 communities (19 shown, 7 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Admin UI & Layout|Admin UI & Layout]]
- [[_COMMUNITY_Driver & Vehicle Edit Forms|Driver & Vehicle Edit Forms]]
- [[_COMMUNITY_Navigation Components|Navigation Components]]
- [[_COMMUNITY_Admin Export Wrappers|Admin Export Wrappers]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Admin Pages (ChecklistsIncidents)|Admin Pages (Checklists/Incidents)]]
- [[_COMMUNITY_Admin Filter & Lists|Admin Filter & Lists]]
- [[_COMMUNITY_App Route Setup|App Route Setup]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Checklist Wizard|Checklist Wizard]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_Incident Status Actions|Incident Status Actions]]
- [[_COMMUNITY_Export Button & Wrappers|Export Button & Wrappers]]
- [[_COMMUNITY_Loading States|Loading States]]
- [[_COMMUNITY_PWA Icons|PWA Icons]]
- [[_COMMUNITY_Driver Dashboard|Driver Dashboard]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Next.js PWA Config|Next.js PWA Config]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Auth Loading|Auth Loading]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Error Page|Error Page]]

## God Nodes (most connected - your core abstractions)
1. `PallEx Check Setup Guide` - 19 edges
2. `Card()` - 18 edges
3. `createClient()` - 18 edges
4. `compilerOptions` - 15 edges
5. `Button` - 14 edges
6. `lib/supabase/server.ts` - 12 edges
7. `Badge()` - 11 edges
8. `createClient()` - 11 edges
9. `Supabase (Auth + DB)` - 9 edges
10. `Input` - 8 edges

## Surprising Connections (you probably didn't know these)
- `checklists/new/page.tsx` --conceptually_related_to--> `Incident Locking / Immutability`  [INFERRED]
  src/app/(protected)/checklists/new/page.tsx → supabase-migration-incidents-v2.sql
- `src/app/layout.tsx` --implements--> `PWA (Progressive Web App)`  [EXTRACTED]
  src/app/layout.tsx → public/manifest.json
- `auth/register/page.tsx` --references--> `Admin Role Authorization`  [EXTRACTED]
  src/app/auth/register/page.tsx → supabase-schema.sql
- `Apple Touch Icon (180px)` --variant_of--> `App Icon 512px`  [INFERRED]
  public/icons/apple-touch-icon.png → public/icons/icon-512.png
- `App Icon 192px` --variant_of--> `App Icon 512px`  [INFERRED]
  public/icons/icon-192.png → public/icons/icon-512.png

## Communities (26 total, 7 thin omitted)

### Community 0 - "Admin UI & Layout"
Cohesion: 0.07
Nodes (25): AdminFilterBar(), AdminFilterBarProps, FilterOption, ACTION_COLORS, PageProps, PageProps, ActivityItem, AdminDashboard() (+17 more)

### Community 1 - "Driver & Vehicle Edit Forms"
Cohesion: 0.08
Nodes (22): Driver, EditDriverForm(), Props, Vehicle, Driver, EditVehicleForm(), Props, Vehicle (+14 more)

### Community 2 - "Navigation Components"
Cohesion: 0.11
Nodes (21): BottomNav(), BottomNavProps, NavItem, navItems, NavItem, navItems, Sidebar(), SidebarProps (+13 more)

### Community 3 - "Admin Export Wrappers"
Cohesion: 0.10
Nodes (24): components/admin/ExportButton.tsx, admin/checklists/page.tsx, admin/drivers/[id]/page.tsx, admin/incidents/IncidentsExportWrapper.tsx, admin/vehicles/[id]/page.tsx, src/app/layout.tsx, admin/audit-logs/AuditExportWrapper.tsx, checklists/[id]/page.tsx (ChecklistDetailPage) (+16 more)

### Community 4 - "Package Dependencies"
Cohesion: 0.07
Nodes (26): dependencies, lucide-react, next, next-pwa, react, react-dom, react-hot-toast, @supabase/ssr (+18 more)

### Community 5 - "Admin Pages (Checklists/Incidents)"
Cohesion: 0.14
Nodes (14): admin/incidents/page.tsx, admin/layout.tsx, api/admin/users/route.ts, auth/register/page.tsx, checklists/page.tsx, Admin Role Authorization, Audit Trail / Append-only Log, Checklist Auto-Lock on Submit (+6 more)

### Community 6 - "Admin Filter & Lists"
Cohesion: 0.13
Nodes (22): components/admin/AdminFilterBar.tsx, admin/audit-logs/page.tsx, admin/drivers/new/page.tsx, admin/drivers/page.tsx, admin/vehicles/new/page.tsx, admin/vehicles/page.tsx, src/app/page.tsx, auth/login/page.tsx (+14 more)

### Community 7 - "App Route Setup"
Cohesion: 0.14
Nodes (22): PallEx Check Setup Guide, Login Page (app/auth/login), Registration Page (app/auth/register), Checklists (list + new form), Dashboard (Role-aware home screen), Drivers Admin (driver management), Incidents (list + report form), Settings (profile settings) (+14 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "Checklist Wizard"
Cohesion: 0.14
Nodes (8): ChecklistWizard(), ChecklistWizardProps, PhotoSlot, PhotoState, SAFETY_GROUPS, SafetyChecks, STEP_LABELS, Vehicle

### Community 10 - "PWA Manifest"
Cohesion: 0.14
Nodes (13): background_color, categories, description, display, icons, lang, name, orientation (+5 more)

### Community 11 - "Incident Status Actions"
Cohesion: 0.21
Nodes (10): IncidentStatus, IncidentStatusActions(), Props, STATUS_LABELS, StatusAction, TRANSITIONS, fmt(), IncidentDetailPage() (+2 more)

### Community 12 - "Export Button & Wrappers"
Cohesion: 0.21
Nodes (8): ExportButton(), ExportButtonProps, AuditExportWrapper(), Props, ChecklistsExportWrapper(), Props, IncidentsExportWrapper(), Props

### Community 13 - "Loading States"
Cohesion: 0.28
Nodes (3): PageSpinner(), sizes, SpinnerProps

### Community 14 - "PWA Icons"
Cohesion: 0.29
Nodes (7): Apple Touch Icon (180px), App Icon 128px, App Icon 192px, App Icon 384px, App Icon 512px, App Icon 72px, App Icon 96px

### Community 15 - "Driver Dashboard"
Cohesion: 0.40
Nodes (4): DriverDashboard(), getGreeting(), Props, Vehicle

## Knowledge Gaps
- **151 isolated node(s):** `config`, `config`, `name`, `version`, `private` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Admin UI & Layout` to `Checklist Wizard`, `Navigation Components`, `Incident Status Actions`, `Driver & Vehicle Edit Forms`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Row Level Security (RLS)` connect `Admin Pages (Checklists/Incidents)` to `Admin Export Wrappers`, `Admin Filter & Lists`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Card()` connect `Admin UI & Layout` to `Driver & Vehicle Edit Forms`, `Incident Status Actions`, `Checklist Wizard`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `config`, `config`, `name` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin UI & Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Driver & Vehicle Edit Forms` be split into smaller, more focused modules?**
  _Cohesion score 0.07781649245063879 - nodes in this community are weakly interconnected._
- **Should `Navigation Components` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._