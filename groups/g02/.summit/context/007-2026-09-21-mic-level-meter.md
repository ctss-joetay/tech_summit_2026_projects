---
id: 007
date: 2026-09-21
topic: mic-level-meter
files_touched: script.js, index.html, style.css
decisions:
  - Added a per-seat visible mic-level meter (including local user's own seat) so users can distinguish mic-capture failure from peer-connection/audio-delivery failure, rather than relying only on the binary .talking class on remote peers
open_questions:
  - Is the audio not being picked up due to mic permissions/capture, or due to WebRTC peer connection delivery? (meter added to help diagnose but root cause not yet confirmed)
---

Addressed a bug report where a call showed 2 participants but no audio seemed to be working. Added a visible mic level meter under every seat, including the local user's own (newly added 'you' seat), so the user can verify whether their mic is being captured at all, independent of whether the peer connection is delivering audio to others. Updated script.js, index.html, and style.css to render and style the meter and to include a self-seat with its own meter on the call screen, and cleaned up leaveCall to remove that seat on exit.
