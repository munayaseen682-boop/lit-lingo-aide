## LitLingo AI Project Plan

## Product Overview

LitLingo AI is an AI-powered study companion for English Literature and Linguistics students. It provides four core tools behind a required authentication wall: Literature Analysis, Linguistics & Grammar Help, AI-Generated Quizzes, and a threaded AI Tutor Chat. All user work (threads, quizzes, saved analyses) is persisted to a database.

## Technology Stack


| Layer     | Choice                                   | Notes                                                                         |
| --------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| Framework | TanStack Start v1                        | Already in the project; file-based routing, SSR/SSG, server functions         |
| Styling   | Tailwind CSS v4 + shadcn/ui primitives   | Current design tokens in `src/styles.css`                                     |
| Backend   | Lovable Cloud                            | Built-in PostgreSQL + Supabase Auth (no external accounts needed)             |
| AI        | Lovable AI Gateway via AI SDK            | `openai/gpt-5.5` default for text generation; image generation optional later |
| Database  | PostgreSQL (via Lovable Cloud)           | User data, threads, messages, quizzes, analyses                               |
| Auth      | Supabase Auth (managed by Lovable Cloud) | Email/password + Google OAuth; all AI features require sign-in                |
| State     | TanStack Query                           | Server-state caching with `ensureQueryData` + `useSuspenseQuery`              |


## Pages & Routes

Public routes (before login):

- `/` — Landing page with hero, feature cards, and CTA to sign up
- `/auth` — Sign-in / sign-up page (email + Google)

Protected routes (under `src/routes/_authenticated/`):

- `/dashboard` — Overview of recent activity, saved analyses, quiz scores, chat threads
- `/analyze` — Literature analysis tool: paste text, get themes, devices, context, vocabulary
- `/linguistics` — Linguistics concept explainer and grammar checker
- `/quiz` — Quiz generator: choose topic or paste text, generate MCQ quiz, submit and score
- `/chat` — Chat thread list + new thread
- `/chat/$threadId` — Active threaded AI tutor chat
- `/profile` — View/edit profile display name, avatar, preferences
- `/reset-password` — Password reset (public route, required for auth flow)

Static routes:

- `/sitemap.xml` — SEO sitemap
- `/robots.txt` — Allow all
- `/llms.txt` — AI crawler summary

## Core Features & User Flows

### 1. Literature Analyzer

- User pastes an excerpt (poem, prose, drama).
- Optional: select focus area (themes, literary devices, historical context, vocabulary, character analysis).
- Server calls Lovable AI Gateway with a structured prompt.
- Response is rendered as markdown sections with explanation, devices list, and vocabulary.
- User can save the analysis to their library; saved analyses appear on the dashboard.

### 2. Linguistics & Grammar Helper

- Two modes: **Concept Explain** (ask about phonology, syntax, semantics, morphology, pragmatics, sociolinguistics) and **Grammar Check** (paste text, get corrections with reasoning).
- Grammar output includes: corrected text, list of issues, explanations, severity.
- User can save grammar checks and concept explanations.

### 3. Quiz Generator

- User selects quiz source: topic (e.g., "Shakespeare sonnets") or pasted text.
- AI generates multiple-choice questions (configurable count: 5, 10, 15).
- User submits answers; server scores and returns feedback per question.
- Quiz and result are persisted; dashboard shows recent scores and average.

### 4. AI Tutor Chat (threaded)

- Threaded conversations: each chat is a named thread with a real URL (`/chat/$threadId`).
- Threads are database-backed, scoped to the authenticated user.
- Messages stream from the server via AI SDK UI (`DefaultChatTransport` + `useChat`).
- Messages rendered via `message.parts` with markdown support.
- System persona: friendly, knowledgeable English Literature & Linguistics tutor.
- Users can rename, delete, or create new threads from the sidebar.

## Database Schema

Tables and migrations will be created with Lovable Cloud migrations. All user-owned tables use RLS policies scoped to `auth.uid()`.

### 1. `public.profiles`

Auto-created on signup via trigger.

```sql
id uuid primary key references auth.users(id) on delete cascade,
display_name text,
avatar_url text,
role text default 'student',
preferences jsonb default '{}',
created_at timestamptz default now(),
updated_at timestamptz default now()
```

### 2. `public.threads`

Chat threads for the AI tutor.

