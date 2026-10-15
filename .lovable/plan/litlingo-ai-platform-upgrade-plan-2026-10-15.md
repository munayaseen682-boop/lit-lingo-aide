# LitLingo AI — Platform Upgrade Plan

## Audit (current state)
- Stack: TanStack Start, Tailwind design system (parchment/navy/gold, Fraunces + Inter), Lovable Cloud (auth with Google + email, database), Lovable AI for all AI tools (keys stay on the server).
- Working: Landing, Sign-in, Dashboard, Literature Analyzer, Linguistics & Grammar, Quiz Generator, BPSC/PCS/CSS Exam Prep (incl. an answer evaluator tab), installable Android app.
- Saved data today: profiles, chat conversations + messages (per user, private).
- Unfinished from last session: Chat History has 2 type errors, so chat pages don't build. Must be fixed first.
- Gaps: quizzes, analyses and progress are not saved; dashboard "Recent chats / Saved analyses" are static empty boxes.

## Phases (in order, each tested before the next)
1. **Fix Chat History** — resolve errors, add "History" to navigation, test new/rename/delete/reopen on mobile + desktop.
2. **Progress data layer** — new private per-user tables: `activity` (tool, topic, score), `notes`, `bookmarks`, `topic_progress`. Quiz Generator and other tools record activity. Required by Phase 7.
3. **Linguistics Lab** (`/lab`) — 9 topic cards (Phonetics/IPA, Phonology, Morphology, Syntax, Semantics, Pragmatics, Sociolinguistics, Discourse/CDA, Corpus). Each topic page: simple explanation, technical definitions, examples (AI-generated, cached per topic), interactive exercises + practice MCQs with per-answer feedback explaining wrong answers, "Mark complete" and "Bookmark".
4. **Literary Criticism Assistant** (`/criticism`) — enter a work (title/author, optional passage), pick one of 7 lenses. Output in separate labelled blocks: Explanation, Textual Evidence (only quotes from the pasted passage, or explicitly "no verified quotation available"), Interpretation, Critical-thinking questions. Save to notes.
5. **Answer Evaluation System** (`/evaluate`) — question + answer + exam level. Displays fixed rubric (6 criteria, weights) up front; returns per-criterion score, strengths, weaknesses, suggestions, total estimate, with a permanent disclaimer that it is not an official mark. Existing exam-prep evaluator stays and links here.
6. **Academic Writing Coach** (`/writing`) — feedback on grammar, vocabulary, coherence/cohesion, paragraphing, thesis, tone; explains mistakes and gives guiding hints rather than a full rewrite (distinct from the existing grammar corrector).
7. **Personal Study Dashboard** — replace empty boxes with real: completed topics, quiz performance (average + recent scores), saved notes, bookmarks, recent activity, recommended revision (lowest-scoring / unfinished topics). Helpful empty states.
8. **Navigation & polish** — mobile-first grouped menu (Learn / Practise / Exams / My Study), consistent cards, final test of all old and new features, report.

## Technical details
- All AI calls via server functions with sign-in required; structured outputs (zod) for exercises, rubric scores and criticism sections.
- New tables follow the existing pattern: user_id uuid, RLS owner-only policies, grants to authenticated.
- No new dependencies expected.
- No external configuration needed; AI usage draws on workspace AI credits (last session stopped when credits ran out — enough credits are required to finish all phases).
