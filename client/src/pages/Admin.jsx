import { useEffect, useState } from "react";
import { api } from "../api.js";
import StockBar from "../components/StockBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatINR } from "../utils/format.js";

function StockRow({ product, token, onSaved }) {
  const [value, setValue] = useState(product.stock);
  const [msg, setMsg] = useState("");

  async function save() {
    setMsg("");
    try {
      const updated = await api(`/products/${product.id}/stock`, { method: "PATCH", token, body: { stock: Number(value) } });
      onSaved(updated);
      setMsg("Saved");
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <tr className="border-t border-line align-middle">
      <td className="py-3 pr-3">
        <p className="font-medium">{product.name}</p>
        <p className="text-xs text-muted">{product.category}</p>
      </td>
      <td className="py-3 pr-3">{formatINR(product.price)}</td>
      <td className="w-40 py-3 pr-3"><StockBar stock={product.stock} /></td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          <input className="input w-20" type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} aria-label={`Stock for ${product.name}`} />
          <button className="btn-ghost" onClick={save}>Save stock</button>
          {msg && <span className="text-xs text-muted">{msg}</span>}
        </div>
      </td>
    </tr>
  );
}

const EMPTY = { name: "", category: "", price: "", stock: "", description: "", image_url: "" };

export default function Admin() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  function load() {
    api("/products?limit=48&sort=name").then((r) => setProducts(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function addProduct(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/products", { method: "POST", token, body: form });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const field = (key, label, props = {}) => (
    <label className="block text-sm font-medium">
      {label}
      <input className="input mt-1" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
    </label>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold">Inventory</h1>
      {error && <p className="text-danger" role="alert">{error}</p>}

      <section className="card overflow-x-auto p-4">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted">
            <tr><th className="pb-2 font-medium">Product</th><th className="pb-2 font-medium">Price</th><th className="pb-2 font-medium">Stock level</th><th className="pb-2 font-medium">Update stock</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <StockRow key={p.id} product={p} token={token} onSaved={(u) => setProducts((list) => list.map((x) => (x.id === u.id ? u : x)))} />
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-5">
        <h2 className="font-display text-xl font-bold">Add a product</h2>
        <form onSubmit={addProduct} className="mt-4 grid gap-4 sm:grid-cols-2">
          {field("name", "Name", { required: true })}
          {field("category", "Category", { required: true })}
          {field("price", "Price (INR)", { type: "number", min: 0, step: "0.01", required: true })}
          {field("stock", "Opening stock", { type: "number", min: 0, required: true })}
          {field("image_url", "Image URL (optional)")}
          {field("description", "Description (optional)")}
          <div className="sm:col-span-2"><button className="btn-primary">Add product</button></div>
        </form>
      </section>
    </div>
  );
}
