---
id: 002
date: 2026-08-26
topic: block-gravity-sandbox
files_touched: 
decisions:
  - Add gravity to placed blocks so unsupported blocks fall and settle, rather than only having player gravity
open_questions:
  - none
---

The user asked for gravity in the sandbox game. The player already had gravity/jump physics, so the fix was to make placed blocks behave like sand: any block with empty space below it now falls one row every 0.08 seconds until it lands on solid ground or the floor, instead of floating in place like static painted blocks.
