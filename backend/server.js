import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import movieRoutes from "./routes/movies.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// API routes
app.use("/api/movies", movieRoutes);

// test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API working" });
});

export default app;
