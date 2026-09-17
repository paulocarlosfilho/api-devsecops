/**
 * Middleware for unmatched routes (404).
 */
const notFound = (req, res) => {
  res.status(404).json({
    status: 'error',
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

module.exports = notFound;
