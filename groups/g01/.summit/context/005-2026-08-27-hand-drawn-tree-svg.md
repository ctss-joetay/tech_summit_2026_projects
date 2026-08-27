---
id: 005
date: 2026-08-27
topic: hand-drawn-tree-svg
files_touched: script.js, index.html
decisions:
  - Replaced emoji tree with inline SVG line-art tree stages (sapling, young tree, flowering, fruiting, grove) in brown/beige palette
  - Tree grows a stage every 2 completed tasks
open_questions:
  - none
---

Replaced the emoji-based progress tree with hand-drawn-style inline SVG illustrations depicting growth stages: sapling, young tree, flowering tree, fruiting tree, and a grove with a new sapling. The SVGs use wobbly curved paths colored to match the app's brown/beige theme, generated directly in JS rather than using image assets. The growth-per-task logic (advancing a stage every 2 completed tasks) was kept the same as before.
