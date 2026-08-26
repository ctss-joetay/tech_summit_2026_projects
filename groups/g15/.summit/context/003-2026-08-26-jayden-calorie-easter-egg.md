---
id: 003
date: 2026-08-26
topic: jayden-calorie-easter-egg
files_touched: script.js
decisions:
  - Used Number.MAX_SAFE_INTEGER instead of literal 9^9^9^9 since that value is unrepresentable and would become Infinity/NaN in calculations
open_questions:
  - none
---

Implemented an easter egg where typing 'Jayden' into the food name field auto-fills the calorie input with a huge joke value. Since 9^9^9^9 is too large for JavaScript to represent (it would evaluate to Infinity and break percentage math), Number.MAX_SAFE_INTEGER was used as a practical stand-in that still visually overflows the calorie bar.
