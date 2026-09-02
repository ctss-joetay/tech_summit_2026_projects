---
id: 001
date: 2026-09-02
topic: ipad-control-console
files_touched: index.html, script.js
decisions:
  - Used a simple client-side password stored in script.js rather than real authentication, acceptable for classroom demo but not secure
  - Locking a student stops their usage timer from incrementing rather than simulating an actual device lock, since no real iPad integration exists
  - Added a taunt button as the nice-to-have, implemented as a toast message so it doesn't interfere with core lock/unlock controls
  - State persists via save/load to storage every 5s and after actions so lock states and usage survive a reload
open_questions:
  - Whether real iPad/MDM integration is needed eventually versus keeping this a simulated demo
  - Whether per-student usage limits or a historical usage log should be added
---

Built a nature-themed teacher console for monitoring and controlling student iPad usage in class. It has a password-gated login screen, a dashboard of student cards each showing a live-updating usage timer, individual lock/unlock buttons plus lock-all/unlock-all controls, and a taunt button as a bonus feature. GSAP was used for animated transitions and feedback. The build was walked through against the stated web flow and confirmed to work: login gating, per-student visibility, and the lock command stopping usage tracking until unlocked.
