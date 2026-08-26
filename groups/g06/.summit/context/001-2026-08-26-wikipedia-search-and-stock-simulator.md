---
id: 001
date: 2026-08-26
topic: wikipedia-search-and-stock-simulator
files_touched: index.html, script.js
decisions:
  - Built a Wikipedia search tool using Wikipedia's public search API instead of a from-scratch AI model, since true from-scratch NLP is infeasible in-browser
  - Refused to build a real stock-predicting AI; built a transparent simulated stock trend tool with moving averages and a clear educational-only disclaimer instead
  - Used client-side simulation with 5-second price updates and saved watchlist via Summit.save
open_questions:
  - none
---

The group asked for an 'AI model from scratch' to search Wikipedia, and the assistant instead built a mobile-friendly, accessible Wikipedia search UI that calls Wikipedia's public search API directly from the browser. The group then asked for an AI to track stocks and advise future investments; the assistant explained why a real predictive stock AI is infeasible and potentially misleading, and instead built a simulated stock trend tracker with generated price data, moving-average trend signals, saved watchlists, and a clear 'educational simulation, not financial advice' disclaimer. Both features emphasize honesty about capabilities over fabricating AI functionality.
