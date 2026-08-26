---
id: 001
date: 2026-08-26
topic: gene-survival-simulation
files_touched: script.js, index.html
decisions:
  - Simulation uses food/house-based reproduction requiring two fed parents per house instead of simple probability reproduction
  - Each gene has independent random mutation chance (dashboard adjustable) instead of fixed 5%
  - Genes inherited randomly per-gene from either parent
  - Population cap raised to 10000, genes per person up to 10
open_questions:
  - Whether log/graph performance is acceptable at 10,000 population scale
---

Built a gene-based survival simulation game with a dashboard controlling population size, gene count/types (7 selectable effects), disease kill %, reproduction %, food supply, house count, mutation %, and offspring count. Each generation, people need food to survive, fed pairs need an available house to reproduce, and babies inherit genes randomly from both parents with a configurable mutation chance. Includes Play/Step/Reset controls and a live population graph/log. This built on an earlier shopping list app work (script.js/index.html) which had item pricing, region simulation, and exclude-from-total features added first, then debugged for a blank-render bug caused by Promise.all failing on missing saved keys.
