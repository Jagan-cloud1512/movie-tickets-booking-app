import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(); // Load your .env file

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export { pool };
