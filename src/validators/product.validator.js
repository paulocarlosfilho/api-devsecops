const Joi = require('joi');

const createProduct = Joi.object({
  name: Joi.string().trim().min(2).max(255).required()
    .messages({ 'string.min': 'Product name must have at least 2 characters' }),
  description: Joi.string().trim().max(2000).allow('', null).default(''),
  price: Joi.number().positive().precision(2).required()
    .messages({ 'number.positive': 'Price must be greater than zero' }),
  stock: Joi.number().integer().min(0).required()
    .messages({ 'number.min': 'Stock cannot be negative' }),
  category_id: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Category is required' }),
  sku: Joi.string().trim().max(100).allow('', null).default(null),
});

const updateProduct = Joi.object({
  name: Joi.string().trim().min(2).max(255),
  description: Joi.string().trim().max(2000).allow('', null),
  price: Joi.number().positive().precision(2)
    .messages({ 'number.positive': 'Price must be greater than zero' }),
  stock: Joi.number().integer().min(0)
    .messages({ 'number.min': 'Stock cannot be negative' }),
  category_id: Joi.number().integer().positive(),
  sku: Joi.string().trim().max(100).allow('', null),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

const queryProducts = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(255).allow(''),
  category_id: Joi.number().integer().positive(),
  min_price: Joi.number().min(0),
  max_price: Joi.number().min(0),
  sort_by: Joi.string().valid('name', 'price', 'created_at').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc'),
});

module.exports = { createProduct, updateProduct, queryProducts };
