---
id: 001
date: 2026-09-02
topic: cca-feedback-app
files_touched: index.html, script.js
decisions:
  - Simulated login with name+role picker instead of real MOE authentication, since no backend/auth service is available
  - Used a shared client-side data store (Summit.save/load) so student feedback is visible to teacher view without a real server
  - Replaced 'AI summary' requirement with a transparent keyword-frequency summary since no real AI API call is possible in this environment
  - Used Anime.js for screen transitions and star-rating pop animations for a playful feel
open_questions:
  - none
---

Built a single-page Feedback app with three screens: a login/role picker (student or teacher, name-based stand-in for MOE sign-in), a student view with 5-star course ratings and a suggestion/complaint textarea, and a teacher dashboard showing average ratings per course plus a feedback list and a keyword-based pseudo-AI summary. Anime.js provides playful fade and star-pop animations. Data persists via a shared client-side store so teacher and student views reflect the same feedback without a real backend, and the build was walked through against each step of the brief to confirm ratings and feedback flow correctly between roles.
