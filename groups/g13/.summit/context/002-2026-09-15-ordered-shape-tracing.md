---
id: 002
date: 2026-09-15
topic: ordered-shape-tracing
files_touched: script.js
decisions:
  - Require 100% of outline points to be traced (COMPLETE_RATIO=1.0)
  - Enforce sequential/directional tracing (pick direction after 2nd touch, only allow forward progress within STEP_WINDOW=2) to prevent 'mopping' the shape with random back-and-forth swipes
open_questions:
  - Whether STEP_WINDOW=2 is the right tolerance for fast real-hand tracing motion
---

Modified script.js to require full (100%) tracing of a shape's outline instead of partial coverage, and added directional/sequential tracing logic so a player must follow the outline in order (clockwise or counter-clockwise) rather than randomly scrubbing their finger over the shape to light up all dots. This prevents a 'mop' exploit where fast back-and-forth swiping could eventually cover all points without actually tracing the shape.
