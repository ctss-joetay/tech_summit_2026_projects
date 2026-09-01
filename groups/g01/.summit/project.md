## What this is
A cafe-notebook-themed Task Tracker (school competition site). Single-page app: `index.html`, `script.js`, `style-cafe-grid.css` (permanent theme). `style.css` is leftover/unused (not deleted yet, just unreferenced). `style-cafe-lined.css` was deleted (unused).

## Current features
- Add tasks with priority (low/medium/high) via a cyclic toggle button (Low→Medium→High→Low), color-coded left borders on active tasks.
- Active tasks sorted by priority.
- Focus mode: shows just the top task + count of hidden remaining.
- Reminder banner cycles through active tasks every 3s (pausable).
- Completing a task shows a celebration and moves it to "Retired (completed)" list.
- Clicking a task's text opens a dedicated notes page (`#notes-view`): heading = task name, textarea for freeform notes, back button returns to main view. Notes persist per task via `Summit.save`.
- Hand-drawn-style tree (inline SVG, brown/beige palette) grows in stages based on total completed task count: sapling → young tree → flowering → fruiting → grove (every 2 completions = 1 stage).
- Main layout split into `.wood-panel` (title through focus-mode checkbox, dark wood background, no grid paper) and `.paper-panel` (Active tasks and below, grid paper background) for visual separation.
- All persistent data (tasks, notes, completed count) saved via `Summit.save`/`Summit.load` — no localStorage (sandboxed preview).

## Open questions
- Whether to delete the still-unused `style.css` file.

## Notes for future turns
- Theme switcher was removed; grid+brown is final.
- Tree art is inline SVG built in JS, not emoji or image assets.
