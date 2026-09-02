---
id: 001
date: 2026-09-02
topic: online-food-preorder
files_touched: index.html, script.js
decisions:
  - Order can only contain items from one stall at a time, blocking mixed-stall carts since each order routes to a single kitchen
  - Used anime.js from CDN for cart pop and progress bar animations to keep it lightweight
  - Simulated live order status (Received→Preparing→Ready) client-side since there's no real vendor backend
  - Used Summit.save to persist orders since sandboxed preview lacks localStorage
open_questions:
  - Should a real vendor-facing dashboard be built so kitchen staff can update order status live instead of simulation?
---

Built a single-page food pre-order interactive with stall tabs, menu selection, a cart restricted to one stall per order, and a send-to-kitchen action that triggers a simulated live status tracker (Received/Preparing/Ready) with an animated progress bar via anime.js. Orders persist through Summit.save. The build satisfies the stated must-haves and the 'nice to have' live status broadcast, but the kitchen side is simulated rather than a real two-way vendor system.
