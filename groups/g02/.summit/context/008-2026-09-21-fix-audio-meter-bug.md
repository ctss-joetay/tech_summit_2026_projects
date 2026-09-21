---
id: 008
date: 2026-09-21
topic: fix-audio-meter-bug
files_touched: call.js
decisions:
  - Diagnosed frozen teal audio meter as caused by 'no audio tracks' error being silently swallowed; added explicit checks and user-facing error messages instead of failing silently
  - Added AudioContext.resume() call since some browsers create it suspended even from click handlers, which also causes a stuck meter with no error
open_questions:
  - If bar still doesn't move after these fixes, need to confirm whether another app/tab is holding the microphone
---

Debugged a stuck teal audio level meter in call.js, tracing it to an unhandled 'Media stream has no audio tracks' error thrown by createMediaStreamSource. Added a check right after getUserMedia to detect missing audio tracks and show a clear on-screen message instead of failing silently, and added an AudioContext.resume() call to handle browsers that create the context in a suspended state. The fix should surface real error messages, but if the bar is still frozen after this, the mic may be held by another app or tab.
