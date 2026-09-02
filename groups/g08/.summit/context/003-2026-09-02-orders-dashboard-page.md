---
id: 003
date: 2026-09-02
topic: orders-dashboard-page
files_touched: orders.html, index.html, script.js, style.css
decisions:
  - Orders are now tracked in a running list/array in storage (not just saved individually) so a dashboard can total them
  - Added a separate dashboard page (orders.html) rather than embedding totals into the existing upload page, reusing the same style.css
open_questions:
  - none
---

Added a new dashboard page that displays total orders and total price collected, intended for vendor/staff use. To support this, order data is now tracked in a running list rather than saved as isolated entries. Linked the new page from the home page and added matching CSS styling.
