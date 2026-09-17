const { query } = require('../config/database');

class CustomerRepository {
  async findAll({ page = 1, limit = 20, search }) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM customers ${whereClause}`,
      values
    );

    const dataResult = await query(
      `SELECT * FROM customers ${whereClause}
       ORDER BY created_at DESC
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
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM customers WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findByCpf(cpf) {
    const result = await query(
      'SELECT * FROM customers WHERE cpf = $1',
      [cpf]
    );
    return result.rows[0] || null;
  }

  async create({ name, email, cpf, phone, address }) {
    const result = await query(
      `INSERT INTO customers (name, email, cpf, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, cpf, phone, address ? JSON.stringify(address) : null]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (key === 'address' && value !== null) {
        fields.push(`${key} = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }

    values.push(id);
    const result = await query(
      `UPDATE customers SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await query(
      'DELETE FROM customers WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }

  async countActiveOrders(customerId) {
    const result = await query(
      `SELECT COUNT(*)::int as count FROM orders
       WHERE customer_id = $1 AND status NOT IN ('DELIVERED', 'CANCELLED')`,
      [customerId]
    );
    return result.rows[0].count;
  }
}

module.exports = new CustomerRepository();
