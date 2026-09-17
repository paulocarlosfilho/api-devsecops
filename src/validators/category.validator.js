const Joi = require('joi');

const createCategory = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({ 'string.min': 'Category name must have at least 2 characters' }),
  description: Joi.string().trim().max(500).allow('', null).default(''),
});

const updateCategory = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow('', null),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

module.exports = { createCategory, updateCategory };
