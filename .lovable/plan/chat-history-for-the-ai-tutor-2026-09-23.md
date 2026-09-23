# Chat History for the AI Tutor

Save every tutor conversation to your account so it is there after you refresh, close the app, or sign in on another device. All other tools stay exactly as they are.

## What you will get

- **Chat History in the navigation** — a new "History" item next to Chat, plus a history panel inside the chat page (a sidebar on desktop, a slide-in drawer on mobile).
- **Automatic saving** — each conversation is stored as you chat, with the title taken from your first question (shortened sensibly), the date and time, and a short preview of the last message.
- **Resume where you left off** — tapping a past conversation opens it with the full message history, at its own web address so a refresh reopens the same chat.
- **New Chat** — a button that always starts a fresh conversation.
- **Rename and delete** — per-conversation menu with rename (inline dialog) and delete (with confirmation).
- **Per-user and private** — conversations are tied to your signed-in account and are not visible to anyone else.

## Design

Same parchment/navy theme, serif headings, existing card and button styles. History rows: title, relative time ("2 hours ago"), one-line preview, subtle hover, active row highlighted like the current nav item. Mobile: full-width rows, comfortable tap targets, drawer opens from a header button.

## Technical notes

Database (one migration, RLS + GRANTs):
- `chat_threads`: `id uuid pk`, `user_id uuid not null`, `title text`, `created_at`, `updated_at` (trigger reusing `update_updated_at_column`).
- `chat_messages`: `id uuid pk`, `thread_id uuid references chat_threads on delete cascade`, `role text check (role in ('user','assistant'))`, `content text`, `created_at`.
- Policies scoped to `auth.uid()` for select/insert/update/delete (messages via a thread-ownership subquery). Grants to `authenticated` and `service_role`; no `anon`.

Server functions in `src/lib/chat-history.functions.ts`, all using `requireSupabaseAuth`:
`listThreads`, `getThread(threadId)`, `createThread`, `renameThread`, `deleteThread`, `appendMessages`. Ownership verified by `user_id = context.userId` on every call.

Routes:
- `src/routes/_authenticated/chat.index.tsx` — creates a thread (or opens the newest) and navigates to it.
- `src/routes/_authenticated/chat.$threadId.tsx` — the chat surface, keyed by `threadId`; existing `chat.tsx` becomes the layout holding the history panel + `<Outlet />`. Messages load with `useQuery` in the component (not a loader) since the functions require auth.
- Existing `chatWithTutor` call stays unchanged; after each successful reply the user + assistant messages are persisted and the thread title is set from the first user message if still untitled. Thread list invalidated after send/rename/delete.

Local persistence of the current draft/legacy `litlingo:tutor-chat:v1` messages is migrated into a thread on first load, then the key is cleared.

Verification: typecheck, then Playwright at 1280x1800 and 360x619 — create two chats, send in each, reload a thread URL, rename, delete.
