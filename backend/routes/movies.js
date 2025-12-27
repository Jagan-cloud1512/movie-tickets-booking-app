import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// -------- MOVIES & BOOKINGS (IN-MEMORY) --------
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

let bookings = [];

// -------- TEST DB CONNECTION --------
router.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ connected: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ connected: false, error: error.message });
  }
});

// -------- REGISTER (US TABLE) --------
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO us (email, password, role) VALUES ($1, $2, 'user') RETURNING email, role",
      [email, password]
    );
    res.json({ user: result.rows[0], message: "Registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === "23505") {
      res.status(400).json({ error: "User already exists" });
    } else if (error.code === "42P01") {
      res
        .status(500)
        .json({ error: "Table 'us' not found. Create table first." });
    } else {
      res.status(500).json({ error: `Registration failed: ${error.message}` });
    }
  }
});

// -------- LOGIN (US TABLE) --------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT id, email, password, role FROM us WHERE email = $1",
      [email]
    );

    const user = result.rows[0];
    if (user && user.password === password) {
      return res.json({
        token: user.email,
        role: user.role,
        email: user.email,
      });
    }
  } catch (error) {
    console.error("Login error:", error);
  }

  res.status(401).json({ error: "Invalid credentials" });
});

// -------- MOVIES & BOOKINGS --------
router.get("/", (req, res) => res.json(movies));
router.get("/bookings", (req, res) => res.json(bookings));

router.post("/book", (req, res) => {
  const { slotId, seats, email } = req.body;
  const movie = movies.find((m) => m.slots.find((s) => s.id === slotId));
  const slot = movie?.slots.find((s) => s.id === slotId);

  if (slot && slot.seats >= seats && slot.available) {
    slot.seats -= seats;
    if (slot.seats <= 0) slot.available = false;

    bookings.push({
      id: Date.now(),
      email,
      movie: movie.title,
      slotId,
      seats,
      time: new Date().toLocaleString(),
    });

    res.json({
      success: true,
      message: `Booked ${seats} seats for ${movie.title}`,
    });
  } else {
    res.status(400).json({ error: "Slot unavailable or not enough seats" });
  }
});

export default router;
