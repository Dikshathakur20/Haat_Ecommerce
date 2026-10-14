const jwt = require("jsonwebtoken");
const HttpError = require("../utils/httpError");

function protect(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "Please log in to continue"));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role }
    next();
  } catch {
    next(new HttpError(401, "Your session expired. Please log in again"));
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") return next(new HttpError(403, "Only admins can do this"));
  next();
}

module.exports = { protect, adminOnly };
