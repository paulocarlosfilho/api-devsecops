const AppError = require('./app-error');

class NotFoundError extends AppError {
  /**
   * @param {string} resource - Name of the resource (e.g., 'Product')
   * @param {string|number} identifier - ID or value used in the lookup
   */
  constructor(resource, identifier) {
    super(`${resource} not found with identifier: ${identifier}`, 404, 'NOT_FOUND');
  }
}

module.exports = NotFoundError;
