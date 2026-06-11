/* ─── STATE ─── */
let currentUser = null;
let selectedTable = null;
let selectedBevs = new Set();
let cart = [];
let deliveryMode = "dine-in";
let afterLoginPage = localStorage.getItem('gokyoAfterLoginPage') || null;

let menuItems = [
  { id: 1, name: "Thukpa Noodles", cat: "mains", price: 350, desc: "Tibetan-style broth noodles with tender vegetables.", emoji: "🍜", image: "thukpa.png" },
  { id: 2, name: "Garden Salad", cat: "starters", price: 280, desc: "Crisp seasonal greens with lemon-herb dressing.", emoji: "🥗", image: "Garden Salad.png" },
  { id: 3, name: "Grilled Chicken", cat: "mains", price: 580, desc: "Free-range chicken marinated in Himalayan herbs.", emoji: "🍗", image: "Grilled Chicken.png" },
  { id: 4, name: "Masala Tea", cat: "drinks", price: 120, desc: "Traditional Nepali-spiced milk tea.", emoji: "☕", image: "masala tea.png" },
  { id: 5, name: "Fresh Juice", cat: "drinks", price: 180, desc: "Cold-pressed seasonal fruit juice.", emoji: "🍊", image: "orange juice.png" },
  { id: 6, name: "Cappuccino", cat: "drinks", price: 200, desc: "Italian roast, perfectly balanced.", emoji: "☕", image: "cappechino.png" },
  { id: 7, name: "Momo (Steamed)", cat: "starters", price: 220, desc: "Hand-crafted dumplings with achar dipping sauce.", emoji: "🥟", image: "momo.png" },
  { id: 8, name: "Dal Bhat Thali", cat: "mains", price: 450, desc: "Nepali staple — rice, lentils, curry, and greens.", emoji: "🍱", image: "dalbhat.png" },
  { id: 9, name: "House Red Wine", cat: "premium", price: 950, desc: "Smooth, full-bodied red for premium members.", emoji: "🍷", image: "wine.png" },
];

let tables = [
  { id: "T1", seats: 2, location: "Indoor", occupied: false },
  { id: "T2", seats: 4, location: "Indoor", occupied: true },
  { id: "T3", seats: 2, location: "Indoor", occupied: false },
  { id: "T4", seats: 6, location: "Outdoor", occupied: false },
  { id: "T5", seats: 4, location: "Outdoor", occupied: true },
  { id: "T6", seats: 2, location: "Private", occupied: false },
  { id: "T7", seats: 4, location: "Outdoor", occupied: false },
  { id: "T8", seats: 6, location: "Outdoor", occupied: true },
];

let sampleBookings = [
  { id: "#GBR-2026-0142", table: "T3 · Indoor", datetime: "Jan 20, 2026 · 7:00 PM", guests: 2, paid: "Rs. 1,200", status: "confirmed" },
  { id: "#GBR-2026-0130", table: "T7 · Outdoor", datetime: "Jan 25, 2026 · 1:00 PM", guests: 4, paid: "Rs. 1,200", status: "upcoming" },
];

/* ─── BACKEND API CONNECTION ─── */

async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(path, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    return await response.json();
  } catch (error) {
    console.warn('API error:', error);
    return null;
  }
}

function saveLoginState(user) {
  localStorage.setItem('gokyoCurrentUser', JSON.stringify(user));
  localStorage.setItem('gokyoUser', JSON.stringify(user));
  localStorage.setItem('gokyoIsLoggedIn', 'true');
  localStorage.setItem('gokyoLoggedIn', 'true');
}

function clearLoginState() {
  localStorage.removeItem('gokyoCurrentUser');
  localStorage.removeItem('gokyoUser');
  localStorage.removeItem('gokyoIsLoggedIn');
  localStorage.removeItem('gokyoLoggedIn');
  localStorage.removeItem('gokyoAfterLoginPage');
}

/* ─── AUTH FUNCTIONS (CONNECTED TO BACKEND) ─── */

