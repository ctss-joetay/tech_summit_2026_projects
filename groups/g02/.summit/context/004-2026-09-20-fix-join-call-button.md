---
id: 004
date: 2026-09-20
topic: fix-join-call-button
files_touched: script.js, index.html
decisions:
  - Kept the in_call column on the avatars table (needed for call feature) and fixed the mismatch by adding it to script.js's ensureTable() so both files agree on schema
  - Made status/button checks run immediately on join and status change instead of waiting for the 2-second polling tick
  - Pinned the join-call button (#call-btn) to fixed position at bottom-center of screen so it's always visible instead of being pushed below the fold in normal page flow
open_questions:
  - none
---

Debugged and fixed a schema mismatch where script.js's ensureTable() lacked the in_call column that call.js expected, causing a false 'column removal' warning when joining. Also fixed the join call button not being visible: added immediate status checks instead of relying only on a 2-second poll, and changed the button's CSS to fixed positioning at the bottom of the screen so it appears reliably once two people mark themselves free to chat.
