---
id: 004
date: 2026-08-26
topic: ceiling-collision-fix
files_touched: 
decisions:
  - Ceiling now acts as a solid wall stopping the bird instead of ending the game; only floor/pipe collisions end the run
open_questions:
  - none
---

Fixed a bug in a Flappy Bird-style game where the bird would freeze at the top of the screen. Previously, hitting the ceiling triggered endGame() and froze gameplay. The fix changed the ceiling collision to act like a solid wall that stops the bird's upward movement without ending the game, keeping only pipe and floor collisions as game-ending conditions.
