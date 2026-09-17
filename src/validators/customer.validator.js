const Joi = require('joi');

/**
 * Validates a Brazilian CPF number (basic structural validation).
 * @param {string} cpf
 * @returns {boolean}
 */
const isValidCPF = (cpf) => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;

  // Reject known invalid sequences (all same digit)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10), 10)) return false;

  return true;
};

const createCustomer = Joi.object({
  name: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().trim().email().lowercase().required(),
  cpf: Joi.string().trim().required()
    .custom((value, helpers) => {
      const cleaned = value.replace(/\D/g, '');
      if (!isValidCPF(cleaned)) {
        return helpers.error('any.invalid');
      }
      return cleaned;
    })
    .messages({ 'any.invalid': 'Invalid CPF number' }),
  phone: Joi.string().trim().max(20).allow('', null).default(null),
  address: Joi.object({
    street: Joi.string().trim().max(255),
    number: Joi.string().trim().max(20),
    complement: Joi.string().trim().max(100).allow('', null),
    neighborhood: Joi.string().trim().max(100),
    city: Joi.string().trim().max(100),
    state: Joi.string().trim().length(2).uppercase(),
    zip_code: Joi.string().trim().max(10),
  }).allow(null).default(null),
});

const updateCustomer = Joi.object({
  name: Joi.string().trim().min(2).max(255),
  email: Joi.string().trim().email().lowercase(),
  phone: Joi.string().trim().max(20).allow('', null),
  address: Joi.object({
    street: Joi.string().trim().max(255),
    number: Joi.string().trim().max(20),
    complement: Joi.string().trim().max(100).allow('', null),
    neighborhood: Joi.string().trim().max(100),
    city: Joi.string().trim().max(100),
    state: Joi.string().trim().length(2).uppercase(),
    zip_code: Joi.string().trim().max(10),
  }).allow(null),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

const queryCustomers = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(255).allow(''),
});

module.exports = { createCustomer, updateCustomer, queryCustomers, isValidCPF };
