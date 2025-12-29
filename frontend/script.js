let currentUser = null;
// point directly to backend deployment
const API_BASE = "https://movie-backend-2.vercel.app/api/movies";

// ---------- AUTH MODAL ----------

function showRegister() {
  document.getElementById("signupModal").style.display = "flex";
}
function hideRegister() {
  document.getElementById("signupModal").style.display = "none";
}

// ---------- LOGIN ----------

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) return alert("Enter email and password");

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Invalid credentials");

    currentUser = data; // { email, role, token }
    localStorage.setItem("user", JSON.stringify(data));

    if (currentUser.role === "admin") {
      showAdminPage();
    } else {
      showUserPage();
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Is backend running?");
  }
}

// ---------- REGISTER ----------

async function register() {
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  if (!email || !password) return alert("Enter email and password");

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Unable to register");

    alert("Account created! You can login now.");
    hideRegister();
  } catch (err) {
    console.error(err);
    alert("Server error while registering.");
  }
}

// ---------- COMMON HELPERS ----------

function hideLoginUI() {
  document.querySelector(".login-container").style.display = "none";
  document.getElementById("signupModal").style.display = "none";
  document.body.classList.add("app-mode");
}

function logout() {
  localStorage.removeItem("user");
  currentUser = null;
  document.body.classList.remove("app-mode");
  window.location.reload();
}

// ---------- USER PAGE (BOOKING ONLY) ----------

function showUserPage() {
  hideLoginUI();

  const userPage = document.getElementById("userPage");
  const adminPage = document.getElementById("adminPage");
  adminPage.style.display = "none";

  userPage.style.display = "block";
  userPage.innerHTML = `
    <div class="dashboard">
      <div class="dash-header">
        <div class="dash-title">
          <div class="dash-title-icon">🎟</div>
          <div>
            <h2>Movie Booking</h2>
            <div class="user-chip">${currentUser.email} · user</div>
          </div>
        </div>
        <button class="btn outline small" onclick="logout()">Logout</button>
      </div>

      <div class="dash-body">
        <div class="dash-left">
          <p class="dash-section-title">Choose your movie and showtime</p>
          <div id="userMoviesList" class="movie-list"></div>

          <div id="userBookingForm" class="booking-panel" style="display:none;">
            <h4>Book tickets</h4>
            <div style="margin-top:6px;">
              <label>Selected slot</label>
              <select id="userSlotSelect" class="input"></select>
            </div>
            <div style="margin-top:6px;">
              <label>Seats</label>
              <input id="userSeatsInput" class="input" type="number" min="1" max="10" value="1" />
            </div>
            <button class="btn primary" style="margin-top:10px;" onclick="userConfirmBooking()">
              Confirm booking
            </button>
          </div>
        </div>

        <!-- no right panel for user (cannot see who booked) -->
      </div>
    </div>
  `;

  loadMoviesForUser();
}

async function loadMoviesForUser() {
  try {
    const res = await fetch(API_BASE);
    const movies = await res.json();

    const container = document.getElementById("userMoviesList");
    container.innerHTML = movies
      .map(
        (m) => `
      <div class="movie-card">
        <div class="movie-card-header">
          <h4>${m.title}</h4>
          <span class="movie-tag">Now showing</span>
        </div>
        ${m.slots
          .map(
            (s) => `
          <div class="slot-row">
            <span>${s.time} · ${s.seats} seats left</span>
            <button class="btn small"
              ${s.available ? `onclick="userSelectSlot(${s.id})"` : "disabled"}>
              ${s.available ? "Book" : "Full"}
            </button>
          </div>
        `
          )
          .join("")}
      </div>
    `
      )
      .join("");
  } catch (err) {
    console.error(err);
    alert("Unable to load movies");
  }
}

function userSelectSlot(slotId) {
  const select = document.getElementById("userSlotSelect");
  select.innerHTML = `<option value="${slotId}">Slot ${slotId}</option>`;
  document.getElementById("userBookingForm").style.display = "block";
}

async function userConfirmBooking() {
  if (!currentUser) return alert("Please login again");

  const slotId = parseInt(document.getElementById("userSlotSelect").value, 10);
  const seats = parseInt(document.getElementById("userSeatsInput").value, 10);
  if (!slotId || !seats || seats < 1) {
    return alert("Select a slot and valid seats");
  }

  try {
    const res = await fetch(`${API_BASE}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId,
        seats,
        email: currentUser.email,
      }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Booking failed");

    alert(data.message);
    document.getElementById("userBookingForm").style.display = "none";
    await loadMoviesForUser();
  } catch (err) {
    console.error(err);
    alert("Server error while booking");
  }
}

// ---------- ADMIN PAGE (SEE WHO BOOKED WHAT) ----------

function showAdminPage() {
  hideLoginUI();

  const userPage = document.getElementById("userPage");
  const adminPage = document.getElementById("adminPage");
  userPage.style.display = "none";

  adminPage.style.display = "block";
  adminPage.innerHTML = `
    <div class="dashboard">
      <div class="dash-header">
        <div class="dash-title">
          <div class="dash-title-icon">🛠</div>
          <div>
            <h2>Admin Panel</h2>
            <div class="user-chip">${currentUser.email} · admin</div>
          </div>
        </div>
        <button class="btn outline small" onclick="logout()">Logout</button>
      </div>

      <div class="dash-body">
        <div class="dash-left">
          <div class="side-card">
            <h3>All bookings</h3>
            <div id="adminBookingsList"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  loadBookingsForAdmin();
}

async function loadBookingsForAdmin() {
  try {
    const res = await fetch(`${API_BASE}/bookings`);
    const all = await res.json();

    const container = document.getElementById("adminBookingsList");
    if (!all.length) {
      container.innerHTML = "<p>No bookings yet.</p>";
      return;
    }

    container.innerHTML = all
      .map(
        (b) => `
        <div class="booking-row">
          <strong>${b.movie}</strong> — ${b.seats} seats — Slot ${b.slotId}<br/>
          <span class="booking-meta">
            ${b.email} · ${b.time}
          </span>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error(err);
    alert("Unable to load bookings");
  }
}

// ---------- AUTO-LOGIN ON REFRESH ----------

window.addEventListener("load", () => {
  const saved = localStorage.getItem("user");
  if (!saved) return;
  currentUser = JSON.parse(saved);

  if (currentUser.role === "admin") {
    showAdminPage();
  } else {
    showUserPage();
  }
});