async function doLogin() {
  const email = document.getElementById("login-email")?.value.trim();
  const password = document.getElementById("login-password")?.value;
  
  if (!email || !password) {
    showToast("Please fill all fields", "⚠️");
    return;
  }

  try {
    const data = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data && data.success) {
      currentUser = data.user;
      saveLoginState(currentUser);
      showToast("Welcome back, " + currentUser.name + "!", "✅");
      
      const target = afterLoginPage || 'home.html';
      afterLoginPage = null;
      localStorage.removeItem('gokyoAfterLoginPage');
      window.location.href = target;
    } else {
      // Fallback to local storage
      const localUser = findLocalUser(email, password);
      if (localUser) {
        currentUser = localUser;
        saveLoginState(currentUser);
        showToast("Welcome back, " + currentUser.full_name + "!", "✅");
        const target = afterLoginPage || 'home.html';
        afterLoginPage = null;
        localStorage.removeItem('gokyoAfterLoginPage');
        window.location.href = target;
      } else {
        showToast("Invalid credentials. Please register first.", "⚠️");
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast("Login failed. Please try again.", "❌");
  }
}

async function doGuestLogin() {
  try {
    const data = await apiRequest('/api/guest-login', {
      method: 'POST'
    });

    if (data && data.success) {
      currentUser = data.user;
    } else {
      currentUser = { id: 'guest', name: "Guest", email: "guest", account_type: "visitor", initials: "G" };
    }
    
    saveLoginState(currentUser);
    showToast("Browsing as Guest", "ℹ️");
    
    const target = afterLoginPage || 'home.html';
    afterLoginPage = null;
    localStorage.removeItem('gokyoAfterLoginPage');
    window.location.href = target;
  } catch (error) {
    console.error('Guest login error:', error);
    window.location.href = 'home.html';
  }
}

async function doRegister() {
  const name = document.getElementById("reg-name")?.value.trim();
  const phone = document.getElementById("reg-phone")?.value.trim();
  const email = document.getElementById("reg-email")?.value.trim();
  const password = document.getElementById("reg-password")?.value;
  const accountType = document.getElementById("reg-type")?.value || "visitor";

  if (!name || !email || !phone || !password) {
    showToast("Please fill all fields", "⚠️");
    return;
  }

  try {
    const data = await apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: name, email, phone, password, account_type: accountType })
    });

    if (data && data.success) {
      currentUser = data.user;
      saveLoginState(currentUser);
      showToast("Account created! Welcome, " + currentUser.name + "!", "🎉");
      
      const target = afterLoginPage || 'home.html';
      afterLoginPage = null;
      localStorage.removeItem('gokyoAfterLoginPage');
      window.location.href = target;
    } else {
      showToast("Registration failed. Please try again.", "❌");
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast("Registration failed. Please try again.", "❌");
  }
}

