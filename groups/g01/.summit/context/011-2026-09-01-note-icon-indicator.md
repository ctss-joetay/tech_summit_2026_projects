---
id: 011
date: 2026-09-01
topic: note-icon-indicator
files_touched: script.js, style.css
decisions:
  - Note pencil icon uses inline SVG (no image assets) and only renders when task.notes is non-empty, hiding again when notes are cleared
open_questions:
  - none
---

Added a small pencil SVG icon next to task text on the home screen to indicate when a task has saved notes. The icon is rendered inline via JS based on whether task.notes is non-empty, and toggles live as notes are added or cleared. Styling was added in style.css to color the icon to match the wood/accent theme and position it correctly next to the flexible task-text span.
