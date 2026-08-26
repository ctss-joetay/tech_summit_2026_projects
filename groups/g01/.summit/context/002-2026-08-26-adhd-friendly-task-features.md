---
id: 002
date: 2026-08-26
topic: adhd-friendly-task-features
files_touched: script.js, index.html
decisions:
  - Active tasks sort by priority with color-coded left borders
  - Focus mode shows only the top task with a count of hidden remaining tasks
  - Input auto-refocuses after adding a task to support rapid brain-dumping
open_questions:
  - none
---

Wired up existing but unused ADHD-friendly UI elements in index.html (priority selector, focus mode toggle, pause button, celebration div) to script.js logic. Implemented priority-based color coding and sorting, a focus mode that limits visible tasks to reduce overwhelm, a pause/resume control for the rotating reminder banner to limit distraction, a celebratory popup on task completion for positive reinforcement, and auto-refocus of the task input after adding a task.
