---
id: 002
date: 2026-09-20
topic: isometric-room-and-wandering
files_touched: style.css, script.js
decisions:
  - Room rebuilt as true isometric hexagon using CSS clip-path for floor rhombus + two wall rhombuses instead of vanishing-point perspective
  - Idle/free avatars wander randomly within the floor diamond every 3-6s via absolute positioning + CSS transitions; busy statuses (working, sleeping, chores, playing games, exercising) stay put
  - Polling now updates existing sprite elements in place rather than clearing/rebuilding the room, so wandering isn't reset each poll
open_questions:
  - Status-setting UI (click own avatar to choose status) still not built - status only defaults to 'relaxing' at join
---

Rebuilt the shared room visual as a proper isometric hexagon (floor rhombus plus two wall rhombuses) using CSS clip-path, replacing the previous non-isometric layout. Added wandering behavior so avatars with no active task drift to random points within the floor diamond every few seconds via smooth CSS transitions, while busy avatars remain stationary. Refactored the polling/render logic to update existing DOM sprites in place instead of rebuilding the room each cycle, preventing wandering resets. Status selection UI for users to set their own activity is still unbuilt.
