// Shows how much stock is left. This is the visible side of the inventory API.
export default function StockBar({ stock }) {
  if (stock === 0) return <p className="text-sm font-medium text-muted">Out of stock</p>;

  const low = stock <= 5;
  const pct = Math.max(6, Math.min(100, Math.round((stock / 50) * 100)));

  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line" role="presentation">
        <div className={`h-full rounded-full ${low ? "bg-saffron" : "bg-brand"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`mt-1 text-xs ${low ? "font-semibold text-amber-700" : "text-muted"}`}>
        {low ? `Only ${stock} left` : `${stock} in stock`}
      </p>
    </div>
  );
}
