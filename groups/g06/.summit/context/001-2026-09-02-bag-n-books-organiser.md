---
id: 001
date: 2026-09-02
topic: bag-n-books-organiser
files_touched: index.html, style.css, script.js
decisions:
  - Skipped the chatbot 'nice to have' feature for now to avoid complicating the must-have requirements
  - Only one week can be toggled active at a time; turning one on forces others off
  - Deleting a subject from the catalog also removes it from any week/day referencing it to avoid dangling data
  - Data persisted via Summit.save/load as a single object covering subjects, weeks, and tutorial-seen flag
open_questions:
  - Whether to add the chatbot settings-editor feature next
  - Whether the tutorial overlay needs a way to be replayed manually
---

Built the Bag n' Books Organiser as index.html, style.css, and script.js with a clean paper/print aesthetic and anime.js animations. The app has a fading title start screen, a one-time tutorial overlay, a Weeks tab with a single-active-week toggle and per-week day/subject settings grid, a subject catalog for adding/removing subjects with associated items, and a Pack Today tab that shows required items when a day is clicked. All state persists via Summit.save/load. The optional chatbot settings-editor feature was deliberately left out to keep the must-have requirements simple.
