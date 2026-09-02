---
id: 002
date: 2026-09-02
topic: collected-button-reload
files_touched: script.js, index.html
decisions:
  - Button only appears when order status is 'Ready for pickup!'
  - Reload used to reset UI to home screen instead of manual state reset
open_questions:
  - none
---

Added an "I've collected it" button to the order status card, visible only once the order reaches 'Ready for pickup!' status. Clicking the button reloads the page, returning the user to the home/start screen in preparation for a new order.
