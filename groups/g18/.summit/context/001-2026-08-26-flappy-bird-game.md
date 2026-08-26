---
id: 001
date: 2026-08-26
topic: flappy-bird-game
files_touched: script.js, style.css
decisions:
  - Used canvas with requestAnimationFrame game loop for physics and rendering
  - Click/tap/space controls flap and restart
  - Used Summit.save for best score persistence and Summit.submitScore for leaderboard
open_questions:
  - none
---

Built a working Flappy Bird clone using an HTML canvas: a bird with gravity/flap physics, scrolling pipes, collision detection, and a requestAnimationFrame game loop. Input via click, tap, or space bar controls flapping and restarting after game over. Best score is persisted via Summit.save and each run is submitted to the leaderboard via Summit.submitScore. style.css styles the canvas and score display.
