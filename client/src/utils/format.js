export const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);

export const formatDate = (d) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

// Placeholder look for products without a photo
const STYLES = {
  Sports: { emoji: "🏏", bg: "bg-teal-100" },
  Clothing: { emoji: "👕", bg: "bg-sky-100" },
  Accessories: { emoji: "🎒", bg: "bg-amber-100" },
  Home: { emoji: "🪔", bg: "bg-rose-100" },
  Electronics: { emoji: "🎧", bg: "bg-indigo-100" },
};
export const categoryStyle = (c) => STYLES[c] || { emoji: "🛍️", bg: "bg-slate-100" };
