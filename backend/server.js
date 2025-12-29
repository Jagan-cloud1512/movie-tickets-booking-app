import express from "express";
import cors from "cors";
import movieRoutes from "./routes/movies.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/movies", movieRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Movie API LIVE!" });
});

export default app;
