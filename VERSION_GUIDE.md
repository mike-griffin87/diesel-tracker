# Version & Changelog Management Guide

This document explains how version numbers and changelog updates are managed for Diesel Tracker.

## Current Version: 0.2.0

---

## Semantic Versioning

This project follows [Semantic Versioning 2.0.0](https://semver.org/):

**Format:** `MAJOR.MINOR.PATCH`

### Version Increment Rules

**MAJOR version** (e.g., 1.0.0 → 2.0.0)
- Breaking changes that are not backward-compatible
- Major database schema changes requiring migration
- Complete UI overhauls
- Removal of existing features
- Changes to authentication/authorization system

**MINOR version** (e.g., 0.1.0 → 0.2.0)
- New features added in a backward-compatible manner
- New API endpoints or server actions
- New pages or major UI components
- Enhanced functionality to existing features
- Performance improvements
- New monitoring or alerting capabilities

**PATCH version** (e.g., 0.1.1 → 0.1.2)
- Backward-compatible bug fixes
- Small UI tweaks or styling updates
- Documentation updates
- Dependency updates (minor)
- Performance optimizations (minor)
- Security patches

---

## Changelog Workflow

### When You Say "Push" or "Deploy"

I will automatically:

1. **Analyze the changes** made in the conversation
2. **Determine version bump type** (major/minor/patch)
3. **Update version in 3 places:**
   - `package.json` → `"version": "X.Y.Z"`
   - `.env.local` → `NEXT_PUBLIC_APP_VERSION=X.Y.Z`
   - `.env.local.example` → `NEXT_PUBLIC_APP_VERSION=X.Y.Z`
4. **Update CHANGELOG.md** with:
   - New version header with date
   - Categorized list of changes (Added/Fixed/Changed/Removed/Security)
   - Version summary in history section

### Changelog Categories

Changes are organized into these categories:

- **Added** - New features, capabilities, or files
- **Changed** - Modifications to existing functionality
- **Fixed** - Bug fixes
- **Deprecated** - Features that will be removed in future versions
- **Removed** - Features that have been deleted
- **Security** - Security-related changes or fixes

---

## File Locations

### Version Sources
- **Primary:** `package.json` → `"version": "X.Y.Z"`
- **Display:** `.env.local` → `NEXT_PUBLIC_APP_VERSION=X.Y.Z`
- **Template:** `.env.local.example` → `NEXT_PUBLIC_APP_VERSION=X.Y.Z`

### Changelog
- **File:** `CHANGELOG.md`
- **Format:** Keep a Changelog format
- **Location:** Project root

### UI Display
- **File:** `src/app/layout.tsx`
- **Display:** "Diesel Tracker v0.2.0" in header
- **Source:** `process.env.NEXT_PUBLIC_APP_VERSION`

---

## Manual Version Update (If Needed)

If you need to manually update the version:

1. Update `package.json`:
   ```json
   {
     "version": "0.3.0"
   }
   ```

2. Update `.env.local`:
   ```env
   NEXT_PUBLIC_APP_VERSION=0.3.0
   ```

3. Update `.env.local.example`:
   ```env
   NEXT_PUBLIC_APP_VERSION=0.3.0
   ```

4. Add entry to `CHANGELOG.md`:
   ```markdown
   ## [0.3.0] - YYYY-MM-DD
   
   ### Added
   - Your changes here
   ```

5. Restart dev server to see version in UI

---

## Deployment Checklist

When deploying to Vercel:

- [ ] Version updated in all 3 files
- [ ] CHANGELOG.md updated with changes
- [ ] Environment variables set in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - (Optional) `KEEPALIVE_ALERT_WEBHOOK_URL`
  - (Optional) `NEXT_PUBLIC_APP_VERSION` - if not using .env.local values
- [ ] Git commit includes version bump and changelog
- [ ] Vercel deployment triggered

---

## Version History Quick Reference

| Version | Date       | Type  | Summary                          |
|---------|------------|-------|----------------------------------|
| 0.2.0   | 2026-01-14 | Minor | Monitoring & Bug Fixes           |
| 0.1.0   | 2025-01-03 | Minor | Initial Production Release       |

---

## Examples

### Example: Bug Fix Only (PATCH)
**Changes:** Fixed date parsing issue in fill form
**Version:** 0.2.0 → 0.2.1
**Reason:** Bug fix, no new features

### Example: New Feature (MINOR)
**Changes:** Added CSV export functionality
**Version:** 0.2.1 → 0.3.0
**Reason:** New user-facing feature

### Example: Breaking Change (MAJOR)
**Changes:** Migrated from Supabase to PostgreSQL with different schema
**Version:** 0.3.0 → 1.0.0
**Reason:** Database migration requires manual intervention

---

## Notes

- Version 0.x.x indicates the project is in initial development
- Version 1.0.0 should be released when the API is considered stable
- Pre-release versions can use suffixes: `1.0.0-alpha.1`, `1.0.0-beta.2`, `1.0.0-rc.1`
- The version in the UI header updates automatically when you restart the dev server
