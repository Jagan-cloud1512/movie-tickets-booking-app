import express from "express";
import fs from "fs/promises";
import path from "path";

const router = express.Router();

// ... your existing users + movies code ...

let bookings = [];

// LOAD BOOKINGS ON STARTUP
async function loadBookings() {
  try {
    const data = await fs.readFile("bookings.json", "utf8");
    bookings = JSON.parse(data);
  } catch {
    bookings = []; // file doesn't exist yet
  }
}

// SAVE BOOKINGS
async function saveBookings() {
  await fs.writeFile("bookings.json", JSON.stringify(bookings, null, 2));
}

// INIT ON START
loadBookings();

// ... your existing routes ...

router.get("/bookings", async (req, res) => {
  res.json(bookings); // NOW PERSISTENT!
});

router.post("/book", async (req, res) => {
  const { slotId, seats, email } = req.body;

  const movie = movies.find((m) => m.slots.find((s) => s.id === slotId));
  const slot = movie?.slots.find((s) => s.id === slotId);

  if (slot && slot.seats >= seats && slot.available) {
    slot.seats -= seats;
    if (slot.seats <= 0) slot.available = false;

    // ADD BOOKING + SAVE
    bookings.push({
      id: Date.now(),
      email,
      movie: movie.title,
      slotId,
      seats,
      time: new Date().toLocaleString(),
    });
    await saveBookings(); // ← THIS SAVES!

    res.json({
      success: true,
      message: `Booked ${seats} seats for ${movie.title}`,
    });
  } else {
    res.status(400).json({ error: "Slot unavailable or not enough seats" });
  }
});

export default router;
