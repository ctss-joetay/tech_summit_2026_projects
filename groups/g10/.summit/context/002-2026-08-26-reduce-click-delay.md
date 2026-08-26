---
id: 002
date: 2026-08-26
topic: reduce-click-delay
files_touched: 
decisions:
  - Use pointerdown instead of click to avoid ~300ms tap delay
  - Disable touch gestures on canvas to prevent scroll conflicts
open_questions:
  - none
---

The user reported a delay when clicking/tapping the screen. The assistant explained this was caused by the browser's default click event waiting to detect double-taps, adding roughly 300ms of latency on touchscreens. The fix was to replace click handling with pointerdown, which triggers immediately on both mouse and touch input, and to disable touch gestures on the canvas so taps aren't misinterpreted as scrolling. No specific files were shown or edited in this exchange.
