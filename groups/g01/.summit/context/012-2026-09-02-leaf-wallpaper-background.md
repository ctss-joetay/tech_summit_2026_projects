---
id: 012
date: 2026-09-02
topic: leaf-wallpaper-background
files_touched: style.css
decisions:
  - Rejected real SQLite database since app is client-side only; suggested code-based namespaced storage via Summit.save/load instead, noting it's not real per-user security
  - Rejected real AI API integration due to exposed API key risk in client-side script.js; recommended rule-based fake-AI features (keyword-based priority detection, canned coaching messages) as safer alternative
  - Clarified that using an open-source model's API key has the same exposure risk as any other key since it's about where the key lives, not which model it calls
open_questions:
  - Whether to eventually implement a personal-code task list feature
  - Whether to pursue a free-tier real AI API call with exposed demo key vs sticking with rule-based fake-AI features
  - Whether the leaf wallpaper opacity/size needs tweaking
---

The group tested the project planner with a K-pop character game concept but explicitly discarded it, continuing instead with the existing cafe-notebook Task Tracker project. Discussion covered the limitations of adding a real SQLite database and real AI API features to a client-side-only app, with the assistant explaining risks (no server, exposed API keys) and proposing safer alternatives (namespaced Summit storage, rule-based fake-AI). The assistant then implemented a visual change, adding a light brown leaf-pattern SVG wallpaper as a background behind the grid paper panel via CSS.
