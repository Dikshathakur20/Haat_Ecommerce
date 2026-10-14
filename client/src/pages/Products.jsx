import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";
import Pagination from "../components/Pagination.jsx";

const PRICE_RANGES = [
  { label: "Any price", min: "", max: "" },
  { label: "Under ₹500", min: "", max: "500" },
  { label: "₹500 to ₹2,000", min: "500", max: "2000" },
  { label: "Over ₹2,000", min: "2000", max: "" },
];

export default function Products() {
  // Filters live in the URL, so a filtered page can be shared and the Back button works
  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;

  const [result, setResult] = useState({ data: [], total: 0, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(params.get("search") || "");

  function update(changes, keepPage = false) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === "" || v == null || v === false) next.delete(k);
      else next.set(k, v);
    }
    if (!keepPage) next.delete("page");
    setParams(next);
  }

  useEffect(() => {
    api("/products/categories").then(setCategories).catch(() => {});
  }, []);

  // Wait 400ms after typing stops before searching (debounce)
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("search") || "") !== search.trim()) update({ search: search.trim() });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    let ignore = false; // ignore old responses if filters changed meanwhile
    setLoading(true);
    setError("");
    api(`/products?${params.toString()}`)
      .then((r) => !ignore && setResult(r))
      .catch((e) => !ignore && setError(e.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [params]);

  const activeCategory = params.get("category") || "";
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";
  const hasFilters = [...params.keys()].some((k) => k !== "page");

  return (
    <>
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Shop what is actually in stock
          </h1>
          <p className="mt-2 max-w-xl text-slate-300">Every product shows its live stock, so you never order what is gone.</p>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="mt-6 w-full max-w-xl rounded-lg border-0 bg-white px-4 py-3 text-ink placeholder:text-muted"
          />
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row">
        <aside className="card h-fit space-y-6 p-4 lg:w-64 lg:shrink-0">
          <div>
            <h2 className="mb-2 font-display font-bold">Category</h2>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              <button
                onClick={() => update({ category: "" })}
                className={`rounded-md px-3 py-1.5 text-left text-sm ${!activeCategory ? "bg-ink text-white" : "hover:bg-fog"}`}
              >
                All products
              </button>
              {categories.map((c) => (
                <button
                  key={c.category}
                  onClick={() => update({ category: c.category })}
                  className={`rounded-md px-3 py-1.5 text-left text-sm ${activeCategory === c.category ? "bg-ink text-white" : "hover:bg-fog"}`}
                >
                  {c.category} <span className="text-xs opacity-70">({c.count})</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-display font-bold">Price</h2>
            <div className="flex flex-col gap-1">
              {PRICE_RANGES.map((r) => (
                <label key={r.label} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-fog">
                  <input
                    type="radio"
                    name="price"
                    checked={minPrice === r.min && maxPrice === r.max}
                    onChange={() => update({ minPrice: r.min, maxPrice: r.max })}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={params.get("inStock") === "true"} onChange={(e) => update({ inStock: e.target.checked })} />
            Show only in-stock items
          </label>

          {hasFilters && (
            <button
              className="btn-ghost w-full"
              onClick={() => {
                setSearch("");
                setParams({});
              }}
            >
              Clear all filters
            </button>
          )}
        </aside>

        <section className="flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">{loading ? "Loading..." : `${result.total} products`}</p>
            <label className="flex items-center gap-2 text-sm">
              Sort by
              <select className="input w-auto" value={params.get("sort") || "newest"} onChange={(e) => update({ sort: e.target.value })}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="card border-danger p-4 text-danger" role="alert">
              {error}. Check that the server is running on port 5000.
            </div>
          )}

          {!error && !loading && result.data.length === 0 && (
            <div className="card p-8 text-center">
              <p className="font-display text-lg font-bold">No products match these filters</p>
              <p className="mt-1 text-sm text-muted">Try a different search or clear the filters.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.data.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          <Pagination page={page} totalPages={result.totalPages} onChange={(p) => update({ page: p }, true)} />
        </section>
      </div>
    </>
  );
}
