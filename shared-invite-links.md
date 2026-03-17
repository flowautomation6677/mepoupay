# PLAN: Shared Invite Links

## Overview
Implement a "Shared Invite Links" feature to allow administrators to generate reusable registration links with limits and expiration, moving away from single-email-based invites.

## Project Type
WEB + BACKEND

## Success Criteria
- SQL migration efficiently manages the new `shared_invite_links` table.
- Row-Level Security explicitly secures the data.
- API Route `/api/shared-invite` allows link creation.
- API Route `/api/auth/register-via-link` registers users properly.
- Concurrency (Race Conditions) is safely handled when consuming links.
- No sensitive system data leaks on the public signup page `/auth/join`.

## Tech Stack
- Next.js App Router
- Supabase (PostgreSQL, Auth, RLS)
- Web UI (Shadcn/Tailwind - using CSS variables per LESSONS.md)

## File Structure
- `web-dashboard/supabase/migrations/018_create_shared_links.sql`
- `web-dashboard/src/app/api/shared-invite/route.ts`
- `web-dashboard/src/app/api/auth/register-via-link/route.ts`
- `web-dashboard/src/app/auth/join/page.tsx`
- `web-dashboard/src/components/dashboard/GenerateInviteLink.tsx`
- `web-dashboard/src/__tests__/api/shared-invite.test.ts`
- `web-dashboard/src/__tests__/api/register-via-link.test.ts`

## Task Breakdown
1. **[database-architect]** Create migration `018...` and verify via apply on Supabase local/staging.
2. **[test-engineer / backend-specialist]** Create RED tests for both API routes.
3. **[backend-specialist]** Implement API logic (GREEN & REFACTOR) to generate links and securely register, validating race conditions against DB max_uses.
4. **[frontend-specialist]** Create and integrate Admin layout changes to embed the `GenerateInviteLink`.
5. **[frontend-specialist]** Create the public `/auth/join` page respecting UI theme variables.

## ✅ PHASE X COMPLETE
- [x] Lint & TS: Pass
- [x] Security: No critical issues (Atomic RPC implemented)
- [x] Build: Success
- [x] E2E/Unit: Pass (Jest API tests passing)
- Date: 2026-03-17
