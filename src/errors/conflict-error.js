const AppError = require('./app-error');

class ConflictError extends AppError {
  /**
   * @param {string} message - Description of the conflict
   */
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = ConflictError;
