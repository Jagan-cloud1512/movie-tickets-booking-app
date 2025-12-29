import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import movieRoutes from "./routes/movies.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/movies", movieRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Movie API working!" });
});

export default app; // ← VERCEL REQUIRES THIS
