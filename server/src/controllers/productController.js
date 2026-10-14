const pool = require("../config/db");
const HttpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

// price is NUMERIC in Postgres (comes back as a string), so we cast it to a number
const COLUMNS = `id, name, description, price::float8 AS price, stock, category, image_url, created_at`;

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "Invalid product id");
  return id;
}

function parseProduct(body) {
  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim();
  const description = body.description ? String(body.description).trim() : null;
  const image_url = body.image_url ? String(body.image_url).trim() : null;
  const price = body.price === "" || body.price == null ? NaN : Number(body.price);
  const stock = body.stock === "" || body.stock == null ? 0 : Number(body.stock);

  if (!name) throw new HttpError(400, "Name is required");
  if (!category) throw new HttpError(400, "Category is required");
  if (!Number.isFinite(price) || price < 0) throw new HttpError(400, "Price must be 0 or more");
  if (!Number.isInteger(stock) || stock < 0) throw new HttpError(400, "Stock must be a whole number, 0 or more");
  return { name, category, description, image_url, price, stock };
}

// GET /api/products?search=&category=&minPrice=&maxPrice=&inStock=true&sort=&page=&limit=
const list = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, inStock, sort } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));

  const where = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  if (minPrice !== undefined && minPrice !== "" && !Number.isNaN(Number(minPrice))) {
    params.push(Number(minPrice));
    where.push(`price >= $${params.length}`);
  }
  if (maxPrice !== undefined && maxPrice !== "" && !Number.isNaN(Number(maxPrice))) {
    params.push(Number(maxPrice));
    where.push(`price <= $${params.length}`);
  }
  if (inStock === "true") where.push("stock > 0");

  // Never put user input directly in ORDER BY, so we map it from a fixed list
  const orderBy =
    { newest: "created_at DESC", price_asc: "price ASC", price_desc: "price DESC", name: "name ASC" }[sort] ||
    "created_at DESC";

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM products ${whereSql}`, params);
  const total = countResult.rows[0].total;

  const dataParams = [...params, limit, (page - 1) * limit];
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM products ${whereSql}
     ORDER BY ${orderBy}, id
     LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  res.json({ data: rows, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

const categories = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT category, COUNT(*)::int AS count FROM products GROUP BY category ORDER BY category"
  );
  res.json(rows);
});

const getOne = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM products WHERE id = $1`, [parseId(req.params.id)]);
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.json(rows[0]);
});

const create = asyncHandler(async (req, res) => {
  const p = parseProduct(req.body);
  const { rows } = await pool.query(
    `INSERT INTO products (name, description, price, stock, category, image_url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNS}`,
    [p.name, p.description, p.price, p.stock, p.category, p.image_url]
  );
  res.status(201).json(rows[0]);
});

const update = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const p = parseProduct(req.body);
  const { rows } = await pool.query(
    `UPDATE products SET name=$1, description=$2, price=$3, stock=$4, category=$5, image_url=$6, updated_at=now()
     WHERE id=$7 RETURNING ${COLUMNS}`,
    [p.name, p.description, p.price, p.stock, p.category, p.image_url, id]
  );
  if (!rows[0]) throw new HttpError(404, "Product not found");
  res.json(rows[0]);
});

// PATCH /api/products/:id/stock  { stock: 50 }  sets stock
//                                { delta: -3 }  changes stock safely (never below 0)
const updateStock = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const { stock, delta } = req.body;
  let result;

  if (delta !== undefined) {
    const d = Number(delta);
    if (!Number.isInteger(d)) throw new HttpError(400, "Delta must be a whole number");
    result = await pool.query(
      `UPDATE products SET stock = stock + $1, updated_at = now()
       WHERE id = $2 AND stock + $1 >= 0 RETURNING ${COLUMNS}`,
      [d, id]
    );
    if (!result.rows[0]) throw new HttpError(409, "Stock cannot go below 0, or product not found");
  } else {
    const s = Number(stock);
    if (!Number.isInteger(s) || s < 0) throw new HttpError(400, "Stock must be a whole number, 0 or more");
    result = await pool.query(
      `UPDATE products SET stock = $1, updated_at = now() WHERE id = $2 RETURNING ${COLUMNS}`,
      [s, id]
    );
    if (!result.rows[0]) throw new HttpError(404, "Product not found");
  }
  res.json(result.rows[0]);
});

const remove = asyncHandler(async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM products WHERE id = $1", [parseId(req.params.id)]);
    if (!rowCount) throw new HttpError(404, "Product not found");
    res.status(204).end();
  } catch (err) {
    // 23503 = foreign key violation (product exists in old orders)
    if (err.code === "23503") throw new HttpError(409, "This product is in past orders. Set its stock to 0 instead");
    throw err;
  }
});

module.exports = { list, categories, getOne, create, update, updateStock, remove };
