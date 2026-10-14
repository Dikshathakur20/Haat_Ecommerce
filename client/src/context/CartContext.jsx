import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const CartContext = createContext(null);
const KEY = "haat_cart";

function reducer(items, action) {
  switch (action.type) {
    case "add": {
      const p = action.product;
      const existing = items.find((i) => i.id === p.id);
      if (existing) {
        return items.map((i) =>
          i.id === p.id ? { ...i, stock: p.stock, quantity: Math.min(i.quantity + 1, p.stock) } : i
        );
      }
      return [...items, { id: p.id, name: p.name, price: p.price, stock: p.stock, category: p.category, image_url: p.image_url, quantity: 1 }];
    }
    case "setQty":
      return items.map((i) => (i.id === action.id ? { ...i, quantity: Math.max(1, Math.min(action.quantity, i.stock)) } : i));
    case "remove":
      return items.filter((i) => i.id !== action.id);
    case "clear":
      return [];
    default:
      return items;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, [], () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      add: (product) => dispatch({ type: "add", product }),
      setQty: (id, quantity) => dispatch({ type: "setQty", id, quantity }),
      remove: (id) => dispatch({ type: "remove", id }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
