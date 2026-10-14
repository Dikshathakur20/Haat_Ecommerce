const { Pool, neonConfig, types } = require("@neondatabase/serverless");
const ws = require("ws");

// Connect over WebSocket (port 443) instead of raw TCP port 5432
neonConfig.webSocketConstructor = ws;

// BIGINT ids come back as strings by default, so parse them as numbers
types.setTypeParser(20, (value) => parseInt(value, 10));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

module.exports = pool;