```sql
id uuid primary key default gen_random_uuid(),
user_id uuid references auth.users(id) on delete cascade not null,
title text not null default 'New chat',
created_at timestamptz default now(),
updated_at timestamptz default now()
```

### 3. `public.messages`

Chat messages per thread.

```sql
id uuid primary key default gen_random_uuid(),
thread_id uuid references public.threads(id) on delete cascade not null,
user_id uuid references auth.users(id) on delete cascade not null,
role text not null check (role in ('user','assistant')),
content text not null,
parts jsonb,
created_at timestamptz default now()
```

### 4. `public.analyses`

Saved literature analyses and grammar checks.

```sql
id uuid primary key default gen_random_uuid(),
user_id uuid references auth.users(id) on delete cascade not null,
type text not null check (type in ('literature','grammar','concept')),
title text,
input_text text not null,
output_text text not null,
metadata jsonb default '{}',
created_at timestamptz default now(),
updated_at timestamptz default now()
```

### 5. `public.quizzes`

Generated quizzes and user attempts.

```sql
id uuid primary key default gen_random_uuid(),
user_id uuid references auth.users(id) on delete cascade not null,
title text not null,
source_text text,
questions jsonb not null,
user_answers jsonb,
score integer,
max_score integer,
feedback jsonb,
completed boolean default false,
created_at timestamptz default now(),
updated_at timestamptz default now()
```

All tables include GRANT statements for `authenticated` and `service_role`, plus RLS policies.

## Design Direction

Distinctive, academic-but-warm aesthetic: warm parchment tones, deep navy/ink accents, elegant serif headings for literary references, clean sans-serif UI for tools. No purple default gradient. Design system will be defined in `src/styles.css` with semantic tokens and custom component variants.

## Step-by-Step Build Roadmap

### Phase 1: Foundation & Auth

1. Enable Lovable Cloud for the project.
2. Replace template placeholder with a real landing page at `/`.
3. Add `/auth` sign-in/sign-up page (email + Google).
4. Add `/reset-password` page.
5. Create `public.profiles` table with auto-create trigger and RLS.
6. Set up authenticated layout (`_authenticated`) and protected route shell.
7. Add navigation header that reflects auth state.

### Phase 2: Database & Server Setup

1. Create `threads`, `messages`, `analyses`, `quizzes` tables with migrations.
2. Set up Lovable AI Gateway provider helper (`src/lib/ai-gateway.server.ts`).
3. Create server functions for each feature:
  - `analyzeLiterature`
  - `explainConcept` / `checkGrammar`
  - `generateQuiz` / `submitQuiz`
  - `listThreads`, `createThread`, `renameThread`, `deleteThread`, `loadThreadMessages`
4. Add bearer-token middleware for authenticated server functions.

### Phase 3: Core AI Tools UI

1. Build `/analyze` page with form and result rendering.
2. Build `/linguistics` page with tabbed concept/grammar modes.
3. Build `/quiz` page with generator and quiz-taking flow.
4. Save functionality for analyses and quizzes.

### Phase 4: Threaded AI Tutor Chat

1. Build `/chat` and `/chat/$threadId` routes.
2. Implement streaming chat server route (`/api/chat`).
3. Build thread sidebar, new-thread flow, and message rendering.
4. Persist messages on stream finish.
5. Verify reload restores threads and messages.

### Phase 5: Dashboard, Profile & Polish

1. Build `/dashboard` with recent activity, saved analyses, quiz scores, thread list.
2. Build `/profile` for editing display name, avatar, and preferences.
3. Add empty/error states, loading skeletons, and toast notifications.
4. Add SEO metadata (`sitemap.xml`, `robots.txt`, `llms.txt`).
5. Run end-to-end smoke test and typecheck.

### Phase 6: Publish & Course Delivery

1. Publish the app.
2. Verify auth, AI tools, chat, and database persistence on the live deployment.

## Open Decisions (awaiting your confirmation)

- Should the app also include a landing-page feature for non-logged-in visitors with a demo input, or a static marketing page only? (Plan above assumes static marketing page since AI tools require auth.)
- Do you want a dark mode toggle, or a single warm light theme? (Plan assumes single theme for simplicity.)
- Any specific literature/linguistics focus areas you want pre-seeded as examples? (e.g., Shakespeare, Victorian poetry, phonetics, syntax trees)

## Next Action

Approve this plan and I will begin Phase 1: enable Lovable Cloud and build the landing page + auth flow.