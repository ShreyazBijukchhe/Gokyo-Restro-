
      /* ─── STATE ─── */
      let currentUser = JSON.parse(localStorage.getItem('gokyoCurrentUser')) || null;
      let selectedTable = null;
      let selectedBevs = new Set();
      let cart = [];
      let deliveryMode = "dine-in";
      let afterLoginPage = localStorage.getItem('gokyoAfterLoginPage') || null;

      const menuItems = [
        {
          id: 1,
          name: "Thukpa Noodles",
          cat: "mains",
          price: 350,
          desc: "Tibetan-style broth noodles with tender vegetables.",
          emoji: "🍜",
          image: "thukpa.png",
        },
        {
          id: 2,
          name: "Garden Salad",
          cat: "starters",
          price: 280,
          desc: "Crisp seasonal greens with lemon-herb dressing.",
          emoji: "🥗",
          image: "Garden Salad.png",
        },
        {
          id: 3,
          name: "Grilled Chicken",
          cat: "mains",
          price: 580,
          desc: "Free-range chicken marinated in Himalayan herbs.",
          emoji: "🍗",
          image: "Grilled Chicken.png",
        },
        {
          id: 4,
          name: "Masala Tea",
          cat: "drinks",
          price: 120,
          desc: "Traditional Nepali-spiced milk tea.",
          emoji: "☕",
          image: "masala tea.png",
        },
        {
          id: 5,
          name: "Fresh Juice",
          cat: "drinks",
          price: 180,
          desc: "Cold-pressed seasonal fruit juice.",
          emoji: "🍊",
          image: "orange juice.png",
        },
        {
          id: 6,
          name: "Cappuccino",
          cat: "drinks",
          price: 200,
          desc: "Italian roast, perfectly balanced.",
          emoji: "☕",
          image: "cappechino.png",
        },
        {
          id: 7,
          name: "Momo (Steamed)",
          cat: "starters",
          price: 220,
          desc: "Hand-crafted dumplings with achar dipping sauce.",
          emoji: "🥟",
          image: "momo.png",
        },
        {
          id: 8,
          name: "Dal Bhat Thali",
          cat: "mains",
          price: 450,
          desc: "Nepali staple — rice, lentils, curry, and greens.",
          emoji: "🍱",
          image: "dalbhat.png",
        },
        {
          id: 9,
          name: "House Red Wine",
          cat: "premium",
          price: 950,
          desc: "Smooth, full-bodied red for premium members.",
          emoji: "🍷",
          image: "wine.png",
        },
      ];

      const tables = [
        { id: "T1", seats: 2, location: "Indoor", occupied: false },
        { id: "T2", seats: 4, location: "Indoor", occupied: true },
        { id: "T3", seats: 2, location: "Indoor", occupied: false },
        { id: "T4", seats: 6, location: "Outdoor", occupied: false },
        { id: "T5", seats: 4, location: "Outdoor", occupied: true },
        { id: "T6", seats: 2, location: "Private", occupied: false },
        { id: "T7", seats: 4, location: "Outdoor", occupied: false },
        { id: "T8", seats: 6, location: "Outdoor", occupied: true },
      ];

      const sampleBookings = [
        {
          id: "#GBR-2026-0142",
          table: "T3 · Indoor",
          datetime: "Jan 20, 2026 · 7:00 PM",
          guests: 2,
          paid: "Rs. 1,200",
          status: "confirmed",
        },
        {
          id: "#GBR-2026-0130",
          table: "T7 · Outdoor",
          datetime: "Jan 25, 2026 · 1:00 PM",
          guests: 4,
          paid: "Rs. 1,200",
          status: "upcoming",
        },
      ];

      /* ─── NAVIGATION ─── */
      function showPage(id) {
        document
          .querySelectorAll(".page")
          .forEach((p) => p.classList.remove("active"));
        const pg = document.getElementById(id);
        if (pg) {
          pg.classList.add("active");
          window.scrollTo(0, 0);
        }
      }

      function requireAuth(target) {
        if (!currentUser) {
          afterLoginPage = target;
          localStorage.setItem('gokyoAfterLoginPage', afterLoginPage);
          showToast("Please sign in to continue", "🔐");
          window.location.href = 'login.html';
        } else {
          window.location.href = target;
        }
      }

      /* ─── AUTH ─── */
      function saveCurrentUser() {
        if (currentUser) {
          localStorage.setItem('gokyoCurrentUser', JSON.stringify(currentUser));
        }
      }

      function clearCurrentUser() {
        localStorage.removeItem('gokyoCurrentUser');
      }

      function clearAfterLoginPage() {
        localStorage.removeItem('gokyoAfterLoginPage');
      }

      function restoreUser() {
        if (currentUser) {
          const initials =
            currentUser.initials ||
            (currentUser.name || '')
              .split(' ')
              .map((w) => w[0] || '')
              .join('')
              .slice(0, 2)
              .toUpperCase();
          currentUser.initials = initials;
          setNavUser(initials);
        }
      }

      function doLogin() {
        const email = document.getElementById("login-email").value;
        const pass = document.getElementById("login-password").value;
        if (!email || !pass) {
          showToast("Please fill all fields", "⚠️");
          return;
        }
        // Admin shortcut
        if (email === "admin@gokyo.com") {
          currentUser = { name: "Admin", email, role: "admin", initials: "A" };
          saveCurrentUser();
          setNavUser("A");
          showToast("Welcome, Admin!", "👋");
          window.location.href = 'admin.html';
          return;
        }
        const username = email.split("@")[0] || 'Member';
        currentUser = {
          name: username,
          email,
          role: "member",
          initials: username.slice(0, 2).toUpperCase(),
        };
        saveCurrentUser();
        setNavUser(currentUser.initials);
        showToast("Welcome back, " + currentUser.name + "!", "✅");
        const target = afterLoginPage || localStorage.getItem('gokyoAfterLoginPage') || 'home.html';
        clearAfterLoginPage();
        window.location.href = target;
      }

      function doGuestLogin() {
        currentUser = { name: "Guest", email: "guest", role: "visitor", initials: "G" };
        saveCurrentUser();
        setNavUser("G");
        showToast("Browsing as Guest", "ℹ️");
        const target = afterLoginPage || localStorage.getItem('gokyoAfterLoginPage') || 'home.html';
        clearAfterLoginPage();
        window.location.href = target;
      }

      function doRegister() {
        const name = document.getElementById("reg-name").value;
        const email = document.getElementById("reg-email").value;
        if (!name || !email) {
          showToast("Please fill all fields", "⚠️");
          return;
        }
        const initials = name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        currentUser = {
          name,
          email,
          role: document.getElementById("reg-type").value,
          initials,
        };
        saveCurrentUser();
        setNavUser(initials);
        showToast("Account created! Welcome, " + name + "!", "🎉");
        const target = afterLoginPage || localStorage.getItem('gokyoAfterLoginPage') || 'home.html';
        clearAfterLoginPage();
        window.location.href = target;
      }

      function setNavUser(initials) {
        const authButtons = document.getElementById("nav-auth-btns");
        if (authButtons) authButtons.style.display = "none";
        const info = document.getElementById("nav-user-info");
        if (info) info.style.display = "flex";
        const avatar = document.getElementById("user-avatar");
        if (avatar) avatar.textContent = initials;
      }

      function logout() {
        currentUser = null;
        clearCurrentUser();
        const authButtons = document.getElementById("nav-auth-btns");
        if (authButtons) authButtons.style.display = "flex";
        const info = document.getElementById("nav-user-info");
        if (info) info.style.display = "none";
        showToast("Signed out successfully", "ℹ️");
        window.location.href = 'home.html';
      }

      /* ─── TABLES ─── */
      function initTables() {
        const grid = document.getElementById("table-grid");
        if (!grid) return;
        grid.innerHTML = tables
          .map(
            (t) => `
    <div class="table-btn ${t.occupied ? "occupied" : "available"}"
         onclick="${t.occupied ? "" : `selectTable('${t.id}',this)`}">
      <span class="t-id">${t.id}</span>
      <span class="t-seats">${t.seats} pax · ${t.location}</span>
    </div>
  `,
          )
          .join("");
      }

      function selectTable(id, el) {
        selectedTable = id;
        document
          .querySelectorAll(".table-btn")
          .forEach((b) => b.classList.remove("selected"));
        el.classList.add("selected");
        const t = tables.find((x) => x.id === id);
        document.getElementById("sum-table").textContent =
          `${id} · ${t.location} · ${t.seats} pax`;
        updateBookingSummary();
      }

      function updateBookingSummary() {
        const date = document.getElementById("book-date")?.value;
        const time = document.getElementById("book-time")?.value;
        const guests = document.getElementById("book-guests")?.value;
        if (date)
          document.getElementById("sum-date").textContent = new Date(
            date,
          ).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        if (time) document.getElementById("sum-time").textContent = time;
        if (guests) document.getElementById("sum-guests").textContent = guests;
        const bevNames = [...selectedBevs].join(", ") || "None";
        document.getElementById("sum-bevs").textContent = bevNames;
      }

      /* ─── BEVERAGES ─── */
      function toggleBev(el, id) {
        el.classList.toggle("selected");
        if (selectedBevs.has(id)) selectedBevs.delete(id);
        else selectedBevs.add(id);
        updateBookingSummary();
      }

      /* ─── PAYMENT ─── */
      function selectPay(el) {
        document
          .querySelectorAll(".pay-method")
          .forEach((b) => b.classList.remove("active"));
        el.classList.add("active");
      }

      /* ─── CONFIRM BOOKING ─── */
      function confirmBooking() {
        if (!selectedTable) {
          showToast("Please select a table first", "⚠️");
          return;
        }
        const date = document.getElementById("book-date").value;
        if (!date) {
          showToast("Please select a date", "⚠️");
          return;
        }
        const time = document.getElementById("book-time").value;
        const guests = document.getElementById("book-guests").value;
        const bookId = "#GBR-2026-" + Math.floor(1000 + Math.random() * 9000);
        const t = tables.find((x) => x.id === selectedTable);
        document.getElementById("conf-id").textContent =
          "Booking ID: " + bookId;
        document.getElementById("conf-table").textContent =
          `${selectedTable} · ${t.location}`;
        document.getElementById("conf-datetime").textContent =
          `${new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${time}`;
        document.getElementById("conf-guests").textContent = guests;
        sampleBookings.unshift({
          id: bookId,
          table: `${selectedTable} · ${t.location}`,
          datetime: `${new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${time}`,
          guests,
          paid: "Rs. 1,200",
          status: "confirmed",
        });
        showPage("confirmation");
        showToast("Booking confirmed! 🎉", "✅");
      }

      function downloadReceipt() {
        showToast("Receipt downloading…", "📄");
      }

      /* ─── MY BOOKINGS ─── */
      function loadBookings(filter = "upcoming") {
        const list = document.getElementById("bookings-list");
        if (!list) return;
        const filtered = sampleBookings.filter(
          (b) =>
            b.status === (filter === "upcoming" ? "upcoming" : "confirmed") ||
            b.status === filter,
        );
        if (filtered.length === 0 && filter === "upcoming") {
          list.innerHTML = sampleBookings.map(bookingCard).join("");
        } else {
          const shown = filtered.length ? filtered : sampleBookings;
          list.innerHTML = shown.map(bookingCard).join("");
        }
      }

      function bookingCard(b) {
        return `<div class="booking-card">
    <div class="booking-card-info">
      <div class="booking-card-id">${b.id}</div>
      <div class="booking-card-details">${b.datetime} · ${b.table} · ${b.guests} guests · ${b.paid} paid</div>
    </div>
    <div class="booking-card-right">
      <span class="status-badge status-${b.status}">${b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span>
      <button class="btn-cancel" onclick="showToast('Booking cancelled. Rs. 700 refunded.','❌')">Cancel</button>
      <button class="btn-outline" style="padding:8px 18px;font-size:12px;" onclick="showPage('review')">Rate</button>
    </div>
  </div>`;
      }

      function filterBookings(type, el) {
        document
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.remove("active"));
        el.classList.add("active");
        loadBookings(type);
      }

      /* ─── MENU PAGE ─── */
      function renderMenuGrid(items) {
        const grid = document.getElementById("menu-full-grid");
        if (!grid) return;
        grid.innerHTML = items
          .map(
            (item) => `
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
  `,
          )
          .join("");
      }

      function filterMenu(cat, el) {
        document
          .querySelectorAll(".menu-page .filter-btn")
          .forEach((b) => b.classList.remove("active"));
        el.classList.add("active");
        const filtered =
          cat === "all" ? menuItems : menuItems.filter((i) => i.cat === cat);
        renderMenuGrid(filtered);
      }

      /* ─── ORDER PAGE ─── */
      function renderOrderItems(items) {
        const container = document.getElementById("order-items");
        if (!container) return;
        container.innerHTML = items
          .map(
            (item) => `
    <div class="order-item" data-cat="${item.cat}">
      <div class="order-item-img">${item.emoji}</div>
      <div class="order-item-info">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-desc">${item.desc}</div>
      </div>
      <div class="order-item-price">Rs. ${item.price}</div>
      <button class="btn-add-sm" onclick="addToCart(${item.id})">+ Add</button>
    </div>
  `,
          )
          .join("");
      }

      function filterOrder(cat, el) {
        document
          .querySelectorAll("#order-filter .filter-btn")
          .forEach((b) => b.classList.remove("active"));
        el.classList.add("active");
        const filtered =
          cat === "all" ? menuItems : menuItems.filter((i) => i.cat === cat);
        renderOrderItems(filtered);
      }

      function searchMenu(q) {
        const filtered = menuItems.filter(
          (i) =>
            i.name.toLowerCase().includes(q.toLowerCase()) ||
            i.desc.toLowerCase().includes(q.toLowerCase()),
        );
        renderOrderItems(filtered);
      }

      function addToCart(id) {
        const item = menuItems.find((i) => i.id === id);
        if (!item) return;
        const existing = cart.find((c) => c.id === id);
        if (existing) existing.qty++;
        else cart.push({ ...item, qty: 1 });
        updateCart();
        showToast(`${item.name} added to cart`, "🛒");
      }

      function updateCart() {
        const list = document.getElementById("cart-items-list");
        if (!list) return;
        if (cart.length === 0) {
          list.innerHTML =
            '<p style="font-size:14px;color:var(--muted);text-align:center;padding:32px 0;">Your cart is empty</p>';
        } else {
          list.innerHTML = cart
            .map(
              (c) => `
      <div class="cart-item">
        <div class="cart-item-name">${c.name} ×${c.qty}</div>
        <div class="cart-item-price">Rs. ${c.price * c.qty}</div>
      </div>
    `,
            )
            .join("");
        }
        const sub = cart.reduce((s, c) => s + c.price * c.qty, 0);
        const tax = Math.round(sub * 0.13);
        document.getElementById("cart-subtotal").textContent = "Rs. " + sub;
        document.getElementById("cart-tax").textContent = "Rs. " + tax;
        document.getElementById("cart-total").textContent =
          "Rs. " + (sub + tax);
      }

      function setDelivery(mode, el) {
        deliveryMode = mode;
        document
          .querySelectorAll(".del-btn")
          .forEach((b) => b.classList.remove("active"));
        el.classList.add("active");
        const addrRow = document.getElementById("delivery-address-row");
        addrRow.classList.toggle("hidden", mode !== "delivery");
      }

      function placeOrder() {
        if (cart.length === 0) {
          showToast("Add items to cart first", "⚠️");
          return;
        }
        showToast("Order placed successfully! 🎉", "✅");
        cart = [];
        updateCart();
      }

      /* ─── STARS ─── */
      function setStars(container, e) {
        const stars = container.querySelectorAll(".star");
        const rect = container.getBoundingClientRect();
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

      function submitReview() {
        const ratings = ["food", "staff", "ambience", "overall"].map((id) => {
          const c = document.getElementById("stars-" + id);
          return parseInt(c?.dataset.rating || 0);
        });
        if (ratings.some((r) => r === 0)) {
          showToast("Please rate all categories", "⚠️");
          return;
        }
        showToast("Review submitted! Thank you 🙏", "✅");
        setTimeout(() => showPage("my-bookings"), 1500);
      }

      /* ─── ADMIN TABS ─── */
      function adminTab(id, el) {
        document
          .querySelectorAll(".admin-nav-item")
          .forEach((i) => i.classList.remove("active"));
        el.classList.add("active");
        document.querySelectorAll(".admin-content > div").forEach((d) => {
          d.style.display = "none";
        });
        const target = document.getElementById("admin-" + id);
        if (target) {
          target.style.display = "block";
          if (id === "reports") drawChart();
        }
      }

      /* ─── REVENUE CHART ─── */
      let chartDrawn = false;
      function drawChart() {
        if (chartDrawn) return;
        chartDrawn = true;
        const canvas = document.getElementById("revenue-chart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.offsetWidth || 600;
        canvas.height = 200;
        const W = canvas.width,
          H = canvas.height;
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const data = [
          210000, 185000, 240000, 260000, 295000, 320000, 285000, 310000,
          340000, 295000, 380000, 420000,
        ];
        const max = Math.max(...data);
        const pad = { top: 20, right: 20, bottom: 36, left: 64 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;

        // Grid lines
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
          ctx.fillText(
            "Rs." + Math.round((max * i) / 4 / 1000) + "K",
            pad.left - 8,
            y + 4,
          );
        }

        // Gradient fill
        const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
        grad.addColorStop(0, "rgba(184,151,74,0.3)");
        grad.addColorStop(1, "rgba(184,151,74,0.02)");

        const pts = data.map((v, i) => ({
          x: pad.left + (i / (data.length - 1)) * chartW,
          y: pad.top + chartH - (v / max) * chartH,
        }));

        // Fill area
        ctx.beginPath();
        ctx.moveTo(pts[0].x, H - pad.bottom);
        pts.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(pts[pts.length - 1].x, H - pad.bottom);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Line
        ctx.beginPath();
        pts.forEach((p, i) =>
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
        );
        ctx.strokeStyle = "#b8974a";
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.stroke();

        // Dots + labels
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

      /* ─── INIT ADMIN PANELS ─── */
      function initAdminPanels() {
        const content = document.querySelector(".admin-content");
        if (!content) return;
        const panels = content.querySelectorAll(":scope > div");
        panels.forEach((p, i) => {
          p.style.display = i === 0 ? "block" : "none";
        });
      }
      function showToast(msg, icon = "✅") {
        const t = document.getElementById("toast");
        document.getElementById("toast-text").textContent = msg;
        document.getElementById("toast-icon").textContent = icon;
        t.classList.add("show");
        setTimeout(() => t.classList.remove("show"), 3500);
      }

      /* ─── INIT ─── */
      function init() {
        // Set default date
        const dateInput = document.getElementById("book-date");
        if (dateInput) {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          dateInput.value = d.toISOString().split("T")[0];
          dateInput.min = new Date().toISOString().split("T")[0];
        }
        // Wire summary updates
        ["book-date", "book-time", "book-guests"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.addEventListener("change", updateBookingSummary);
        });
        updateBookingSummary();
        initTables();
        renderMenuGrid(menuItems);
        renderOrderItems(menuItems);
        loadBookings("upcoming");
        initAdminPanels();
        restoreUser();
      }

      // Admin nav link
      document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "a" && currentUser?.role === "admin")
          showPage("admin");
      });

      document.addEventListener("DOMContentLoaded", init);
    