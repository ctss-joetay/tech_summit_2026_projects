// ============================================================
// CTSS Canteen Pre-Order — script.js
// Handles: stall/menu selection, cart, sending the order, and
// a simulated "live" status readout (received -> cooking -> ready).
// ============================================================

// ---- 1. Data: stalls and their menu items -------------------
// In a real system this might come from a server. Here it's a
// plain array so the page works with no backend at all.
const STALLS = [
  {
    id: "noodle-bar",
    name: "Noodle Bar",
    items: [
      { id: "n1", name: "Fishball Noodles", price: 3.5 },
      { id: "n2", name: "Wanton Mee", price: 4.0 },
      { id: "n3", name: "Laksa", price: 4.5 },
    ],
  },
  {
    id: "rice-stall",
    name: "Economic Rice",
    items: [
      { id: "r1", name: "Chicken Rice", price: 3.8 },
      { id: "r2", name: "2-Dish Rice", price: 3.5 },
      { id: "r3", name: "3-Dish Rice", price: 4.2 },
    ],
  },
  {
    id: "drinks",
    name: "Drinks Stall",
    items: [
      { id: "d1", name: "Iced Milo", price: 1.5 },
      { id: "d2", name: "Bottled Water", price: 1.0 },
      { id: "d3", name: "Fresh Lime Juice", price: 1.8 },
    ],
  },
];

// ---- 2. App state --------------------------------------------
let selectedStallId = STALLS[0].id;
let cart = []; // { itemId, name, price, qty }
let orderCounter = 1; // used to give each order a visible number
let activeOrder = null; // { id, stallName, items, timer }

// ---- 3. Grab elements ------------------------------------------
const stallTabsEl = document.getElementById("stall-tabs");
const menuGridEl = document.getElementById("menu-grid");
const menuTitleEl = document.getElementById("menu-title");
const cartListEl = document.getElementById("cart-list");
const cartTotalEl = document.getElementById("cart-total");
const sendBtn = document.getElementById("send-order-btn");
const cartErrorEl = document.getElementById("cart-error");

const statusEmptyEl = document.getElementById("status-empty");
const statusCardEl = document.getElementById("status-card");
const statusOrderIdEl = document.getElementById("status-order-id");
const statusStallEl = document.getElementById("status-stall");
const statusItemsEl = document.getElementById("status-items");
const progressFillEl = document.getElementById("progress-fill");
const statusLabelEl = document.getElementById("status-label");
const statusEtaEl = document.getElementById("status-eta");
const collectedBtn = document.getElementById("collected-btn");

// Clicking this once the order is ready just reloads the page, which
// resets all in-memory state (cart, active order) back to a fresh start.
collectedBtn.addEventListener("click", () => {
  window.location.reload();
});

// ---- 4. Render stall tabs ---------------------------------------
function renderStallTabs() {
  stallTabsEl.innerHTML = "";
  STALLS.forEach((stall) => {
    const btn = document.createElement("button");
    btn.className = "stall-tab" + (stall.id === selectedStallId ? " active" : "");
    btn.textContent = stall.name;
    btn.addEventListener("click", () => {
      selectedStallId = stall.id;
      renderStallTabs();
      renderMenu();
    });
    stallTabsEl.appendChild(btn);
  });
}

