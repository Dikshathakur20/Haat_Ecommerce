// Express 4 does not catch errors from async functions, so we forward them to the error middleware
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
