const { query } = require('../config/database');

class OrderRepository {
  async findAll({ page = 1, limit = 20, status, customer_id }) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`o.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (customer_id) {
      conditions.push(`o.customer_id = $${paramIndex}`);
      values.push(customer_id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM orders o ${whereClause}`,
      values
    );

    const dataResult = await query(
      `SELECT o.*, c.name as customer_name, c.email as customer_email
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      rows: dataResult.rows,
      total: countResult.rows[0].total,
    };
  }

  async findById(id) {
    const result = await query(
      `SELECT o.*, c.name as customer_name, c.email as customer_email
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findItemsByOrderId(orderId) {
    const result = await query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
      [orderId]
    );
    return result.rows;
  }

  /**
   * Create an order within a transaction.
   * @param {import('pg').PoolClient} client
   */
  async create(client, { customer_id, total, notes }) {
    const result = await client.query(
      `INSERT INTO orders (customer_id, total, notes)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [customer_id, total, notes]
    );
    return result.rows[0];
  }

  /**
   * Create an order item within a transaction.
   * @param {import('pg').PoolClient} client
   */
  async createItem(client, { order_id, product_id, product_name, quantity, unit_price, subtotal }) {
    const result = await client.query(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [order_id, product_id, product_name, quantity, unit_price, subtotal]
    );
    return result.rows[0];
  }

  async updateStatus(id, status) {
    const result = await query(
      `UPDATE orders SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  }
}

module.exports = new OrderRepository();
