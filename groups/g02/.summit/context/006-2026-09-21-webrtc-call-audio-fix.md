---
id: 006
date: 2026-09-21
topic: webrtc-call-audio-fix
files_touched: call.js
decisions:
  - Rejected assuming STUN alone was sufficient; added a free public TURN relay (openrelay.metered.ca) as fallback since many networks block direct P2P connections
  - Left silent 'Connecting…' UI in place initially but decided to surface ICE connection state on screen instead of failing silently
open_questions:
  - Whether the free TURN relay (openrelay.metered.ca) will stay reliably available for a live demo
  - Whether the fixes (candidate buffering, explicit audio.play(), TURN relay) actually resolve the no-audio/no-visualizer issue when tested on two real devices
---

The group debugged a WebRTC voice call feature where joining/leaving worked but no audio transferred between devices and no voice-reactive visuals appeared. The assistant identified a signal-ordering race condition where ICE candidates could be silently dropped before the offer/answer was processed, and fixed candidate buffering, explicit audio.play() calls, and lack of connection-state visibility. A second investigation found the deeper cause was likely reliance on STUN-only ICE servers, which fail when devices are behind restrictive NATs; a TURN relay was added as a fallback and connection state is now shown on screen for debugging. Testing on real two-device calls is still pending to confirm the fix works.