// ---- 5. Render menu items for the selected stall -----------------
function renderMenu() {
  const stall = STALLS.find((s) => s.id === selectedStallId);
  menuTitleEl.textContent = `2. Pick your food — ${stall.name}`;
  menuGridEl.innerHTML = "";

  stall.items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <h3>${item.name}</h3>
      <span class="price">$${item.price.toFixed(2)}</span>
      <span class="add-hint">Tap to add</span>
    `;
    card.addEventListener("click", () => addToCart(stall, item));
    menuGridEl.appendChild(card);

    // A small animejs "pop" so adding feels responsive rather than instant.
    card.addEventListener("click", () => {
      if (window.anime) {
        anime({
          targets: card,
          scale: [1, 0.95, 1],
          duration: 250,
          easing: "easeInOutQuad",
        });
      }
    });
  });
}

// ---- 6. Cart logic ------------------------------------------------
function addToCart(stall, item) {
  // All items in the cart must come from the same stall — an order
  // only goes to one kitchen at a time, keeping this simple.
  if (cart.length > 0 && cart[0].stallId !== stall.id) {
    cartErrorEl.textContent =
      "Your cart has items from another stall. Send or clear that order first.";
    return;
  }
  cartErrorEl.textContent = "";

  const existing = cart.find((c) => c.itemId === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      stallId: stall.id,
      stallName: stall.name,
      itemId: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
    });
  }
  renderCart();
}

function removeFromCart(itemId) {
  cart = cart.filter((c) => c.itemId !== itemId);
  renderCart();
}

function renderCart() {
  cartListEl.innerHTML = "";

  if (cart.length === 0) {
    cartListEl.innerHTML = `<li class="empty-msg">No items yet — tap a menu item to add it.</li>`;
  } else {
    cart.forEach((c) => {
      const li = document.createElement("li");
      const lineTotal = (c.price * c.qty).toFixed(2);
      li.innerHTML = `
        <span>${c.name} × ${c.qty} — $${lineTotal}</span>
        <button class="remove-btn" data-id="${c.itemId}">Remove</button>
      `;
      li.querySelector(".remove-btn").addEventListener("click", () => removeFromCart(c.itemId));
      cartListEl.appendChild(li);
    });
  }

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  cartTotalEl.textContent = total.toFixed(2);
  sendBtn.disabled = cart.length === 0;
}

// ---- 7. Sending the order to the "kitchen" --------------------------
sendBtn.addEventListener("click", () => {
  if (cart.length === 0) return;

  const orderId = orderCounter++;
  const stallName = cart[0].stallName;
  const itemsSnapshot = cart.map((c) => ({ ...c }));

  // Save the order so it survives a reload (Summit.save is the only
  // persistence available in the sandboxed preview — no localStorage here).
  const total = itemsSnapshot.reduce((sum, c) => sum + c.price * c.qty, 0);
  const orderRecord = {
    id: orderId,
    stall: stallName,
    items: itemsSnapshot,
    total,
    sentAt: Date.now(),
  };
  Summit.save(`order-${orderId}`, orderRecord);

  // Also keep a running list of order ids, so the vendor dashboard page
  // knows which orders exist without needing a database to query.
  Summit.load("order-ids").then((ids) => {
    const list = Array.isArray(ids) ? ids : [];
    list.push(orderId);
    Summit.save("order-ids", list);
  });

  startOrderStatus(orderId, stallName, itemsSnapshot);

  // Clear the cart — the order has left the student's hands.
  cart = [];
  renderCart();
});

// ---- 8. Live order status simulation ---------------------------------
// Real kitchens don't push live data to this page, so we simulate a
// believable progression: Received -> Preparing -> Ready, with a
// countdown ETA. This satisfies the "live status" nice-to-have.
const STAGES = [
  { label: "Received", pct: 10, holdMs: 2000 },
  { label: "Preparing", pct: 55, holdMs: 5000 },
  { label: "Ready for pickup!", pct: 100, holdMs: 0 },
];

function startOrderStatus(orderId, stallName, items) {
  // Cancel any previous simulation still running.
  if (activeOrder && activeOrder.timer) clearTimeout(activeOrder.timer);

  activeOrder = { id: orderId, stallName, items, timer: null, stageIndex: 0 };

  statusEmptyEl.classList.add("hidden");
  statusCardEl.classList.remove("hidden");

  statusOrderIdEl.textContent = orderId;
  statusStallEl.textContent = stallName;
  statusItemsEl.innerHTML = items
    .map((i) => `<li>${i.name} × ${i.qty}</li>`)
    .join("");

  // Animate the card appearing so it feels alive, not just popped in.
  if (window.anime) {
    anime({
      targets: statusCardEl,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 400,
      easing: "easeOutQuad",
    });
  }

  runStage(0);
}

function runStage(index) {
  if (!activeOrder || index >= STAGES.length) return;
  const stage = STAGES[index];

  statusLabelEl.textContent = stage.label;
  statusEtaEl.textContent =
    stage.label === "Ready for pickup!"
      ? "Head to the stall now."
      : `Estimated time remaining: ~${Math.ceil(stage.holdMs / 1000) + estimateRemainingStages(index)}s`;

  // Only show the "I've collected it" button once the order is ready.
  collectedBtn.classList.toggle("hidden", stage.label !== "Ready for pickup!");

  // Animate the progress bar smoothly to its new percentage.
  if (window.anime) {
    anime({
      targets: progressFillEl,
      width: `${stage.pct}%`,
      duration: 800,
      easing: "easeInOutQuad",
    });
  } else {
    progressFillEl.style.width = `${stage.pct}%`;
  }

  if (index < STAGES.length - 1) {
    activeOrder.timer = setTimeout(() => runStage(index + 1), stage.holdMs);
  }
}

function estimateRemainingStages(fromIndex) {
  let total = 0;
  for (let i = fromIndex + 1; i < STAGES.length; i++) total += STAGES[i].holdMs / 1000;
  return total;
}

// ---- 9. Initial render -----------------------------------------------
renderStallTabs();
renderMenu();
renderCart();
