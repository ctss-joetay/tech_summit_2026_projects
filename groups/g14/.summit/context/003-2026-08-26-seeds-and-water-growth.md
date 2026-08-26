---
id: 003
date: 2026-08-26
topic: seeds-and-water-growth
files_touched: script.js, index.html
decisions:
  - Trees only grow from seeds on grass when water is within a couple of cells
  - Water spreads sideways like a simple liquid and does not block the player
open_questions:
  - none
---

Added a Seed block that falls like sand and, after resting on grass for a few seconds, grows into a tree (trunk plus leaves). Then added a Water block that falls and spreads sideways like a basic liquid, and updated the seed growth logic so trees only sprout when a seed is on grass and near water, making growth depend on water presence rather than just time on grass. Also added a Water button to the toolbar so it can be selected and painted.
