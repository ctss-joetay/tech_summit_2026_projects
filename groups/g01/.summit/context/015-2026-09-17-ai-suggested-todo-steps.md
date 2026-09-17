---
id: 015
date: 2026-09-17
topic: ai-suggested-todo-steps
files_touched: script.js, index.html
decisions:
  - Rejected earlier idea of adding a real external AI API key directly in client-side JS since it would be publicly visible in page source; used platform's Summit.generate instead, which handles auth server-side
  - New tasks are added instantly and AI-generated numbered step suggestions are filled into notes asynchronously afterward, rather than blocking task creation on the AI call
  - AI suggestions only populate notes if the user hasn't already typed their own notes, to avoid overwriting user input
  - Blocked/safety-message responses from Summit.generate are shown verbatim in notes rather than reworded, and errors (e.g. AI not enabled) show as a placeholder hint instead of breaking task functionality
open_questions:
  - Whether AI features are currently enabled for this project, since it requires a teacher to turn it on and behavior wasn't confirmed working yet
---

The group clarified that no webcam bridge or API key exists in the project, and that camera/photo and speech features rely on standard browser APIs, not external services. They then implemented a new AI-enabled feature: when a to-do is added, the app calls the platform's Summit.generate function in the background to auto-populate that task's notes with suggested numbered steps, showing a 'thinking' indicator while waiting, handling blocked or error responses gracefully, and avoiding overwriting any notes the user already typed. This is the first real AI integration in the project and is considered experimental, pending confirmation that AI is enabled and works as intended.
