---
id: 004
date: 2026-08-26
topic: player-block-interaction
files_touched: script.js, index.html
decisions:
  - Player interacts with world via facing direction and a reach highlight rather than only mouse painting
  - F key breaks block, G key places selected toolbar block into highlighted cell
open_questions:
  - none
---

Added direct player-world interaction to the sandbox game: the player character now faces left or right based on movement and highlights the adjacent cell within reach. Pressing F breaks the highlighted block and G places the currently selected toolbar block there, complementing the existing mouse-based painting. Hint text was updated to reflect the new controls, making the game feel more like a true sandbox where the player digs and builds while exploring.
