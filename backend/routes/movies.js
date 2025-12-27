import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// -------- ALL USERS FROM DATABASE (including admin) --------
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, 'user') RETURNING email, role",
      [email, password]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      res.status(400).json({ error: "User already exists" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // ✅ ADMIN ALWAYS WORKS (no DB needed)
  if (email === "admin@example.com" && password === "admin123") {
    return res.json({
      token: "admin-token",
      role: "admin",
      email: "admin@example.com",
    });
  }

  // Users from DB (as before)
  try {
    const result = await pool.query(
      "SELECT id, email, password, role FROM users WHERE email = $1",
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
    // DB might fail, but admin still works
  }

  res.status(401).json({ error: "Invalid credentials" });
});

// -------- MOVIES (DATABASE) --------
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM movies ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

router.post("/movies", async (req, res) => {
  // Admin can add movies
  const { title } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO movies (title) VALUES ($1) RETURNING *",
      [title]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to add movie" });
  }
});

// -------- BOOKINGS (DATABASE) --------
router.get("/bookings", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM bookings ORDER BY time DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.post("/book", async (req, res) => {
  const { slotId, seats, email, movieTitle } = req.body;

  try {
    await pool.query(
      "INSERT INTO bookings (email, movie, slotId, seats) VALUES ($1, $2, $3, $4)",
      [email, movieTitle, slotId, seats]
    );
    res.json({
      success: true,
      message: `Booked ${seats} seats for ${movieTitle}`,
    });
  } catch (error) {
    res.status(500).json({ error: "Booking failed" });
  }
});

export default router;
