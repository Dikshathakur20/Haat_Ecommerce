import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, formatINR } from "../utils/format.js";

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/orders", { token }).then(setOrders).catch((e) => setError(e.message));
  }, [token]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 font-display text-3xl font-extrabold">My orders</h1>
      {error && <p className="text-danger" role="alert">{error}</p>}
      {!orders && !error && <p className="text-muted">Loading...</p>}
      {orders?.length === 0 && (
        <div className="card p-8 text-center">
          <p className="font-display text-lg font-bold">No orders yet</p>
          <Link to="/" className="btn-primary mt-4">Browse products</Link>
        </div>
      )}
      <ul className="space-y-4">
        {orders?.map((o) => (
          <li key={o.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-bold">Order #{o.id}</h2>
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-brand-dark">{o.status}</span>
            </div>
            <p className="text-sm text-muted">{formatDate(o.created_at)}</p>
            <ul className="mt-3 divide-y divide-line text-sm">
              {o.items.map((it) => (
                <li key={it.productId} className="flex justify-between py-1.5">
                  <span>{it.name} x {it.quantity}</span>
                  <span>{formatINR(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-right font-display text-lg font-bold">Total {formatINR(o.total)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
