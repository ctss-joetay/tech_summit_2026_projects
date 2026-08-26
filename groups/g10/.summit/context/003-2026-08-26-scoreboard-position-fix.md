---
id: 003
date: 2026-08-26
topic: scoreboard-position-fix
files_touched: index.html
decisions:
  - none
open_questions:
  - none
---

User asked for a score feature that increments when the character passes a pipe; assistant found this logic already existed in script.js and required no changes. User then asked for the scoreboard to be positioned at the middle top of the screen; assistant repositioned the #score element using CSS (absolute positioning within a wrapper div, centered, bold white text with shadow) to overlay the top of the canvas like classic Flappy Bird, without touching script.js.
