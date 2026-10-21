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

- All AI server functions use the shared `requireAiAccess` middleware, which authenticates the caller before atomically reserving their database-backed daily allowance; this prevents parallel requests and direct browser calls from bypassing the cap.
- Account reads use the authenticated client and owner-only RLS; only the server's privileged client can increment AI usage, so users cannot reset their counter.
- Keep a single root auth-state subscriber and clear protected query caches before logout to avoid stale private data and competing redirects.
