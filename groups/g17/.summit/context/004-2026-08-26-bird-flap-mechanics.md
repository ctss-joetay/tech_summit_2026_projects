---
id: 004
date: 2026-08-26
topic: bird-flap-mechanics
files_touched: script.js
decisions:
  - Flap velocity calculated via v=√(2·gravity·height) so each Space press lifts the bird about one bird-height (28px), keeping jump height consistent across frame rates
open_questions:
  - none
---

Adjusted the flappy-bird-style game's controls so the bird continuously falls under gravity and only rises when the player presses Space (or clicks/taps), with the flap strength tuned to lift the bird approximately one bird's height per press. This required computing FLAP_STRENGTH from the physics formula v=√(2·gravity·height) to ensure consistent jump height independent of frame rate.
