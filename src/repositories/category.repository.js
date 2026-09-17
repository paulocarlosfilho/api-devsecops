const { query } = require('../config/database');

class CategoryRepository {
  async findAll() {
    const result = await query(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    return result.rows;
  }

  async findById(id) {
    const result = await query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByName(name) {
    const result = await query(
      'SELECT * FROM categories WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  async create({ name, description }) {
    const result = await query(
      `INSERT INTO categories (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name, description]
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
      `UPDATE categories SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }

  async countProducts(categoryId) {
    const result = await query(
      'SELECT COUNT(*)::int as count FROM products WHERE category_id = $1 AND deleted_at IS NULL',
      [categoryId]
    );
    return result.rows[0].count;
  }
}

module.exports = new CategoryRepository();
