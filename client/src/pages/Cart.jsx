import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { categoryStyle, formatINR } from "../utils/format.js";

export default function Cart() {
  const { items, subtotal, setQty, remove, clear } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  async function placeOrder() {
    if (!user) return navigate("/login", { state: { from: "/cart" } });
    setPlacing(true);
    setError("");
    try {
      const created = await api("/orders", {
        method: "POST",
        token,
        body: { items: items.map((i) => ({ productId: i.id, quantity: i.quantity })) },
      });
      clear();
      setOrder(created);
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  if (order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-extrabold">Order #{order.id} confirmed</h1>
        <p className="mt-2 text-muted">You paid {formatINR(order.total)}. Stock has been updated.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/orders" className="btn-primary">View my orders</Link>
          <Link to="/" className="btn-ghost">Keep shopping</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-extrabold">Your cart is empty</h1>
        <p className="mt-2 text-muted">Add a few products and they will show up here.</p>
        <Link to="/" className="btn-primary mt-6">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="mb-4 font-display text-3xl font-extrabold">Your cart</h1>
        <ul className="space-y-3">
          {items.map((i) => {
            const s = categoryStyle(i.category);
            return (
              <li key={i.id} className="card flex items-center gap-4 p-3">
                <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg text-3xl ${s.bg}`}>
                  {i.image_url ? <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" /> : <span aria-hidden="true">{s.emoji}</span>}
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-bold">{i.name}</h2>
                  <p className="text-sm text-muted">{formatINR(i.price)} each</p>
                  <button className="mt-1 text-sm text-danger underline" onClick={() => remove(i.id)}>Remove</button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost px-3" aria-label={`Decrease ${i.name}`} onClick={() => setQty(i.id, i.quantity - 1)} disabled={i.quantity <= 1}>-</button>
                  <span className="w-6 text-center font-semibold">{i.quantity}</span>
                  <button className="btn-ghost px-3" aria-label={`Increase ${i.name}`} onClick={() => setQty(i.id, i.quantity + 1)} disabled={i.quantity >= i.stock}>+</button>
                </div>
                <p className="w-24 text-right font-display font-bold">{formatINR(i.price * i.quantity)}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="card h-fit p-5">
        <h2 className="font-display text-lg font-bold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>Free</dd></div>
          <div className="flex justify-between border-t border-line pt-2 font-display text-lg font-bold"><dt>Total</dt><dd>{formatINR(subtotal)}</dd></div>
        </dl>
        {error && <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-danger" role="alert">{error}</p>}
        <button className="btn-primary mt-4 w-full" onClick={placeOrder} disabled={placing}>
          {placing ? "Placing order..." : user ? "Place order" : "Log in to place order"}
        </button>
      </aside>
    </div>
  );
}
