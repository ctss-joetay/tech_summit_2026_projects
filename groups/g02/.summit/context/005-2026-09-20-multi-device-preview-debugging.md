---
id: 005
date: 2026-09-20
topic: multi-device-preview-debugging
files_touched: 
decisions:
  - Determined the IDE live preview relies on postMessage to its own IDE tab, so it cannot reliably support multi-device testing even when both devices have the full IDE open
  - Recommended publishing the site and testing on the published URL instead of the in-IDE preview, since that removes the IDE-bridge dependency
open_questions:
  - Whether the join-fails-on-preview error is a platform live-preview messaging flakiness issue or something fixable in script.js/call.js
---

The group debugged a 'could not join' error appearing when testing the app's preview on a second device, tracing it to the IDE live preview's dependence on postMessage communication with its own IDE browser tab rather than a real backend call. Even when the second user had the full IDE open (not just a bare preview URL), the bridge could still fail due to stale handshakes or simultaneous edits/publishes. No code files were changed in this segment; the resolution path suggested was to publish the site and test the published URL across devices instead of relying on the in-IDE preview.
