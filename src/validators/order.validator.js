const Joi = require('joi');

const orderItem = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required()
    .messages({ 'number.min': 'Quantity must be at least 1' }),
});

const createOrder = Joi.object({
  customer_id: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Customer is required' }),
  items: Joi.array().items(orderItem).min(1).required()
    .messages({ 'array.min': 'Order must have at least one item' }),
  notes: Joi.string().trim().max(500).allow('', null).default(null),
});

const updateOrderStatus = Joi.object({
  status: Joi.string()
    .valid('CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')
    .required()
    .messages({
      'any.only': 'Status must be one of: CONFIRMED, SHIPPED, DELIVERED, CANCELLED',
    }),
});

const queryOrders = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
  customer_id: Joi.number().integer().positive(),
});

module.exports = { createOrder, updateOrderStatus, queryOrders };
