---
id: 003
date: 2026-08-26
topic: varied-pipe-obstacles
files_touched: script.js
decisions:
  - Pipe gap always sized to fit at least 3 bird-diameters
  - Pipes randomized in width and color style with bright cap indicating gap
open_questions:
  - none
---

Modified the pipe/pillar generation logic so pipes vary in width and color style (green, wood, stone, blue), each with a bright cap band marking the gap opening for visibility. Gap size is randomized but constrained to always fit at least 3 bird-diameters, ensuring fair difficulty. Collision detection was updated to use each pillar's individual width and gap rather than a single fixed size.
