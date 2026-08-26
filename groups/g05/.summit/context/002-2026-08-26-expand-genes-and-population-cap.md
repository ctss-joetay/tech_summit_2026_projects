---
id: 002
date: 2026-08-26
topic: expand-genes-and-population-cap
files_touched: script.js, index.html, style.css
decisions:
  - Grouped 50 genes into scrollable checkbox list by mechanic (7-8 per mechanic)
  - Kept simulation log capped at 200 lines for performance
  - Population cap raised to 1,000,000 despite performance cost since it's plain JS math per person
open_questions:
  - none
---

Expanded the gene pool from a smaller set to 50 named genes, organized into groups by mechanic (7 genes each for most mechanics, 8 for longevity), displayed in a scrollable checkbox list on the dashboard with added CSS styling. Increased the maximum simulated population to 1,000,000 and updated related input limits for food and houses. Noted that simulating a million people will be slow since the simulation performs per-person JS calculations each generation, which is an inherent cost rather than a bug.
