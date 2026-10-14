require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function init() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("Tables are ready");
  await pool.end();
}

init().catch((err) => {
  console.error("db:init failed:", err.message || err.code || err.error?.message || err);
  console.error(err);
  process.exit(1);
});
