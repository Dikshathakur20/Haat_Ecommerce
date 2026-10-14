import { useCart } from "../context/CartContext.jsx";
import { categoryStyle, formatINR } from "../utils/format.js";
import StockBar from "./StockBar.jsx";

export default function ProductCard({ product }) {
  const { items, add } = useCart();
  const inCart = items.find((i) => i.id === product.id)?.quantity || 0;
  const soldOut = product.stock === 0;
  const atLimit = inCart >= product.stock;
  const style = categoryStyle(product.category);

  return (
    <article className="card flex flex-col overflow-hidden">
      <div className={`flex aspect-square items-center justify-center ${style.bg}`}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="text-6xl" aria-hidden="true">{style.emoji}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="text-xs text-muted">{product.category}</p>
          <h3 className="font-display text-lg font-bold leading-snug">{product.name}</h3>
        </div>
        {product.description && <p className="line-clamp-2 text-sm text-muted">{product.description}</p>}

        <StockBar stock={product.stock} />

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-display text-xl font-bold">{formatINR(product.price)}</span>
          <button className="btn-primary" disabled={soldOut || atLimit} onClick={() => add(product)}>
            {soldOut ? "Sold out" : atLimit ? "Max in cart" : "Add to cart"}
          </button>
        </div>
        {inCart > 0 && <p className="text-xs font-medium text-brand">{inCart} in your cart</p>}
      </div>
    </article>
  );
}
