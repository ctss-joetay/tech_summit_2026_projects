---
id: 002
date: 2026-09-02
topic: settings-panel-and-weeks
files_touched: script.js, index.html, style.css
decisions:
  - Fixed default subjects are Math, Science, Mother Tongue, and English
  - Added a settings panel with dark/light mode, faded-word contrast slider (0-40% transparency), language selector, reset-all, and replay tutorial
  - Removed the help chatbot feature after it was initially added, per request
  - Supported languages narrowed to English, Simplified Chinese, Malay, and Tamil
  - Root cause of settings not working was that setupSettings() (and applySettings()) were defined but never called in init(); fixed by wiring them into init()
  - Added ability to select and rename different weeks
open_questions:
  - Whether the leaderboard should reset each round
---

This segment fixed a non-functional settings tab caused by setupSettings() never being invoked in init(), then wired up dark/light mode, a faded-word transparency slider, language selection, reset-all, and tutorial replay. The chatbot feature added earlier was removed per new instructions. Four fixed subjects (Math, Science, Mother Tongue, English) were established as defaults, language support was narrowed to English/Simplified Chinese/Malay/Tamil, and week selection with renaming was added.
