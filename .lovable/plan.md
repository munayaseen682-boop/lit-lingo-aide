# Resume LitLingo AI — Phase 1: Foundation & Auth

Picking up where we left off. Lovable Cloud is enabled, Google + Email auth are configured. Now we build the visible foundation.

## What ships in this phase

1. **Landing page (`/`)** — replaces the template placeholder at `src/routes/index.tsx`
   - Hero: "LitLingo AI — Your AI Study Companion for Literature & Linguistics"
   - Feature grid: Literature Analyzer, Linguistics & Grammar, Quiz Generator, AI Tutor Chat
   - CTA buttons → `/auth` (Sign in / Get started)
   - Footer with short about + course credit line
   - SEO head(): unique title, description, og tags

2. **Auth page (`/auth`)** — `src/routes/auth.tsx`
   - Tabs: Sign in / Sign up (email + password)
   - "Continue with Google" button
   - On success → redirect to `/dashboard`
   - Uses `supabase.auth` from `@/integrations/supabase/client`

3. **Protected layout (`/_authenticated`)** — `src/routes/_authenticated/route.tsx`
   - Uses the integration-managed auth gate (redirects to `/auth` if no session)
   - Renders a top nav (logo, links to Dashboard / Analyze / Linguistics / Quiz / Chat, sign-out) and `<Outlet />`

4. **Dashboard stub (`/_authenticated/dashboard`)** — `src/routes/_authenticated/dashboard.tsx`
   - Welcome header with user's name/email
   - Four feature cards linking to the tools (real functionality lands in Phase 3–4)
   - Placeholder empty states for "Recent chats" and "Saved analyses"

5. **Profiles table + trigger** — migration
   - `public.profiles` (id uuid PK → auth.users, display_name, avatar_url, created_at, updated_at)
   - GRANTs (authenticated + service_role), RLS enabled
   - Policies: users can select/update own profile
   - Trigger on `auth.users` insert → auto-create profile row

6. **Design system tokens** — `src/styles.css`
   - Warm parchment background, deep navy primary, muted gold accent
   - Serif display font (e.g. Fraunces) for headings via `<link>` in `__root.tsx`, Inter for body
   - All colors as HSL semantic tokens; shadcn variants updated to match

## Out of scope for Phase 1

AI server functions, analyzer/quiz/chat UIs, threaded messages, saved analyses — those are Phases 2–5 from the approved plan.

## Technical notes

- Route files use flat dot notation; `_authenticated/route.tsx` is the layout gate.
- Landing page rewrites `src/routes/index.tsx` (not a new sibling) per the placeholder rule.
- Profiles migration includes GRANTs in the same file as CREATE TABLE.
- Google OAuth `redirectTo` = `${window.location.origin}/auth/callback` handled by a small callback route that navigates to `/dashboard` after session hydration.

## Approve to build

Once you approve, I'll implement all six items above in one pass and then we move to Phase 2 (AI server functions + remaining tables).
