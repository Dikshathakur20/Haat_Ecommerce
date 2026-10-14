require("dotenv").config();
const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in .env");
    process.exit(1);
  }
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected");
  } catch (err) {
    console.error("DB connection failed:", err.message || err.code || err);
    if (err.errors) err.errors.forEach((e) => console.error(" -", e.code, e.address));
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

start();
