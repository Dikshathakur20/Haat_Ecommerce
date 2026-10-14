import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-ink text-white" : "text-ink hover:bg-fog"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
          Haat
        </Link>
        <nav className="ml-2 flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>Shop</NavLink>
          {user && <NavLink to="/orders" className={linkClass}>My orders</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin" className={linkClass}>Inventory</NavLink>}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <NavLink to="/cart" className={linkClass}>
            Cart
            {count > 0 && (
              <span className="ml-2 rounded-full bg-saffron px-2 py-0.5 text-xs font-bold text-ink">{count}</span>
            )}
          </NavLink>
          {user ? (
            <>
              <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
              <button
                className="btn-ghost"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
