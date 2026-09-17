const AppError = require('./app-error');

class BusinessError extends AppError {
  /**
   * @param {string} message - Description of the business rule violation
   */
  constructor(message) {
    super(message, 422, 'BUSINESS_RULE_VIOLATION');
  }
}

module.exports = BusinessError;
