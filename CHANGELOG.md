# Changelog

All notable changes to Diesel Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.4] - 2026-01-30

### Fixed
- Enhanced keepalive functionality to prevent Supabase project pausing due to inactivity
- Keepalive now performs multiple substantial database queries (count, recent records, filtered queries)
- Improved database activity detection without polluting actual data

### Changed
- Keepalive endpoint performs three different query operations for robust activity tracking
- Enhanced logging to show database statistics during keepalive runs

## [0.3.3] - 2025-01-14

### Fixed
- Sticky header now works properly by removing overflow-x from html/body
- Header has solid background and higher z-index (1000) for better visibility
- Moved overflow-x control to container level to prevent horizontal scroll issues

## [0.3.2] - 2025-01-14

### Fixed
- Version number now displays properly in header
- Table now scrolls horizontally on mobile devices for better viewing of full entries
- Header bar now stays fixed at top when scrolling with proper z-index stacking

## [0.3.1] - 2025-01-14

### Security
- Updated Next.js from 15.5.3 to 16.1.1 to address CVE-2025-66478
- Updated eslint-config-next to match Next.js version
- Resolved all npm audit vulnerabilities
## [0.3.0] - 2026-01-14

### Added
- **Settings Menu**: New dropdown menu in header with gear icon
  - Export to CSV functionality
  - Sync Application (hard refresh) option
- **CSV Export API**: `/api/export-csv` endpoint for downloading all fill data
  - Includes all fields: date, price, cost, liters, range, garage, reset, notes
  - Auto-generates filename with current date
- **Tabler Icons Integration**: Added @tabler/icons-react library for consistent, modern iconography
  - Settings (IconSettings)
  - File Download (IconFileDownload)
  - Refresh (IconRefresh)

### Fixed
- **Button Styling**: Primary button now has proper contrast in both light and dark modes
  - Changed from solid fill to outlined style with theme-aware colors
  - Improved hover states and accessibility

### Changed
- Button design updated to use border style instead of filled background
- Settings menu positioned in header navigation area

---

## [0.2.0] - 2026-01-14

### Added
- **Keepalive Monitoring**: Added webhook-based alerting system for cron job failures
  - Supports Discord and Slack webhooks via `KEEPALIVE_ALERT_WEBHOOK_URL` environment variable
  - Optional success logging with `KEEPALIVE_LOG_SUCCESS` environment variable
- **Enhanced Logging**: Added timestamped console logging for all keepalive executions
- **Test Script**: Created `test-keepalive.mjs` for local endpoint testing
- **Setup Documentation**: Added comprehensive `SETUP_INSTRUCTIONS.md` with step-by-step configuration guide
- **Environment Template**: Added `.env.local.example` for easier project setup

### Fixed
- **Database Pausing Issue**: Increased cron job frequency from daily to every 6 hours (was: `0 9 * * *`, now: `0 */6 * * *`)
  - Prevents Supabase free tier database from pausing due to inactivity
  - Provides safety margin for failed executions
- **Empty Garage Dropdown**: Fixed garage selection not showing station options
  - Removed hardcoded `stations` prop that prevented database query from executing
  - Now properly fetches and displays stations from database merged with allowed stations list

### Changed
- Improved error handling in keepalive endpoint with detailed error messages
- Enhanced keepalive endpoint security validation and logging

### Security
- Verified `.gitignore` properly excludes `.env*` files from version control
- Added environment variable security documentation
- Cleaned up duplicate `.env.local.template` file

---

## [0.1.0] - 2025-01-03

### Initial Release
- Next.js 15 app with App Router and Turbopack
- Supabase backend integration
- Dashboard with year filtering (2024, 2025, All)
- Fuel fill tracking with:
  - Date, price per liter (cents/L), total cost
  - Range remaining, station name
  - Trip reset indicator, notes
- Statistics cards showing:
  - Total spend
  - Average price per liter
  - Fill count
- Smart garage dropdown with frequency-based ranking
- Add/Edit/Delete fill functionality
- PWA support with service worker
- Offline capability
- Color-coded station names by brand
- Anomaly detection for zero-price/cost fills
- Vercel cron job for database keepalive
- TypeScript with strict type safety
- Mobile-responsive design

---

## Version History

- **0.3.0** (2026-01-14) - Settings Menu & CSV Export
- **0.2.0** (2026-01-14) - Monitoring & Bug Fixes
- **0.1.0** (2025-01-03) - Initial Release
