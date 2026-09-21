---
id: 010
date: 2026-09-21
topic: mic-permissions-and-scroll-animation
files_touched: level.js, index.html, script.js
decisions:
  - Confirmed code only requests audio via getUserMedia({audio:true}); camera prompt and 'no mic input' errors attributed to browser/iframe permission dialog behavior and site permission settings, not a code bug
  - Replaced setInterval-based auto-scroll with requestAnimationFrame and delta-time scaling for smoother front page animation
  - Implemented distance-from-center card scaling (1.15x center, shrinking to 0.6x at edges) instead of hover-based scaling, removing old :hover scale to avoid conflicts
open_questions:
  - Whether published site's permissions-policy on the iframe could still be blocking mic access even after explicit user allow (flagged as worth investigating if it recurs)
  - Whether to add a clearer on-screen hint distinguishing 'permission denied' vs 'no mic hardware found'
---

The group debugged a discrepancy between microphone-only code and a browser prompt/error suggesting camera access or missing mic input, concluding it was a permissions/browser behavior issue rather than a code defect. They then worked on the front page's scrolling card animation, replacing setInterval-based scrolling with requestAnimationFrame for smoothness and adding logic so the three middle cards appear largest, shrinking toward the edges, replacing the previous hover-based scaling.
