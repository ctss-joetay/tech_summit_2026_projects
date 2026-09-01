---
id: 007
date: 2026-09-01
topic: priority-toggle-and-wood-panel
files_touched: script.js, index.html
decisions:
  - Replaced priority <select> dropdown with a cyclic click-to-toggle button (Low→Medium→High→Low), color-coded per priority, resets to Medium after adding a task
  - Split main layout into .wood-panel (title through focus-mode checkbox, dark wood background, no grid paper) and .paper-panel (Active tasks and below, grid paper background) for visual separation
open_questions:
  - none
---

Changed the priority selector in the task tracker's add-task form from a dropdown to a single button that cycles through Low, Medium, and High on click, with matching color changes, implemented across script.js and index.html/CSS. Also restructured the page layout so the top portion (title through focus-mode checkbox) has a dark wood-grain background while the lower portion (Active tasks onward) keeps the original grid-paper background, creating a clear visual split between sections.
