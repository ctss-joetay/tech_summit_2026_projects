---
id: 003
date: 2026-09-18
topic: age-column-float
files_touched: script.js, index.html
decisions:
  - Changed age column from int to real (float) to support decimal ages like 25.5
  - Set age input step to 0.1 and use parseFloat instead of parseInt to match the float storage
open_questions:
  - none
---

Converted the age field from integer to float storage across the app. The database column was retyped from int to real, with the 3 existing rows converted without data loss. The HTML age input was updated to allow decimal entry (step=0.1), and script.js was updated to parse age values with parseFloat instead of parseInt so decimal ages save and sort correctly.
