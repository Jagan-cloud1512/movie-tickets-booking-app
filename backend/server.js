import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import movieRoutes from "./routes/movies.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/movies", movieRoutes);

// SERVE FRONTEND
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

export default app;
