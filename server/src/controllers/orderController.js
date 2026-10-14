const pool = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/orders   { items: [{ productId, quantity }] }
// Everything happens in ONE transaction: either the whole order succeeds or nothing changes.
const create = asyncHandler(async (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, "Your cart is empty");

  // Merge duplicates and validate. Prices are NEVER taken from the client.
  const merged = new Map();
  for (const it of items) {
    const productId = Number(it.productId);
    const qty = Number(it.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      throw new HttpError(400, "One of the cart items is invalid");
    }
    merged.set(productId, (merged.get(productId) || 0) + qty);
  }
  // Always lock products in the same order (by id) so two orders can't deadlock each other
  const sorted = [...merged.entries()].sort((a, b) => a[0] - b[0]);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let totalPaise = 0;
    const lines = [];

    for (const [productId, qty] of sorted) {
      // Atomic stock check + decrement in a single statement: prevents overselling
      const r = await client.query(
        `UPDATE products SET stock = stock - $1, updated_at = now()
         WHERE id = $2 AND stock >= $1
         RETURNING id, name, price::float8 AS price`,
        [qty, productId]
      );
      if (r.rowCount === 0) {
        const check = await client.query("SELECT name, stock FROM products WHERE id = $1", [productId]);
        if (!check.rowCount) throw new HttpError(404, "A product in your cart no longer exists");
        const { name, stock } = check.rows[0];
        throw new HttpError(409, stock === 0 ? `${name} is out of stock` : `Only ${stock} left of ${name}`);
      }
      const p = r.rows[0];
      totalPaise += Math.round(p.price * 100) * qty;
      lines.push({ productId, name: p.name, quantity: qty, price: p.price });
    }

    const order = await client.query(
      `INSERT INTO orders (user_id, total, status) VALUES ($1, $2, 'confirmed')
       RETURNING id, total::float8 AS total, status, created_at`,
      [req.user.id, totalPaise / 100]
    );
    for (const l of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)`,
        [order.rows[0].id, l.productId, l.quantity, l.price]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ ...order.rows[0], items: lines });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

// GET /api/orders  (my orders, with items)
const mine = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT o.id, o.total::float8 AS total, o.status, o.created_at,
            COALESCE(
              json_agg(
                json_build_object('productId', oi.product_id, 'name', p.name,
                                  'quantity', oi.quantity, 'price', oi.price_at_purchase::float8)
                ORDER BY oi.id
              ) FILTER (WHERE oi.id IS NOT NULL), '[]'
            ) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

module.exports = { create, mine };
