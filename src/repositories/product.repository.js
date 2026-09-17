const { query } = require('../config/database');

class ProductRepository {
  /**
   * Find all active products with optional filters and pagination.
   * @param {Object} filters
   * @returns {Promise<{rows: Array, total: number}>}
   */
  async findAll({ page = 1, limit = 20, search, category_id, min_price, max_price, sort_by = 'created_at', sort_order = 'desc' }) {
    const conditions = ['p.deleted_at IS NULL'];
    const values = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (category_id) {
      conditions.push(`p.category_id = $${paramIndex}`);
      values.push(category_id);
      paramIndex++;
    }

    if (min_price !== undefined) {
      conditions.push(`p.price >= $${paramIndex}`);
      values.push(min_price);
      paramIndex++;
    }

    if (max_price !== undefined) {
      conditions.push(`p.price <= $${paramIndex}`);
      values.push(max_price);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Allow-list of sortable columns to prevent SQL injection
    const allowedSortColumns = ['name', 'price', 'created_at'];
    const safeSort = allowedSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const safeOrder = sort_order === 'asc' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM products p WHERE ${whereClause}`,
      values
    );

    const dataResult = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${whereClause}
       ORDER BY p.${safeSort} ${safeOrder}
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
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIdIncludingDeleted(id) {
    const result = await query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create({ name, description, price, stock, sku, category_id }) {
    const result = await query(
      `INSERT INTO products (name, description, price, stock, sku, category_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, stock, sku, category_id]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    values.push(id);
    const result = await query(
      `UPDATE products SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND deleted_at IS NULL
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async softDelete(id) {
    const result = await query(
      `UPDATE products SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Update stock for a product (used in transactions).
   * @param {import('pg').PoolClient} client - Transaction client
   * @param {number} productId
   * @param {number} quantityChange - Positive to add, negative to subtract
   */
  async updateStock(client, productId, quantityChange) {
    const result = await client.query(
      `UPDATE products SET stock = stock + $1
       WHERE id = $2 AND deleted_at IS NULL AND stock + $1 >= 0
       RETURNING *`,
      [quantityChange, productId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new ProductRepository();
