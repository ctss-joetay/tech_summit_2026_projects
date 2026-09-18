---
id: 001
date: 2026-09-18
topic: leaderboard-and-poll
files_touched: script.js, index.html
decisions:
  - Leaderboard sorts entries oldest-first by age using Summit.db.find with sort:age dir:desc
  - Poll uses Summit.db.tally for server-side vote counting and percentage bars instead of client-side counting
  - Used Summit.db tables (leaderboard, votes) for persistence across reloads
open_questions:
  - none
---

Built a webpage with two visualisation features: a leaderboard where users submit name and age, displayed sorted oldest-first, and a simple coffee-vs-tea poll showing results as percentage bars. Both features persist data using Summit.db tables (leaderboard and votes), with poll tallying done server-side via Summit.db.tally for accuracy. The implementation was completed and considered ready to publish.
