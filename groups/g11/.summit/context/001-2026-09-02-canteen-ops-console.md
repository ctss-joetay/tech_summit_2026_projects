---
id: 001
date: 2026-09-02
topic: canteen-ops-console
files_touched: script.js, index.html
decisions:
  - Chose Concept 2 'Canteen Ops Console': a CLI-log/monitoring dashboard feel over full sim (Concept 1) or algorithm/chart-focused (Concept 3)
  - Built first version with terminal aesthetic (IBM Plex Mono, dark theme), scrolling event log, stats bar, and occupancy slider; students arrive/eat for random 8-20s/leave, arrivals rejected and logged when full
  - Seat map, Dijkstra pathing, and distance chart deliberately deferred to next steps, not yet built
open_questions:
  - How/whether to integrate the seat map and Dijkstra shortest-path algorithm into this log-focused dashboard
  - How the distance-of-students chart requirement will be implemented given the current design has no spatial map yet
---

The group used a project planner to scope a canteen occupancy simulation and chose 'Canteen Ops Console', a terminal/CLI-styled monitoring dashboard rather than a full spatial simulation or algorithm-focused visualization. The first working version was built with a dark IBM Plex Mono terminal aesthetic, a scrolling event log of student arrivals/seating/eating/departure, a live stats readout (occupancy, load %, avg wait, status), and a slider to adjust max occupancy, with overcrowding handled via rejected arrivals logged in yellow. Seat map, Dijkstra's shortest path algorithm, and the distance chart are still pending and were explicitly left for a later step.
