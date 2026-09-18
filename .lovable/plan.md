# Plan: Remove the YouTube Slides Creator

## Goal
Remove the personal YouTube Video Script & Slides Creator completely while preserving every core LitLingo AI learning feature and the existing visual design.

## Changes

1. **Remove the feature itself**
   - Delete the authenticated `/slides` page and all slide-editor, branded-opening, closing, voice-over, and local device settings UI.
   - Delete the slide-generation server function, schema, prompts, and related generated types.

2. **Clean navigation and dashboard**
   - Remove the “Slides” navigation item and its icon import.
   - Remove the “YouTube Slide Generator” dashboard card and link.
   - Keep the remaining tools in their current order: Literature Analyzer, Linguistics & Grammar, Quiz Generator, AI Tutor Chat, and BPSC & Competitive Exam Prep.

3. **Polish the remaining positioning**
   - Refine only the dashboard introduction so it clearly presents the available tools as academic study tools for English Literature, Linguistics, and examinations.
   - Preserve the existing landing page and core feature interfaces, which already position LitLingo AI as a student learning platform.

4. **Verify the cleanup**
   - Search the app for residual YouTube, video-script, branded-slide, slide-generator, and `/slides` references.
   - Confirm all remaining dashboard cards and navigation links open valid pages.
   - Check the authenticated dashboard and navigation at desktop and mobile sizes, and verify the removed page is no longer registered.
   - Confirm every remaining content page retains its route-specific metadata and that the app compiles cleanly.

## Unchanged
- Literature Analyzer
- Linguistics and grammar learning
- AI Tutor Chat and explanations
- Quiz and MCQ practice
- BPSC, PCS, CSS, and lectureship preparation
- Answer evaluation and writing assistance
- Authentication, installable app support, data, styling, and all other student-focused functionality
