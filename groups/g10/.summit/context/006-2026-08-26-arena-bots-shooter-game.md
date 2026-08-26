---
id: 006
date: 2026-08-26
topic: arena-bots-shooter-game
files_touched: script.js, index.html, style.css
decisions:
  - Replaced Flappy Bird with a single-player top-down arena shooter vs AI bots since real multiplayer matchmaking isn't feasible client-side
  - Difficulty scales with score instead of real matchmaking, framed as avoiding 'bad randoms'
  - Used pointer events (pointerdown/pointermove) instead of mouse events to support iPad taps for shooting and aiming
  - Player drawn as a rotating arrow/triangle pointing toward aim direction
  - Canvas made responsive via CSS scaling with getGamePos() to translate tap coordinates correctly
open_questions:
  - none
---

Built a single-player top-down arena shooter called Arena Bots as a substitute for a multiplayer Brawl Stars clone, replacing the previous Flappy Bird game. The player moves with WASD/arrows and shoots via mouse or tap (using pointer events for iPad compatibility), fighting AI bots that increase in difficulty with score instead of real matchmaking. The player character was changed from a circle to a rotating arrow shape indicating aim direction. The layout and canvas were made responsive to fit iPad screens in portrait and landscape, with tap/aim coordinates adjusted to match the scaled canvas.
