---
id: 003
date: 2026-09-23
topic: ai-slang-usage-checker
files_touched: script.js, index.html
decisions:
  - Added notepad icon next to dictionary icon to open a 'Practice a Sentence' panel
  - Used Summit.generate (streamed) instead of Summit.judge, since judging slang usage correctness needs explanation, not just meaning comparison
  - Handles blocked AI case by showing platform message verbatim, and catches errors like AI not enabled/budget used up
open_questions:
  - none
---

Implemented an AI-powered slang practice feature: a new notepad icon beside the dictionary icon opens a panel where users pick a slang word from a dropdown, type their own sentence, and click Check. The app streams a response from Summit.generate that judges whether the slang was used correctly and explains why, with proper handling of blocked or errored AI calls. This was considered a stable checkpoint worth publishing.
