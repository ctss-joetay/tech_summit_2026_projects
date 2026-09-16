---
id: 001
date: 2026-09-15
topic: webcam-hand-shape-game
files_touched: index.html, script.js, style.css
decisions:
  - Used MediaPipe Hands (CDN library) for hand tracking rather than building detection from scratch
  - Track index fingertip (landmark 8) as the single tracking point, requiring user to trace shape outline rather than fit whole hand shape
  - Shape completion is based on tracing 75% of sampled outline points with the fingertip, not filling the whole shape
  - Game uses a single 30-second overall timer rather than per-shape countdowns, with unlimited shapes attempted until time runs out
open_questions:
  - Whether hit-radius/difficulty tuning is needed after real camera testing
  - Whether shape variety/order should be randomized differently or follow a fixed progression
---

Built a webcam-based hand-tracking game across index.html, style.css, and script.js. MediaPipe Hands (loaded via CDN) tracks the user's index fingertip, which must trace a randomly placed white shape outline (circle, square, rectangle, triangle) to score a point; each success triggers a confetti burst and a new shape. A 30-second countdown starts on clicking Start and ends the game when it hits zero, with score shown in a top-right HUD.
