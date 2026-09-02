---
id: 013
date: 2026-09-02
topic: speech-to-text-task-input
files_touched: script.js, index.html
decisions:
  - Implemented speech-to-text (not text-to-speech) using the browser's built-in Web Speech API instead of a paid/server-based service, to avoid API keys and cost
  - Mic button is hidden entirely in unsupported browsers (Firefox/Safari) rather than shown disabled or broken
open_questions:
  - Whether text-to-speech (reading tasks aloud) is also wanted, since that's a separate API
  - Whether microphone permission will work correctly in the sandboxed preview iframe vs a published page
---

Added a speech-to-text feature letting users dictate tasks via microphone instead of typing, using the browser-native Web Speech API (no server or API key required). A mic button was added next to the task input in index.html, with corresponding logic and pulsing 'listening' state styles in script.js/CSS; it only appears in browsers that support SpeechRecognition (Chrome/Edge), hiding gracefully elsewhere. Failed recognition attempts show a placeholder hint to retry. The feature is additive and doesn't affect existing task-adding functionality.
