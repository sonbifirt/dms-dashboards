# PayPoint DMS — Dashboards

Modern, fully interactive prototype for the **Dashboards** module of the PayPoint DMS (Dealer Management System). Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn-style UI primitives and Recharts.

- **4 dashboards** under `/dashboard` – General, MPS / Kiosks, PSP, Dealers
- **Realistic mock data** parsed from the provided `.md` spec (80 dealers, ~110 kiosks, ~70 PSP merchants)
- **Animated KPI cards, charts, interactive tables (sort / filter / search / CSV export / pagination), drill-down sheets, toast notifications, dark mode and a responsive sidebar layout**

---

## 1. Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000 → it redirects to `/dashboard`.

Other scripts:

- `npm run build` — production build (type-checked)
- `npm run start` — run the production build
- `npm run lint` — lint with Next.js default rules

Node >= 18 is required. Works with `pnpm` and `yarn` as well if you prefer.

---

## 2. Project structure

```
dms-dashboards/
├── app/
│   ├── layout.tsx                   # Root HTML, font, theme, toaster, tooltip
│   ├── page.tsx                     # "/" → redirects to /dashboard
│   └── dashboard/
│       ├── layout.tsx               # AppShell + horizontal sub-nav
│       ├── loading.tsx              # Skeleton shown while pages stream
│       ├── page.tsx                 # General dashboard
│       ├── mps/page.tsx             # MPS / Kiosks dashboard
│       ├── psp/page.tsx             # PSP dashboard
│       └── dealers/page.tsx         # Dealers dashboard
│
├── components/
│   ├── layout/                      # Sidebar, TopBar, AppShell, SubNav, ThemeProvider
│   ├── dashboard/                   # KpiCard, ChartCard, DataTable, Sheet helpers,
│   │                                # SegmentToggle, StatusBadge, DateRangePicker,
│   │                                # DashboardHeader, CountUp, Skeleton, ChartTooltip
│   └── ui/                          # Base shadcn-style primitives (button, card,
│                                    # dropdown-menu, popover, select, sheet, tabs,
│                                    # toast, tooltip, avatar, separator, scroll-area,
│                                    # input, badge, use-toast)
│
├── lib/
│   ├── data/
│   │   ├── types.ts                 # Dealer, Kiosk, Merchant, LiveActivity types
│   │   ├── dealers.ts               # Real dealer data (from spec)
│   │   ├── kiosks.ts                # Real kiosk data (status, cash / card, city…)
│   │   ├── merchants.ts             # PSP merchants + synthetic turnover
│   │   └── activity.ts              # Deterministic live activity feed
│   ├── aggregations.ts              # KPI totals, top-N, breakdowns, trends, heatmap
│   └── utils.ts                     # cn(), formatCurrency/Number/Compact, percent
│
├── tailwind.config.ts               # PayPoint color tokens, sidebar palette, shadows
├── app/globals.css                  # CSS variables (light + dark), scrollbar, shimmer
└── README.md
```

---

## 3. Design language

| Token            | Value (light)           | Usage                          |
| ---------------- | ----------------------- | ------------------------------ |
| `--primary`      | `#E74C3C` (PayPoint red)| CTAs, highlights, primary bars |
| `--sidebar`      | `#1E293B` (slate-800)   | Dark left rail                 |
| `--success`      | `#10B981`               | Healthy kiosks, active dealers |
| `--warning`      | `#F59E0B`               | Paper warnings                 |
| `--destructive`  | `#EF4444`               | Errors                         |
| `--info`         | `#3B82F6`               | Cards / info tones             |

- **Font:** Inter (via `next/font/google`) with OpenType `cv11, ss01` features enabled.
- **Radius:** 12px cards, 8px controls.
- **Shadows:** `shadow-card`, `shadow-card-hover` custom tokens.
- **Dark mode:** class-based (`html.dark`), toggle in TopBar.

---

## 4. Features overview

### 4.1 Sidebar
- Brand header, dealer context card, main menu (matches the live DMS layout).
- `Dashboards` group is expandable with sub-items (General / MPS / PSP / Dealers).
- Active item is highlighted with a red left indicator.
- Mobile: opens as a `Sheet` from the hamburger button.

### 4.2 TopBar
- Breadcrumb derived from the current route.
- Language dropdown, notifications popover with status dots, avatar menu.
- Theme toggle (Sun/Moon) persists in `localStorage`.

### 4.3 General Dashboard (`/dashboard`)
- **6 KPI cards** (Total Turnover, Transactions, Active Dealers, Active Kiosks, PSP Merchants, Dealer Balance) with CountUp + trend deltas + click highlight.
- **Monthly Turnover Trend** area chart (MPS + PSP stacked areas).
- **Cash vs Card** donut + legend with percentages.
- **Segment Performance** stacked bar chart (last 7 days).
- **Top 10 Dealers by Balance** horizontal bars.
- **Live Activity Feed** (12 latest rows, auto-generated).
- **System Health** progress bars per kiosk status.

