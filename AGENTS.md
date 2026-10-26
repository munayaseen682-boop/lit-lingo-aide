<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All AI server functions use the shared `requireAiAccess` middleware from `src/lib/ai-access.ts` (an alias of `requireSupabaseAuth`); it authenticates the caller only. No daily AI cap is enforced anywhere — the consume_ai_allowance RPC was dropped and ai_daily_usage is deprecated; do not reintroduce per-user AI limits without the user asking.
- Account reads use the authenticated client and owner-only RLS.
- Keep a single root auth-state subscriber and clear protected query caches before logout to avoid stale private data and competing redirects.
