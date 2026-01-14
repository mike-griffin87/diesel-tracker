# Diesel Tracker - Project Overview

**Last Updated:** January 3, 2026

## 📋 Project Summary

**Diesel Tracker** is a Next.js 15 web application for tracking diesel fuel fills, prices per liter, costs, and vehicle range data. It uses Supabase as the backend database and is designed as a Progressive Web App (PWA).

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.3 (App Router, Turbopack)
- **Runtime:** React 19.1.0
- **Language:** TypeScript 5
- **Database:** Supabase (PostgreSQL)
- **Styling:** CSS Custom Properties (CSS Variables)
- **Fonts:** Geist Sans & Geist Mono (Next.js Font Optimization)
- **Deployment:** Vercel (with cron jobs)

## 📂 Project Structure

```
diesel-tracker-main/
├── lib/
│   └── supabaseAdmin.ts          # Supabase admin client singleton
├── public/
│   ├── manifest.webmanifest      # PWA manifest
│   └── sw.js                     # Service Worker for offline support
├── src/
│   ├── app/
│   │   ├── globals.css           # Global styles with CSS variables
│   │   ├── layout.tsx            # Root layout with header/nav
│   │   ├── page.tsx              # Main dashboard (list fills, stats, filters)
│   │   ├── api/
│   │   │   └── keepalive/        # Cron endpoint for Vercel
│   │   │       └── route.ts
│   │   └── new/
│   │       └── page.tsx          # New fill form component
│   └── types/
│       └── supabase.ts           # TypeScript database schema types
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── tsconfig.json
└── vercel.json                   # Vercel deployment config (cron)
```

## 🗄️ Database Schema

**Table:** `fills`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated primary key |
| `filled_at` | TIMESTAMPTZ | Date/time of fill (stored as ISO string) |
| `price_cents_per_liter` | DECIMAL | Price in cents per liter (e.g., 169.9) |
| `total_cost_eur` | DECIMAL | Total cost in euros |
| `range_remaining_km` | INTEGER (nullable) | Remaining range in kilometers |
| `station_name` | TEXT (nullable) | Gas station name |
| `reset_trip` | BOOLEAN | Whether trip counter was reset |
| `note` | TEXT (nullable) | Additional notes |
| `created_at` | TIMESTAMPTZ (nullable) | Record creation timestamp |

## ✨ Key Features

### 1. Dashboard (Main Page - `src/app/page.tsx`)
- **Year Filter:** View fills by 2025, 2024, or All
- **Statistics Cards:**
  - Total spend (for loaded fills)
  - Average €/L across fills
  - Fill count
- **Data Table:** Shows all fills with:
  - Date, Price/L, Cost, Estimated Liters, Range Remaining
  - Garage (with color-coded dots per station)
  - Reset status, Notes
  - Edit/Delete actions per row
- **Anomaly Detection:** Highlights rows with zero price or zero cost
- **Station Color Coding:** Brand-specific colors (Circle K, Emo, Shell, etc.) + fallback palette

### 2. Add New Fill Modal (`src/app/new/page.tsx`)
- **Form Fields:**
  - Date (defaults to today)
  - Price in cents/L
  - Total cost in €
  - Range remaining (optional)
  - Garage selection (smart dropdown with most-used stations at top)
  - Reset clock (Yes/No toggle)
  - Note (optional)
- **Smart Station List:** Ranks stations by frequency in last 180 days
- **Server Action:** `createFill()` - inserts to Supabase and redirects

### 3. Edit Fill Modal
- Inline edit form in modal
- Pre-populates with existing values
- Server Action: `updateFill()` - updates record in Supabase

### 4. Delete Confirmation Modal
- Shows station name and date
- Server Action: `deleteFill()` - removes from Supabase

### 5. PWA Support
- Service Worker (`public/sw.js`) for offline caching
- Web App Manifest (`public/manifest.webmanifest`)
- Disabled in local development (auto-unregisters)
- Theme color: `#111827`