### 4.4 MPS / Kiosks Dashboard (`/dashboard/mps`)
- **6 KPIs** (Total Kiosks, MPS Turnover, Cash, Card, Paper/Print Warn, Errors/Disabled).
- **Top 10 Kiosks** with Revenue / Count toggle. Bars are clickable → opens detail sheet.
- **Status donut** (OK / Paper Warning / Error / Disabled / Not Found).
- **Turnover by City** + **Cash vs Card per City** grouped bars.
- **Full data table** with sort, search, status/city filter, CSV export, pagination.
- **Kiosk detail `Sheet`**: flags, monitors, cash/card mix, assigned dealer.

### 4.5 PSP Dashboard (`/dashboard/psp`)
- Info banner explaining the separate PSP module.
- **5 KPIs** (Merchants, Today Turnover, Month Turnover, Success Rate, Avg Ticket).
- **Top 10 Merchants** (Revenue / Count toggle).
- **Category Mix** pie (auto-classified by name).
- **Monthly Trend** line.
- **Recent signups** list.
- **24×7 Hourly Heatmap**.
- **Merchants Directory** table + detail sheet.

### 4.6 Dealers Dashboard (`/dashboard/dealers`)
- **5 KPIs** (Total / Active / Production / Test / Total Balance).
- **Top 10 by Balance** horizontal bars, clickable.
- **Status donut** (Active/Inactive) + **Work Mode donut** (Production/Test).
- **Dealers by Location** bar chart.
- **Full dealer table** with inline actions menu (View / Top-up / Email) and detail Sheet including assigned kiosks.

---

## 5. Interactivity

- **DateRangePicker** with `Today / This Week / This Month / This Quarter / This Year` presets (custom range placeholder for future).
- **Refresh** button triggers a toast + re-memoizes aggregations.
- **KPI click** sets an active state (red ring).
- **Bar click** in Top-N charts opens the detail sheet.
- **Row click** anywhere opens the detail sheet (with ⚡ assigned-kiosks for dealers).
- **CSV export** per chart (via ChartCard menu) and per table.
- **Sort / search / column filters / pagination** on every table.
- **Toast notifications** on refresh, export, top-up, etc.
- **Dark mode** toggle in TopBar — persisted.
- **Responsive**: 12-col → 6-col → stacked layouts; sidebar becomes a drawer under `md`.

---

## 6. Data layer

Mock data lives in `lib/data/`:

- `dealers.ts` — 58 dealers (ID, name, location, phone, email, balance, currency, status, workMode).
- `kiosks.ts` — 110+ kiosks (ID, name, city, status, paper/banknote flags, cash/card counts & amounts, last activity, optional dealer assignment).
- `merchants.ts` — 72 merchants seeded from real codes, enriched with deterministic turnover and category classification.
- `activity.ts` — `generateLiveActivity(n)` produces a deterministic ISO-timestamped feed from the real kiosks.

All aggregation (KPI totals, top-N, pie/bar breakdowns, monthly & hourly series) is centralized in `lib/aggregations.ts`. Charts read from these helpers only — there is a **single source of truth**.

### Swapping mock → real API

The data files only export plain TypeScript arrays. You can replace them with `async` fetchers:

```ts
// lib/data/dealers.ts
export async function getDealers(): Promise<Dealer[]> {
  const res = await fetch(`${process.env.DMS_API}/dealers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load dealers");
  return res.json();
}
```

Then convert the pages to server components (remove `"use client"`), `await getDealers()` inside the page, and pass the data as props to a small `"use client"` child that keeps the current chart/table interactions.

Aggregations can stay identical — they only need the arrays. For heavy tables, you can move them to a server component and stream with `<Suspense>` (the skeleton is already wired via `app/dashboard/loading.tsx`).

---

## 7. Components you can reuse elsewhere

- `<KpiCard />` — animated, toneable KPI card with delta + click state.
- `<ChartCard />` — consistent chart chrome with export/refresh menu.
- `<DataTable<T> />` — generic, typed table with search, filters, sort, pagination, CSV export, row click.
- `<SegmentToggle />` — small iOS-style toggle (used for Revenue/Count).
- `<StatusBadge />` — status pill with tone variants.
- `<DateRangePicker />` — preset selector + refresh button with toast feedback.
- `<AppShell />` — sidebar + topbar container.
- Plus every shadcn-style primitive under `components/ui/*`.

---

## 8. Next steps / roadmap

Things that are intentionally simplified in this prototype:

1. **Real date range** filtering of time series (right now the pickers trigger re-memo with identical data; wire them to your API or reducers).
2. **Custom date range** popover with a calendar (shown as placeholder).
3. **Role-based** menu / permissions.
4. **Realtime websocket** feed for the Live Activity section.
5. **i18n** (strings are in English; the EN/TR/RU/RO dropdown is a stub).

Everything else is production-ready in terms of structure and visuals — hand it to the team, swap data sources, and ship.
