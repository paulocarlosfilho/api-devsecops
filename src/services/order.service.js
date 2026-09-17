const { transaction } = require('../config/database');
const orderRepository = require('../repositories/order.repository');
const productRepository = require('../repositories/product.repository');
const customerRepository = require('../repositories/customer.repository');
const cacheService = require('../cache/cache.service');
const { NotFoundError, BusinessError } = require('../errors');

/** Valid status transitions */
const STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

class OrderService {
  async findAll(filters) {
    const { rows, total } = await orderRepository.findAll(filters);
    return {
      data: rows,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total,
        totalPages: Math.ceil(total / (filters.limit || 20)),
      },
    };
  }

  async findById(id) {
    const cacheKey = `order:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order', id);
    }

    const items = await orderRepository.findItemsByOrderId(id);
    const result = { ...order, items };

    await cacheService.set(cacheKey, result, cacheService.getTTL('order'));
    return result;
  }

  async create(data) {
    // Validate customer exists
    const customer = await customerRepository.findById(data.customer_id);
    if (!customer) {
      throw new NotFoundError('Customer', data.customer_id);
    }

    // Validate products and calculate total
    const productDetails = [];
    for (const item of data.items) {
      const product = await productRepository.findById(item.product_id);
      if (!product) {
        throw new NotFoundError('Product', item.product_id);
      }

      if (product.stock < item.quantity) {
        throw new BusinessError(
          `Insufficient stock for product "${product.name}": requested ${item.quantity}, available ${product.stock}`
        );
      }

      productDetails.push({
        ...item,
        product_name: product.name,
        unit_price: parseFloat(product.price),
        subtotal: parseFloat(product.price) * item.quantity,
      });
    }

    const total = productDetails.reduce((sum, item) => sum + item.subtotal, 0);

    // Execute within a transaction: create order, items, and decrement stock
    const order = await transaction(async (client) => {
      const newOrder = await orderRepository.create(client, {
        customer_id: data.customer_id,
        total,
        notes: data.notes,
      });

      for (const item of productDetails) {
        await orderRepository.createItem(client, {
          order_id: newOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        });

        // Decrement stock
        const updated = await productRepository.updateStock(client, item.product_id, -item.quantity);
        if (!updated) {
          throw new BusinessError(
            `Failed to update stock for product "${item.product_name}". Insufficient stock.`
          );
        }
      }

      return newOrder;
    });

    // Invalidate product caches since stock changed
    await cacheService.invalidatePattern('products:*');
    for (const item of productDetails) {
      await cacheService.del(`product:${item.product_id}`);
    }

    // Return the complete order with items
    const items = productDetails.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }));

    return { ...order, items };
  }

  async updateStatus(id, newStatus) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order', id);
    }

    const allowedTransitions = STATUS_TRANSITIONS[order.status];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BusinessError(
        `Cannot transition order status from "${order.status}" to "${newStatus}". ` +
        `Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none'}`
      );
    }

    // If cancelling, restore stock
    if (newStatus === 'CANCELLED') {
      const items = await orderRepository.findItemsByOrderId(id);

      await transaction(async (client) => {
        await client.query(
          'UPDATE orders SET status = $1 WHERE id = $2',
          [newStatus, id]
        );

        for (const item of items) {
          await productRepository.updateStock(client, item.product_id, item.quantity);
        }
      });

      // Invalidate product caches since stock was restored
      await cacheService.invalidatePattern('products:*');
      for (const item of items) {
        await cacheService.del(`product:${item.product_id}`);
      }
    } else {
      await orderRepository.updateStatus(id, newStatus);
    }

    await cacheService.del(`order:${id}`);

    const updated = await orderRepository.findById(id);
    return updated;
  }
}

module.exports = new OrderService();
