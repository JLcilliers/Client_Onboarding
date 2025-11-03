# Project Plan

## Goals
- Deliver a secure, multi-tenant onboarding portal for digital marketing clients.
- Capture SEO, PPC, social, analytics, development, and business context with conditional flows.
- Provide an internal console to review company profiles and questionnaire responses.
- Persist all data to Supabase with strict Row Level Security and auditable changes.

## Architecture
- **Frontend:** Next.js 16 (App Router, TypeScript, Tailwind CSS 4) with modular route groups for public landing, intake wizard, and internal console.
- **Auth:** Supabase Auth (Google) via `@supabase/ssr` helpers, protected routes enforced through middleware.
- **State / Forms:** React Hook Form + Zod, JSON-driven form schema for service-specific steps, auto-save via server actions.
- **Data:** Supabase Postgres tables (companies, members, services, questionnaires, responses, assets, invites, audit logs) with RLS helpers.
- **Storage & Files:** Supabase Storage bucket `company-assets` for uploads, signed URLs generated through server actions.
- **Infrastructure:** `.env` gating for Supabase keys, server-only service-role helpers, eventual deployment to Vercel or Supabase Hosting.

## Milestones
[x] Scaffold Next.js project, base styling, and dependency setup.
[x] Wire Supabase auth, Google OAuth callback, middleware protection, and session-aware layout.
[x] Implement questionnaire data layer (SQL migrations / seed helpers) and Supabase service utilities.
[x] Build multi-step intake wizard (company basics, service selection, service-specific quick scopes) with auto-save.
[x] Create internal console (company list, detail tabs, activity log, exports).
[x] Add invites, file uploads, access requests, and encrypted secrets handling.

## Immediate Next Steps
- [x] Implement invite creation and magic-link consumption workflows for client onboarding.
- [x] Enrich the company detail view with section tabs, auto-generated summaries, and activity log feeds.
- [x] Wire Supabase Storage for asset uploads and create secure download endpoints.
- [x] Add remediation for partial questionnaire progress (auto-save per step with optimistic UI).