### 6. Server Actions (Next.js)
- **createFill:** Insert new fill record
- **updateFill:** Update existing fill
- **deleteFill:** Delete fill by ID
- All use `revalidatePath('/')` + `redirect('/')` for fresh data

## 🎨 UI/UX Highlights

- **Design System:** CSS Variables for theming
- **Dark Mode:** Auto-detects `prefers-color-scheme`
- **Responsive:** Mobile-friendly modals (slide up from bottom on mobile)
- **Color Palette:** Custom garage colors based on brand matching
- **Sticky Header:** Topbar with blur backdrop effect
- **Modal System:** Query param-based (`?new=1`, `?edit=<id>`, `?delete=<id>`)
- **Form UX:** Segmented toggle for Yes/No, datalist-style smart dropdowns

## 🔑 Environment Variables Required

The app needs these environment variables (not currently in repo):

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

**Note:** These must be configured before running the app.

## 🚀 Available Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Production build with Turbopack
npm start        # Start production server
npm run lint     # Run ESLint
```

## 🔄 Data Flow

1. **Read:** Page loads → Server Component fetches from Supabase → Renders table
2. **Create:** Form submit → Server Action (`createFill`) → Insert to DB → Revalidate → Redirect
3. **Update:** Edit form submit → Server Action (`updateFill`) → Update DB → Revalidate → Redirect
4. **Delete:** Delete confirm → Server Action (`deleteFill`) → Delete from DB → Revalidate → Redirect

## 📊 Current Station List (Predefined)

1. Kylemore Road
2. Kinnegad Plaza
3. Circle K Kinnegad
4. Circle K Nass Road
5. Emo Tullamore
6. Circle K Citywest
7. Applegreen Enfield
8. Emo Kinnegad
9. Top Oil Enfield

## 🎯 Architecture Decisions

- **Server Components:** All pages are React Server Components (RSC)
- **Server Actions:** Form handling with Next.js Server Actions (no API routes)
- **Type Safety:** Generated TypeScript types from Supabase schema
- **Styling:** Plain CSS with variables (no CSS-in-JS or Tailwind)
- **State Management:** None needed - server-driven with revalidation
- **Authentication:** None (uses Supabase service role key server-side only)
- **PWA:** Service worker for offline, but disabled in dev

## 🐛 Known Behaviors

- **Anomaly Highlighting:** Rows with 0 price or 0 cost show in red
- **Date Handling:** Converts dates to noon UTC to avoid DST edge cases
- **Unique Conflicts:** Update errors with code 23505 (unique constraint) are silently ignored
- **Limited Results:** Main query limited to 100 most recent fills

## 📝 Code Quality

- TypeScript strict mode
- ESLint configured (Next.js config)
- Server-only imports enforced (`'server-only'` in supabaseAdmin)
- Dynamic rendering forced (`export const dynamic = 'force-dynamic'`)

## 🔮 Future Enhancement Ideas

(This section can be used to track potential features)

- [ ] Consumption tracking (L/100km calculations)
- [ ] Charts/graphs for price trends
- [ ] Export data to CSV
- [ ] Multi-vehicle support
- [ ] Authentication/user accounts
- [ ] Mobile app (React Native)
- [ ] Bulk edit/delete
- [ ] Search/advanced filters
- [ ] Receipt photo uploads
- [ ] Budget alerts

---

## 🏁 Getting Started

### Prerequisites
1. Node.js 20+ installed
2. Supabase project set up with `fills` table
3. Environment variables configured

### Setup Steps
1. Install dependencies: `npm install`
2. Create `.env.local` with Supabase credentials (see `.env.local.example`)
3. Run dev server: `npm run dev`
4. Open http://localhost:3000

---

## 📋 Project Documentation

- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[VERSION_GUIDE.md](VERSION_GUIDE.md)** - Versioning and changelog management guide
- **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** - Detailed setup and deployment guide

---

**Project Status:** ✅ Production-ready, actively maintained  
**Current Version:** 0.2.0 (See [CHANGELOG.md](CHANGELOG.md) for details)
