---
id: 003
date: 2026-09-16
topic: leaderboard-with-opt-out
files_touched: script.js, index.html
decisions:
  - Used Summit.submitScore/Summit.leaderboard built-in storage for persistence
  - Added opt-out checkbox so players can skip being added to leaderboard
  - Leaderboard refreshes immediately after each submission and shows top 10
open_questions:
  - Whether the leaderboard should reset each round
---

Added a post-game name-entry form with a keyboard input and an opt-out checkbox, submitting scores via Summit.submitScore unless opted out. The leaderboard displays the top 10 entries via Summit.leaderboard(), refreshing after each new submission and loading once on page open. Styles were added for the leaderboard and form. Noted that leaderboard data is public to anyone who plays the published project.
