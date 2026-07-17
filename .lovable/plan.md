
# ERAP Polish — Deep Refactor Plan

Goal: bring every module (`/`, `/users`, `/agents`, `/sessions`, `/console`, `/security`) onto one shared shell and one shared visual/interaction system. Each module keeps its features and logic; only the chrome, primitives, and states are unified.

## 1. Shared AppShell

Create `src/components/shell/AppShell.tsx` used by every route.

- Dark sidebar (existing tokens) with role-aware grouped nav: Overview · Devices · Operations · Identity · Security · Settings. Active route via `useRouterState`.
- Collapsible sidebar (icon rail) with persistent `SidebarTrigger` in the top bar.
- Top bar: breadcrumb trail (derived from route + optional per-page override), global search, notifications button, role switcher, user menu.
- `<PageHeader title description actions breadcrumbs>` primitive rendered under the top bar for every page.
- Single `<main>` landmark, `h-dvh`, skip-to-content link.

Routes are refactored to render `<AppShell><PageHeader/>…content…</AppShell>` instead of each carrying its own bespoke sidebar. The bespoke sidebars in `DeviceManagement`, `UsersModule`, `AgentManagement`, `SessionsModule`, `RemoteSessionConsole`, `SecurityCenter` are removed in favor of the shared one.

## 2. Visual system

`src/styles.css`:
- Consolidate tokens: `--primary` enterprise blue, `--success`, `--warning`, `--danger`, `--info`, `--status-online/offline/idle/pending`, plus `--surface`, `--surface-muted`, `--elevated`.
- Register in `@theme inline` so utilities like `bg-success`, `text-danger` work.
- Typography scale: display / h1 / h2 / h3 / body / small / mono. One display font (via `<link>` in `__root.tsx`) + system body.
- Radius, shadow, and focus-ring tokens.

Primitives:
- Standardize on shadcn `Button` variants: `default` (primary blue), `secondary`, `outline`, `ghost`, `destructive`, `link`. Add `size="icon"` guidance: always `aria-label`, min 44×44 on touch.
- `StatusPill` primitive (success/warning/danger/info/neutral/online/offline) — replaces ad-hoc badge styling in every module.
- `Icon` usage rule: `lucide-react`, size `h-4 w-4` inline, `h-5 w-5` toolbar, `h-6 w-6` hero. `aria-hidden` on decorative.

## 3. Data surfaces

New primitives in `src/components/ui-ext/`:
- `PageHeader`, `SectionHeader`
- `DataTable` wrapper around existing `table.tsx` with: sticky header, zebra off, hover row, selection column, pagination footer, integrated `TableToolbar` (search + filter chips + bulk actions slot), loading skeleton rows, `EmptyState` fallback, `ErrorState` fallback.
- `EmptyState` (icon, title, description, primary action).
- `ErrorState` (icon, title, description, retry).
- `LoadingSkeleton` variants: table, card grid, detail sheet, KPI row.
- `KpiCard` and `KpiRow` — replace the 3 bespoke KPI card styles across modules.
- `DetailSheet` wrapper around shadcn `Sheet` with consistent header/footer, close affordance, focus trap already from Radix.

Every existing table in the app is migrated to `DataTable` and every KPI strip to `KpiRow`.

## 4. Dialogs & notifications

- One `ConfirmDialog` primitive (title, description, destructive flag, confirm/cancel). All confirm flows (disable user, terminate session, rollback agent, remove agent, emergency access) route through it.
- Wizard dialogs (Deploy Wizard, Bulk Action Wizard, Connection Wizard, Start Session Wizard) share a `WizardShell` with step indicator + footer nav.
- Replace any remaining `alert()` / bespoke inline notices with `sonner` toasts (`toast.success/error/info`), consistent copy voice.
- Remove `useToast` legacy hook if referenced (modern stack rule).

## 5. Errors, empty, loading

- `__root.tsx` `ErrorComponent` and `NotFoundComponent` restyled to match `ErrorState` primitive; keep TanStack contract.
- Every route with a loader (none currently, but add safe fallbacks) gets `pendingComponent` using `LoadingSkeleton` and `errorComponent` using `ErrorState`.
- Empty tables and empty filter results now render `EmptyState` with a clear reset-filters action.

## 6. Head metadata (SEO/a11y hygiene)

- `__root.tsx`: real app title/description ("ERAP — Enterprise Remote Administration Platform" + one-liner). Set og/twitter tags. No default "Lovable App".
- Each route defines its own `head()` with page-specific title + description.

## 7. Accessibility pass

- Add `aria-label` to every icon-only `Button size="icon"` (toolbars in Console, Agents, Users, Sessions).
- Replace `text-gray-*` / arbitrary colors with semantic tokens for contrast.
- Single `<main>` at shell level, no duplicates in modules.
- `h-dvh` instead of `h-screen`; `min-w-0` + `truncate` on flexible headers per responsive rules.
- Focus-visible ring using `--ring` token, restored on all interactive elements.
- Ensure `Dialog`/`Sheet`/`DropdownMenu` remain Radix-based (already are) — remove any hand-rolled focus/keyboard logic.

## 8. Responsive layouts

- AppShell collapses sidebar to off-canvas under `md`.
- Every page header row uses the `grid-cols-[minmax(0,1fr)_auto] sm:flex` pattern.
- Detail sheets full-width on mobile, `sm:max-w-lg` on desktop.
- Tables get horizontal scroll containers + priority columns (secondary columns hidden `md:` / `lg:`).

## 9. Module-by-module refactor pass

For each of the 6 modules:
1. Delete bespoke sidebar + top bar; wrap in `AppShell` + `PageHeader`.
2. Swap KPI cards → `KpiRow`.
3. Swap tables → `DataTable` with unified toolbar, skeleton, empty, error.
4. Swap ad-hoc badges → `StatusPill`.
5. Route confirms through `ConfirmDialog`; wizards through `WizardShell`.
6. Replace inline notices with `sonner` toasts.
7. Add `aria-label`s and semantic tokens on remaining custom UI.

## 10. Verification

- `bunx tsgo --noEmit` clean.
- Playwright smoke: load each route, screenshot at 1280 and 390 wide, confirm shared shell renders, no console errors, tables render skeleton→data→empty transitions.
- Read `src/routes/__root.tsx` afterwards to confirm `<Outlet />` intact and metadata set.

## Technical notes

- New files: `src/components/shell/{AppShell,TopBar,Sidebar,Breadcrumbs}.tsx`, `src/components/ui-ext/{PageHeader,DataTable,EmptyState,ErrorState,LoadingSkeleton,KpiCard,StatusPill,ConfirmDialog,WizardShell,DetailSheet}.tsx`, `src/lib/nav.ts` (nav config + breadcrumb map).
- Token additions live in `@theme inline` in `src/styles.css`; no new remote CSS imports.
- Font loaded via `<link>` in `__root.tsx` head; family referenced via `--font-display`.
- No changes to server functions, audit-log store, sessions store, or business logic. All refactors are presentational.
- Scope: ~15 new primitives, 6 module rewrites of chrome only. Expect ~2500 LOC of primitives + net reduction in module files as chrome consolidates.

Ready to build on approval.
