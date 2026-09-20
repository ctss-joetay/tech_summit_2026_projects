---
id: 003
date: 2026-09-20
topic: status-picker-and-voice-chat
files_touched: script.js, index.html, call.js
decisions:
  - Added a status-picker popup for own avatar with 7 statuses, updating shared table and sprite icon
  - Implemented voice chat via mesh WebRTC using a 'signals' table in the shared database as a signaling server substitute, since there's no real backend server
  - Added 'in_call' flag to avatars table to track call membership
  - Call UI shows participants seated around a round table, with cuboids scaling/pulsing when talking (measured via Web Audio API)
  - Start/Join call button appears only when 2+ users set status to 'free to chat'
  - Roster re-polls every 1.5s to handle mid-call joins/leaves
open_questions:
  - Whether live preview sandbox will block microphone access (getUserMedia) — may need testing on published site instead
---

Built a status-picker feature letting users set their own avatar's status from a popup of 7 options, reflected in a shared table and shown as an icon on the sprite. Implemented a full peer-to-peer voice chat system in a new call.js file using WebRTC mesh connections, with a 'signals' database table standing in for a signaling server. Added call UI with a round-table seating layout where avatars visually react to talking via volume detection, plus join/leave handling and an 'in_call' flag on avatars. Suggested publishing before testing microphone access across tabs since the sandboxed preview may block getUserMedia.
