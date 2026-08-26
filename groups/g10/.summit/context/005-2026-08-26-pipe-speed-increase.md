---
id: 005
date: 2026-08-26
topic: pipe-speed-increase
files_touched: script.js
decisions:
  - Increase pipeSpeed by 0.5 every 5 points, reset speed on new game
open_questions:
  - none
---

Modified the Flappy Bird-style game so pipeSpeed is now a variable instead of a constant. Every time the player's score reaches a multiple of 5, pipeSpeed increases by 0.5, making pipes move faster over time. The speed resets to its default value when a new game starts.
