---
id: 009
date: 2026-09-21
topic: level-gameplay-pitch-detection
files_touched: level.js, index.html, style.css
decisions:
  - Replaced old 'Grandkid House'/'home room' project entirely with new Pitch Quest singing game brief
  - Wiped database (avatars/signals tables) since Pitch Quest saves nothing per brief
  - Split code so script.js handles level-select only, level.js handles actual gameplay
  - Used autocorrelation on raw waveform for pitch detection, mapped log-scale ~100-800Hz to vertical staff position
  - Notes generated procedurally per level, 9-16 notes over 15 seconds with wilder pitch jumps at higher levels
open_questions:
  - Pitch detection sensitivity and note difficulty may need tuning
  - Nothing else specified yet for further levels beyond current milestone
---

Continued building the Pitch Quest game by implementing actual level gameplay in a new level.js file, separate from the level-select script.js. Added microphone-based pitch detection to control the black square's vertical position, procedural note generation, scrolling staff with hit/miss detection producing confetti or red flash and heart loss, and a win/lose overlay with retry options. Also cleaned out the leftover database tables (avatars, signals) from the old unrelated project since Pitch Quest persists no data. The full gameplay loop now works end to end, pending further tuning of pitch sensitivity and difficulty.
