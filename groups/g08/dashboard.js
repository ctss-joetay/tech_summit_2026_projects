// ============================================================
// Vendor Dashboard — dashboard.js
// Reads every saved order (via the "order-ids" list saved by
// script.js each time an order is sent) and shows a total order
// count, total sales, and a table of every order.
// ============================================================

const totalOrdersEl = document.getElementById("total-orders");
const totalSalesEl = document.getElementById("total-sales");
const ordersTbodyEl = document.getElementById("orders-tbody");

async function loadDashboard() {
  const ids = await Summit.load("order-ids");
  const orderIds = Array.isArray(ids) ? ids : [];

  if (orderIds.length === 0) {
    ordersTbodyEl.innerHTML = `<tr><td colspan="4" class="empty-msg">No orders yet.</td></tr>`;
    totalOrdersEl.textContent = "0";
    totalSalesEl.textContent = "$0.00";
    return;
  }

  // Fetch every order record in parallel.
  const orders = await Promise.all(
    orderIds.map((id) => Summit.load(`order-${id}`))
  );

  const validOrders = orders.filter(Boolean);
  const totalSales = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  totalOrdersEl.textContent = validOrders.length;
  totalSalesEl.textContent = `$${totalSales.toFixed(2)}`;

  ordersTbodyEl.innerHTML = validOrders
    .map((o) => {
      const itemsText = o.items.map((i) => `${i.name} × ${i.qty}`).join(", ");
      return `
        <tr>
          <td>#${o.id}</td>
          <td>${o.stall}</td>
          <td>${itemsText}</td>
          <td>$${o.total.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");
}

loadDashboard();
</content>