async function logout() {
  try {
    await apiRequest('/api/logout', { method: 'GET' });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  currentUser = null;
  clearLoginState();
  showToast("Signed out successfully", "ℹ️");
  window.location.href = 'home.html';
}

function requireAuth(target) {
  const isLoggedIn = localStorage.getItem('gokyoIsLoggedIn') === 'true' || localStorage.getItem('gokyoLoggedIn') === 'true';
  if (!isLoggedIn && !currentUser) {
    afterLoginPage = target;
    localStorage.setItem('gokyoAfterLoginPage', afterLoginPage);
    showToast("Please sign in to continue", "🔐");
    window.location.href = 'login.html';
  } else {
    window.location.href = target;
  }
}

async function restoreUser() {
  currentUser = null;
  const stored = localStorage.getItem('gokyoCurrentUser') || localStorage.getItem('gokyoUser');
  const loggedIn = localStorage.getItem('gokyoIsLoggedIn') === 'true' || localStorage.getItem('gokyoLoggedIn') === 'true';

  const serverUser = await getServerUser();
  if (serverUser) {
    currentUser = serverUser;
    saveLoginState(currentUser);
  } else if (loggedIn && stored) {
    try {
      currentUser = JSON.parse(stored);
    } catch (error) {
      currentUser = null;
    }
  }

  updateUserUI();
}

async function getServerUser() {
  try {
    const data = await apiRequest('/api/user');
    if (data && data.success && data.user) {
      return data.user;
    }
  } catch (error) {
    console.warn('Unable to load user from server', error);
  }
  return null;
}

function updateUserUI() {
  const authButtons = document.getElementById("nav-auth-btns");
  const info = document.getElementById("nav-user-info");
  const avatar = document.getElementById("user-avatar");
  const homeGreeting = document.getElementById("home-user-welcome");

  if (currentUser) {
    const initials = currentUser.initials || (currentUser.name || currentUser.full_name || '').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
    if (avatar) avatar.textContent = initials;
    if (authButtons) authButtons.style.display = "none";
    if (info) info.style.display = "flex";
    if (homeGreeting) homeGreeting.textContent = `Welcome back, ${currentUser.name || currentUser.full_name || 'Guest'}.`;
  } else {
    if (authButtons) authButtons.style.display = "flex";
    if (info) info.style.display = "none";
    if (avatar) avatar.textContent = "SB";
    if (homeGreeting) homeGreeting.textContent = "Discover the flavours of Gokyo Bistro.";
  }
}

async function loadMenuItems() {
  try {
    const data = await apiRequest('/api/menu');
    if (data && data.success && Array.isArray(data.menu) && data.menu.length > 0) {
      // Find matching items in original local menuItems to preserve image & emoji
      const defaultItems = [...menuItems];
      menuItems = data.menu.map(item => {
        const itemName = item.name || item.item_name || '';
        const local = defaultItems.find(li => li.name.toLowerCase() === itemName.toLowerCase());
        return {
          id: item.id,
          name: itemName || 'Menu Item',
          cat: item.category || item.cat || (local ? local.cat : 'all'),
          price: item.price ?? 0,
          desc: item.description || item.desc || (local ? local.desc : ''),
          image: item.image || item.img || (local ? local.image : ''),
          emoji: item.emoji || (local ? local.emoji : '🍽️')
        };
      });
    }
  } catch (error) {
    console.warn('Failed to fetch menu from backend, using local sample menu', error);
  }

  renderMenuGrid(menuItems);
  renderOrderItems(menuItems);
  renderHomeFeatured(menuItems.slice(0, 3));
}

function renderHomeFeatured(items) {
  const homeMenu = document.getElementById('home-featured-menu');
  if (!homeMenu) return;

  if (!items.length) {
    homeMenu.innerHTML = '<p style="font-size:16px; color: var(--muted);">Menu items are loading or unavailable right now. Please refresh.</p>';
    return;
  }

  homeMenu.innerHTML = items.map((item, index) => `
    <div class="menu-card">
      <div class="menu-card-num">0${index + 1}</div>
      <div class="menu-card-img" style="background: ${item.image ? `url('images/${item.image}')` : 'var(--cream)'} center/cover no-repeat;"></div>
      <div class="menu-card-name">${item.name}</div>
      <div class="menu-card-cat">${item.cat}</div>
      <div class="menu-card-desc">${item.desc}</div>
      <div class="menu-card-price">Rs. ${item.price}</div>
    </div>
  `).join('');
}

async function loadOffers() {
  try {
    const data = await apiRequest('/api/offers');
    if (data && data.success && Array.isArray(data.offers)) {
      renderOffers(data.offers);
      return;
    }
  } catch (error) {
    console.warn('Failed to fetch offers from backend', error);
  }

  renderOffers([]);
}

function renderOffers(offers) {
  const container = document.getElementById('offers-strip');
  if (!container) return;
  if (!offers.length) {
    container.innerHTML = `
      <div class="offer-badge">
        <div class="offer-dot"></div>
        <span>No active offers right now. Check back later.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = offers.map(offer => `
    <div class="offer-badge">
      <div class="offer-dot"></div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span>${offer.title || offer.offer_name || offer.name || 'Special Offer'}</span>
        ${offer.description ? `<small style="font-size: 12px; opacity: 0.85;">${offer.description}</small>` : ''}
      </div>
    </div>
  `).join('<div class="offer-divider"></div>');
}

/* ─── LOCAL STORAGE HELPERS ─── */

function getLocalUsers() {
  const stored = localStorage.getItem('gokyoLocalUsers');
  if (!stored) return [];
  try {
    return JSON.parse(stored) || [];
  } catch (error) {
    return [];
  }
}

function saveLocalUsers(users) {
  localStorage.setItem('gokyoLocalUsers', JSON.stringify(users));
}

function findLocalUser(email, password) {
  if (!email || !password) return null;
  const normalized = email.trim().toLowerCase();
  return getLocalUsers().find(
    user => user.email.toLowerCase() === normalized && user.password === password
  );
}

function formatUserName(email) {
  const username = email.split('@')[0].replace(/[._-]/g, ' ');
  return username.split(' ').filter(Boolean).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/* ─── UI FUNCTIONS ─── */

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const pg = document.getElementById(id);
  if (pg) {
    pg.classList.add("active");
    window.scrollTo(0, 0);
  }
}

function showToast(msg, icon = "✅") {
  const t = document.getElementById("toast");
  const toastText = document.getElementById("toast-text");
  const toastIcon = document.getElementById("toast-icon");
  if (!t) return;
  
  if (toastIcon) toastIcon.textContent = icon;
  if (toastText) toastText.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}

function initTables() {
  const grid = document.getElementById("table-grid");
  if (!grid) return;
  grid.innerHTML = tables.map(t => `
    <div class="table-btn ${t.occupied ? "occupied" : "available"}"
         onclick="${t.occupied ? "" : `selectTable('${t.id}',this)`}">
      <span class="t-id">${t.id}</span>
      <span class="t-seats">${t.seats} pax · ${t.location}</span>
    </div>
  `).join("");
}

function selectTable(id, el) {
  selectedTable = id;
  document.querySelectorAll(".table-btn").forEach(b => b.classList.remove("selected"));
  el.classList.add("selected");
  const t = tables.find(x => x.id === id);
  const sumTable = document.getElementById("sum-table");
  if (sumTable) sumTable.textContent = `${id} · ${t.location} · ${t.seats} pax`;
  updateBookingSummary();
}

function updateBookingSummary() {
  const date = document.getElementById("book-date")?.value;
  const time = document.getElementById("book-time")?.value;
  const guests = document.getElementById("book-guests")?.value;
  const sumDate = document.getElementById("sum-date");
  const sumTime = document.getElementById("sum-time");
  const sumGuests = document.getElementById("sum-guests");
  
  if (date && sumDate) sumDate.textContent = new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (time && sumTime) sumTime.textContent = time;
  if (guests && sumGuests) sumGuests.textContent = guests;
  
  const bevNames = [...selectedBevs].join(", ") || "None";
  const sumBevs = document.getElementById("sum-bevs");
  if (sumBevs) sumBevs.textContent = bevNames;
}

function toggleBev(el, id) {
  el.classList.toggle("selected");
  if (selectedBevs.has(id)) selectedBevs.delete(id);
  else selectedBevs.add(id);
  updateBookingSummary();
}

function selectPay(el) {
  document.querySelectorAll(".pay-method").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
}

async function confirmBooking() {
  if (!selectedTable) {
    showToast("Please select a table first", "⚠️");
    return;
  }
  const date = document.getElementById("book-date")?.value;
  if (!date) {
    showToast("Please select a date", "⚠️");
    return;
  }
  const time = document.getElementById("book-time")?.value;
  const guests = document.getElementById("book-guests")?.value;
  const bookId = "#GBR-2026-" + Math.floor(1000 + Math.random() * 9000);
  const t = tables.find(x => x.id === selectedTable);
  
  const confId = document.getElementById("conf-id");
  const confTable = document.getElementById("conf-table");
  const confDatetime = document.getElementById("conf-datetime");
  const confGuests = document.getElementById("conf-guests");
  
  if (confId) confId.textContent = "Booking ID: " + bookId;
  if (confTable) confTable.textContent = `${selectedTable} · ${t.location}`;
  if (confDatetime) confDatetime.textContent = `${new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${time}`;
  if (confGuests) confGuests.textContent = guests;

  try {
    await apiRequest('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ table_id: selectedTable, date, time, guests: parseInt(guests, 10) })
    });
  } catch (error) {
    console.warn('Backend booking failed:', error);
  }

  sampleBookings.unshift({
    id: bookId,
    table: `${selectedTable} · ${t.location}`,
    datetime: `${new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${time}`,
    guests,
    paid: "Rs. 1,200",
    status: "confirmed"
  });
  showPage("confirmation");
}

function downloadReceipt() {
  showToast("Receipt downloading…", "📄");
}

async function loadBookings(filter = "upcoming") {
  const list = document.getElementById("bookings-list");
  if (!list) return;

  let bookings = [];

  // Try to load bookings from API if logged in
  if (currentUser) {
    try {
      const data = await apiRequest('/api/my-bookings');
      if (data && data.success && Array.isArray(data.bookings)) {
        bookings = data.bookings.map(b => {
          const d = new Date(b.booking_date);
          const dateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          const timeStr = b.booking_time.slice(0, 5);
          
          return {
            id: b.booking_number,
            realId: b.booking_id,
            table: `${b.table_number} · ${b.location}`,
            datetime: `${dateStr} · ${timeStr}`,
            guests: b.number_of_guests,
            paid: `Rs. ${Math.round(b.advance_payment)}`,
            status: b.status.toLowerCase()
          };
        });
      }
    } catch (error) {
      console.warn("Failed to fetch backend bookings, using local samples", error);
    }
  }

  // Combine with local sampleBookings without duplicating
  const mergedBookings = [...bookings];
  sampleBookings.forEach(sb => {
    if (!mergedBookings.some(mb => mb.id === sb.id)) {
      mergedBookings.push({
        id: sb.id,
        realId: null,
        table: sb.table,
        datetime: sb.datetime,
        guests: sb.guests,
        paid: sb.paid,
        status: sb.status.toLowerCase()
      });
    }
  });

  // Filter bookings
  const filtered = mergedBookings.filter(b => {
    const status = b.status.toLowerCase();
    if (filter === "upcoming") {
      return status === "upcoming" || status === "confirmed" || status === "pending";
    } else if (filter === "past") {
      return status === "past" || status === "completed";
    } else if (filter === "cancelled") {
      return status === "cancelled";
    }
    return true;
  });

  list.innerHTML = filtered.map(b => {
    const isUpcoming = b.status === "upcoming" || b.status === "confirmed" || b.status === "pending";
    const cancelBtn = isUpcoming 
      ? `<button class="btn-cancel" onclick="cancelBooking('${b.realId || ''}', '${b.id}', event)">Cancel</button>` 
      : '';
    const rateBtn = (b.status === "completed" || b.status === "past")
      ? `<button class="btn-outline" style="padding:8px 18px;font-size:12px;" onclick="showPage('review')">Rate</button>`
      : '';

    return `
      <div class="booking-card">
        <div class="booking-card-info">
          <div class="booking-card-id">${b.id}</div>
          <div class="booking-card-details">${b.datetime} · ${b.table} · ${b.guests} guests · ${b.paid} paid</div>
        </div>
        <div class="booking-card-right">
          <span class="status-badge status-${b.status}">${b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span>
          ${cancelBtn}
          ${rateBtn}
        </div>
      </div>
    `;
  }).join("");
}

async function cancelBooking(realId, displayId, event) {
  if (event) event.preventDefault();

  if (realId && realId !== "null" && realId !== "undefined") {
    try {
      const data = await apiRequest(`/api/bookings/${realId}/cancel`, {
        method: 'POST'
      });
      if (data && data.success) {
        showToast("Booking cancelled. Rs. 700 refunded.", "❌");
        // Reload current active tab
        const activeTabEl = document.querySelector(".tab-btn.active");
        let filter = "upcoming";
        if (activeTabEl) {
          if (activeTabEl.textContent.trim().toLowerCase().includes("cancelled")) filter = "cancelled";
          else if (activeTabEl.textContent.trim().toLowerCase().includes("past")) filter = "past";
        }
        loadBookings(filter);
        return;
      }
    } catch (error) {
      console.warn("Backend cancellation failed:", error);
    }
  }

  // Fallback for local samples
  const booking = sampleBookings.find(b => b.id === displayId);
  if (booking) {
    booking.status = "cancelled";
  }
  showToast("Booking cancelled. Rs. 700 refunded.", "❌");
  
  const activeTabEl = document.querySelector(".tab-btn.active");
  let filter = "upcoming";
  if (activeTabEl) {
    if (activeTabEl.textContent.trim().toLowerCase().includes("cancelled")) filter = "cancelled";
    else if (activeTabEl.textContent.trim().toLowerCase().includes("past")) filter = "past";
  }
  loadBookings(filter);
}

function filterBookings(type, el) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  loadBookings(type);
}

function renderMenuGrid(items) {
  const grid = document.getElementById("menu-full-grid");
  if (!grid) return;
  grid.innerHTML = items.map(item => `
    <div class="menu-full-card" data-cat="${item.cat}">
      <div class="menu-card-img-full">
        ${item.image ? `<img src="images/${item.image}" alt="${item.name}" style="width:100%;height:200px;object-fit:cover;">` : item.emoji}
      </div>
      <div class="menu-full-body">
        <div class="menu-full-top">
          <div class="menu-full-name">${item.name}</div>
          <div class="menu-full-price">Rs. ${item.price}</div>
        </div>
        <div class="menu-full-cat">${item.cat}</div>
        <div class="menu-full-desc">${item.desc}</div>
        <button class="btn-add" onclick="addToCart(${item.id})">+ Add to Cart</button>
      </div>
    </div>
  `).join("");
}

function filterMenu(cat, el) {
  document.querySelectorAll(".menu-filter .filter-btn").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  const filtered = cat === "all" ? menuItems : menuItems.filter(i => i.cat === cat);
  renderMenuGrid(filtered);
}

function renderOrderItems(items) {
  const container = document.getElementById("order-items");
  if (!container) return;
  container.innerHTML = items.map(item => `
    <div class="order-item" data-cat="${item.cat}">
      <div class="order-item-img">${item.emoji}</div>
      <div class="order-item-info">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-desc">${item.desc}</div>
      </div>
      <div class="order-item-price">Rs. ${item.price}</div>
      <button class="btn-add-sm" onclick="addToCart(${item.id})">+ Add</button>
    </div>
  `).join("");
}

function filterOrder(cat, el) {
  document.querySelectorAll("#order-filter .filter-btn").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  const filtered = cat === "all" ? menuItems : menuItems.filter(i => i.cat === cat);
  renderOrderItems(filtered);
}

function searchMenu(q) {
  const filtered = menuItems.filter(i => i.name.toLowerCase().includes(q.toLowerCase()) || i.desc.toLowerCase().includes(q.toLowerCase()));
  if (document.getElementById("menu-full-grid")) {
    renderMenuGrid(filtered);
  }
  if (document.getElementById("order-items")) {
    renderOrderItems(filtered);
  }
}

function addToCart(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...item, qty: 1 });
  updateCart();
  showToast(`${item.name} added to cart`, "🛒");
}

function updateCart() {
  const list = document.getElementById("cart-items-list");
  if (!list) return;
  if (cart.length === 0) {
    list.innerHTML = '<p style="font-size:14px;color:var(--muted);text-align:center;padding:32px 0;">Your cart is empty</p>';
  } else {
    list.innerHTML = cart.map(c => `
      <div class="cart-item">
        <div class="cart-item-name">${c.name} ×${c.qty}</div>
        <div class="cart-item-price">Rs. ${c.price * c.qty}</div>
      </div>
    `).join("");
  }
  const sub = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax = Math.round(sub * 0.13);
  const cartSubtotal = document.getElementById("cart-subtotal");
  const cartTax = document.getElementById("cart-tax");
  const cartTotal = document.getElementById("cart-total");
  if (cartSubtotal) cartSubtotal.textContent = "Rs. " + sub;
  if (cartTax) cartTax.textContent = "Rs. " + tax;
  if (cartTotal) cartTotal.textContent = "Rs. " + (sub + tax);
}

function setDelivery(mode, el) {
  deliveryMode = mode;
  document.querySelectorAll(".del-btn").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  const addrRow = document.getElementById("delivery-address-row");
  if (addrRow) addrRow.classList.toggle("hidden", mode !== "delivery");
}

async function placeOrder() {
  if (cart.length === 0) {
    showToast("Add items to cart first", "⚠️");
    return;
  }
  
  const address = document.getElementById("order-address")?.value || "";
  const instructions = document.getElementById("order-instructions")?.value || "";
  
  try {
    const data = await apiRequest('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: cart.map(c => ({ id: c.id, quantity: c.qty, price: c.price })),
        delivery_mode: deliveryMode,
        delivery_address: address,
        special_instructions: instructions,
        total_amount: cart.reduce((sum, c) => sum + c.price * c.qty, 0)
      })
    });
    
    if (data && data.success) {
      showToast("Order placed successfully! 🎉", "✅");
      cart = [];
      updateCart();
      // Clear inputs
      const addressInput = document.getElementById("order-address");
      const instrInput = document.getElementById("order-instructions");
      if (addressInput) addressInput.value = "";
      if (instrInput) instrInput.value = "";
    } else {
      showToast(data?.message || "Please login to place an order", "⚠️");
    }
  } catch (error) {
    console.warn('Backend order failed:', error);
    showToast("Order placed locally. Backend not connected.", "ℹ️");
    cart = [];
    updateCart();
  }
}

function setStars(container, e) {
  const stars = container.querySelectorAll(".star");
  let idx = -1;
  stars.forEach((s, i) => {
    if (e.target === s) idx = i;
  });
  if (idx < 0) {
    for (let i = 0; i < stars.length; i++) {
      if (e.clientX < stars[i].getBoundingClientRect().right) {
        idx = i;
        break;
      }
    }
  }
  container.dataset.rating = idx + 1;
  stars.forEach((s, i) => s.classList.toggle("lit", i <= idx));
}

async function submitReview() {
  const ratings = ["food", "staff", "ambience", "overall"].map(id => {
    const c = document.getElementById("stars-" + id);
    return parseInt(c?.dataset.rating || 0);
  });
  if (ratings.some(r => r === 0)) {
    showToast("Please rate all categories", "⚠️");
    return;
  }

  try {
    await apiRequest('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        ratings: { food: ratings[0], staff: ratings[1], ambience: ratings[2], overall: ratings[3] },
        comment: document.getElementById("review-text")?.value.trim() || ''
      })
    });
    showToast("Review submitted! Thank you 🙏", "✅");
  } catch (error) {
    console.warn('Backend review failed:', error);
    showToast("Review saved locally. Backend not connected.", "ℹ️");
  }
  
  setTimeout(() => showPage("my-bookings"), 1500);
}

function adminTab(id, el) {
  document.querySelectorAll(".admin-nav-item").forEach(i => i.classList.remove("active"));
  el.classList.add("active");
  document.querySelectorAll(".admin-content > div").forEach(d => d.style.display = "none");
  const target = document.getElementById("admin-" + id);
  if (target) {
    target.style.display = "block";
    if (id === "reports") drawChart();
  }
}

let chartDrawn = false;
function drawChart() {
  if (chartDrawn) return;
  chartDrawn = true;
  const canvas = document.getElementById("revenue-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth || 600;
  canvas.height = 200;
  const W = canvas.width, H = canvas.height;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = [210000, 185000, 240000, 260000, 295000, 320000, 285000, 310000, 340000, 295000, 380000, 420000];
  const max = Math.max(...data);
  const pad = { top: 20, right: 20, bottom: 36, left: 64 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  ctx.strokeStyle = "rgba(184,151,74,0.15)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = "#8a7e6e";
    ctx.font = "11px DM Sans, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Rs." + Math.round((max * i) / 4 / 1000) + "K", pad.left - 8, y + 4);
  }

  const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
  grad.addColorStop(0, "rgba(184,151,74,0.3)");
  grad.addColorStop(1, "rgba(184,151,74,0.02)");

  const pts = data.map((v, i) => ({
    x: pad.left + (i / (data.length - 1)) * chartW,
    y: pad.top + chartH - (v / max) * chartH
  }));

  ctx.beginPath();
  ctx.moveTo(pts[0].x, H - pad.bottom);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, H - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = "#b8974a";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#b8974a";
    ctx.fill();
    ctx.fillStyle = "#8a7e6e";
    ctx.font = "11px DM Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(months[i], p.x, H - pad.bottom + 16);
  });
}

function initAdminPanels() {
  const content = document.querySelector(".admin-content");
  if (!content) return;
  const panels = content.querySelectorAll(":scope > div");
  panels.forEach((p, i) => p.style.display = i === 0 ? "block" : "none");
}

/* ─── INITIALIZATION ─── */

async function init() {
  const dateInput = document.getElementById("book-date");
  if (dateInput) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    dateInput.value = d.toISOString().split("T")[0];
    dateInput.min = new Date().toISOString().split("T")[0];
  }
  
  ["book-date", "book-time", "book-guests"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateBookingSummary);
  });
  
  updateBookingSummary();
  initTables();
  await restoreUser();
  await loadMenuItems();
  await loadOffers();
  loadBookings("upcoming");
  initAdminPanels();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("load", init);
window.addEventListener('storage', (event) => {
  if (event.key === 'gokyoCurrentUser' || event.key === 'gokyoUser' || event.key === 'gokyoIsLoggedIn' || event.key === 'gokyoLoggedIn') {
    restoreUser();
  }
});