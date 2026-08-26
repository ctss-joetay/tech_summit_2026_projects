---
id: 001
date: 2026-08-26
topic: flappy-bird-clone
files_touched: script.js, style.css, index.html
decisions:
  - Use canvas-based game loop with gravity and flap mechanics
  - Save best score persistently using Summit.save
open_questions:
  - none
---

Built a Flappy Bird clone using an HTML canvas, with script.js handling the game loop (gravity, flapping via space/click/tap, scrolling pipes, and collision detection) and style.css styling the canvas and Start/Restart button. Score increments when passing pipes, and the best score persists across reloads via Summit.save. An initial mistake placed JS code inside index.html, which was corrected by moving it to script.js.
