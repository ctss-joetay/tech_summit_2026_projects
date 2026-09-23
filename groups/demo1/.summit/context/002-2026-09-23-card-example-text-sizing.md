---
id: 002
date: 2026-09-23
topic: card-example-text-sizing
files_touched: script.js, index.html
decisions:
  - Front card always shows the true/correct example; back quiz sentence (quizExample/quizCorrect) is randomly true or false
  - Used clamp()-based responsive font sizing plus taller card and internal scroll fallback instead of fixed large fonts, to prevent text overflow on long words/sentences
open_questions:
  - none
---

Restructured the flashcard data model so the front of the card always displays a correct example sentence, while the back quiz sentence may be true or false, and confirmed this logic was already correctly implemented. Increased font size and weight across the card, buttons, and dictionary list for readability per user request. Fixed subsequent overflow issues by making the card taller, using clamp()-based responsive font sizes for the word badge, examples, and labels, adding word-wrap/word-break, and allowing internal scrolling so long words or sentences no longer spill outside the card border.
