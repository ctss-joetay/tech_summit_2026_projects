---
id: 002
date: 2026-09-02
topic: password-lock-unlock
files_touched: script.js, style.css
decisions:
  - Used an on-page modal instead of prompt() for password entry since prompt() is disabled in the sandbox
  - Reused the same login password (grove2026) to gate all lock/unlock actions including Lock All/Unlock All
open_questions:
  - none
---

Added password confirmation requirements for locking and unlocking iPads, both individually and via Lock All/Unlock All buttons. Implemented via a custom modal (askForPassword helper returning a promise) with matching CSS styling, since native prompt() is unavailable. Verified the existing login password also gates all lock/unlock actions so a student can't bypass security by clicking buttons on an open dashboard.
