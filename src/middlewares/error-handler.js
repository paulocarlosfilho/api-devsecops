const logger = require('../config/logger');
const { AppError } = require('../errors');

/**
 * Global error handling middleware.
 * Catches all errors, formats the response, and logs appropriately.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Joi validation errors
  if (err.isJoi) {
    const details = err.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message,
    }));

    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
    });
  }

  // Operational errors (our custom AppError subclasses)
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`Operational error: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
    });

    return res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
    });
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      status: 'error',
      code: 'CONFLICT',
      message: 'A resource with this value already exists',
    });
  }

  // Unexpected errors
  logger.error('Unexpected error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
};

module.exports = errorHandler;
