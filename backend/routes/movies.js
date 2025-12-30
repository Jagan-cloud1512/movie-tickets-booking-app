import express from "express";
import fs from "fs/promises";

const router = express.Router();

// -------- IN-MEMORY USERS (NO DB) --------
const users = [
  { email: "admin@example.com", password: "admin123", role: "admin" },
  { email: "user@example.com", password: "user123", role: "user" },
];

// -------- MOVIES (STATIC) --------
let movies = [
  {
    id: 1,
    title: "Avengers: Endgame",
    slots: [
      { id: 1, time: "7:00 PM", seats: 50, available: true },
      { id: 2, time: "10:00 PM", seats: 30, available: true },
    ],
  },
  {
    id: 2,
    title: "Oppenheimer",
    slots: [{ id: 3, time: "8:30 PM", seats: 40, available: true }],
  },
  {
    id: 3,
    title: "Spider-Man: No Way Home",
    slots: [
      { id: 4, time: "6:30 PM", seats: 45, available: true },
      { id: 5, time: "9:30 PM", seats: 35, available: true },
    ],
  },
  {
    id: 4,
    title: "Dune: Part Two",
    slots: [
      { id: 6, time: "5:45 PM", seats: 60, available: true },
      { id: 7, time: "11:00 PM", seats: 25, available: true },
    ],
  },
  {
    id: 5,
    title: "Barbie",
    slots: [
      { id: 8, time: "4:30 PM", seats: 55, available: true },
      { id: 9, time: "7:45 PM", seats: 40, available: true },
    ],
  },
  {
    id: 6,
    title: "John Wick: Chapter 4",
    slots: [{ id: 10, time: "9:00 PM", seats: 30, available: true }],
  },
  {
    id: 7,
    title: "The Super Mario Bros. Movie",
    slots: [
      { id: 11, time: "3:00 PM", seats: 70, available: true },
      { id: 12, time: "6:00 PM", seats: 50, available: true },
    ],
  },
];

// -------- PERSISTENT BOOKINGS (FILE STORAGE) --------
let bookings = [];

// LOAD BOOKINGS FROM FILE ON STARTUP
async function loadBookings() {
  try {
    const data = await fs.readFile("./bookings.json", "utf8");
    bookings = JSON.parse(data);
    console.log(`Loaded ${bookings.length} bookings`);
  } catch (error) {
    console.log("No bookings file found, starting fresh");
    bookings = [];
  }
}

// SAVE BOOKINGS TO FILE
async function saveBookings() {
  try {
    await fs.writeFile("./bookings.json", JSON.stringify(bookings, null, 2));
  } catch (error) {
    console.error("Failed to save bookings:", error);
  }
}

// INIT BOOKINGS ON STARTUP
loadBookings();

// -------- AUTH (NO DATABASE) --------
router.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.status(400).json({ error: "User already exists" });
  }

  const newUser = { email, password, role: "user" };
  users.push(newUser);

  res.json({ user: { email: newUser.email, role: newUser.role } });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({
    token: user.email,
    role: user.role,
    email: user.email,
  });
});

// -------- MOVIES / BOOKINGS --------
router.get("/", (req, res) => {
  res.json(movies);
});

router.get("/bookings", (req, res) => {
  res.json(bookings); // NOW SHOWS PERSISTENT BOOKINGS!
});

router.post("/book", async (req, res) => {
  const { slotId, seats, email } = req.body;

  const movie = movies.find((m) => m.slots.find((s) => s.id === slotId));
  const slot = movie?.slots.find((s) => s.id === slotId);

  if (slot && slot.seats >= seats && slot.available) {
    // UPDATE SEATS
    slot.seats -= seats;
    if (slot.seats <= 0) slot.available = false;

    // ADD BOOKING
    const booking = {
      id: Date.now(),
      email,
      movie: movie.title,
      slotId,
      seats,
      time: new Date().toLocaleString(),
    };
    bookings.push(booking);

    // SAVE TO FILE (PERSISTENT!)
    await saveBookings();

    res.json({
      success: true,
      message: `Booked ${seats} seats for ${movie.title}`,
    });
  } else {
    res.status(400).json({ error: "Slot unavailable or not enough seats" });
  }
});

export default router;
