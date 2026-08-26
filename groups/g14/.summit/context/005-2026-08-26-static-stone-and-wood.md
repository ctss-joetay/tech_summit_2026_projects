---
id: 005
date: 2026-08-26
topic: static-stone-and-wood
files_touched: script.js
decisions:
  - Only dirt, seeds, and water are affected by gravity (via a FALLS set); stone and wood remain fixed once placed
open_questions:
  - none
---

Modified the game's block physics so that stone and wood no longer collapse under gravity, unlike dirt, seeds, and water. This was implemented by introducing a FALLS set that determines which block types are subject to falling behavior, ensuring placed stone/wood structures and trees stay intact.
