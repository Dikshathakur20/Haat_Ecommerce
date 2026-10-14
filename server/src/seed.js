require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./config/db");

const products = [
  ["Trail Running Shoes", "Grippy outsole and breathable mesh for daily runs.", 2999, 40, "Sports"],
  ["Yoga Mat 6mm", "Non-slip mat with carry strap.", 899, 3, "Sports"],
  ["Cricket Bat (Kashmir Willow)", "Light pickup, ready to play.", 1799, 12, "Sports"],
  ["Cotton Crew T-Shirt", "Soft 180 GSM cotton, regular fit.", 599, 100, "Clothing"],
  ["Slim Fit Denim Jeans", "Stretch denim, mid rise.", 1499, 25, "Clothing"],
  ["Zip Hoodie", "Fleece lined, two pockets.", 1899, 0, "Clothing"],
  ["Steel Water Bottle 750ml", "Keeps drinks cold for 18 hours.", 399, 75, "Accessories"],
  ["Canvas Backpack 25L", "Padded laptop sleeve, water resistant.", 1299, 5, "Accessories"],
  ["Polarized Sunglasses", "UV400 protection.", 749, 30, "Accessories"],
  ["Ceramic Coffee Mug Set (4)", "Microwave and dishwasher safe.", 649, 18, "Home"],
  ["LED Desk Lamp", "Three brightness levels, USB powered.", 999, 9, "Home"],
  ["Wireless Earbuds", "24 hour battery with charging case.", 1999, 22, "Electronics"],
  ["Power Bank 10000mAh", "Fast charging, dual output.", 1199, 2, "Electronics"],
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM order_items");
    await client.query("DELETE FROM orders");
    await client.query("DELETE FROM products");

    for (const [name, description, price, stock, category] of products) {
      await client.query(
        "INSERT INTO products (name, description, price, stock, category) VALUES ($1, $2, $3, $4, $5)",
        [name, description, price, stock, category]
      );
    }

    const hash = await bcrypt.hash("Admin@12345", 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@haat.dev', $1, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [hash]
    );

    await client.query("COMMIT");
    console.log(`Seeded ${products.length} products and admin user (admin@haat.dev / Admin@12345)`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
