const { pool } = require('../config/database');
const logger = require('../config/logger');

const seedData = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Seed categories
    await client.query(`
      INSERT INTO categories (name, description) VALUES
        ('Eletrônicos', 'Dispositivos eletrônicos e gadgets'),
        ('Roupas', 'Vestuário masculino e feminino'),
        ('Livros', 'Livros físicos e digitais'),
        ('Casa e Decoração', 'Itens para casa e decoração'),
        ('Esportes', 'Equipamentos e acessórios esportivos')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Seed products
    await client.query(`
      INSERT INTO products (name, description, price, stock, sku, category_id) VALUES
        ('Smartphone Galaxy X', 'Smartphone com tela AMOLED 6.5"', 2499.99, 50, 'SMRT-001', 1),
        ('Notebook Ultra Pro', 'Notebook 15.6" 16GB RAM SSD 512GB', 4999.00, 20, 'NOTE-001', 1),
        ('Fone Bluetooth ANC', 'Fone com cancelamento ativo de ruído', 399.90, 100, 'FONE-001', 1),
        ('Camiseta Básica Algodão', 'Camiseta 100% algodão', 59.90, 200, 'CAMT-001', 2),
        ('Calça Jeans Slim', 'Calça jeans slim fit', 149.90, 80, 'CALC-001', 2),
        ('Clean Code', 'Robert C. Martin - Código Limpo', 79.90, 30, 'LIVR-001', 3),
        ('Design Patterns', 'Gang of Four - Padrões de Projeto', 89.90, 25, 'LIVR-002', 3),
        ('Luminária LED', 'Luminária de mesa LED ajustável', 129.90, 60, 'CASA-001', 4),
        ('Bola de Futebol', 'Bola oficial tamanho 5', 99.90, 40, 'ESPT-001', 5),
        ('Tênis de Corrida', 'Tênis com amortecimento gel', 299.90, 35, 'ESPT-002', 5)
      ON CONFLICT (sku) DO NOTHING;
    `);

    // Seed customers
    await client.query(`
      INSERT INTO customers (name, email, cpf, phone, address) VALUES
        ('João Silva', 'joao@email.com', '52998224725', '11999990001',
         '{"street": "Rua das Flores", "number": "100", "neighborhood": "Centro", "city": "São Paulo", "state": "SP", "zip_code": "01001-000"}'::jsonb),
        ('Maria Santos', 'maria@email.com', '71168090052', '11999990002',
         '{"street": "Av. Paulista", "number": "1000", "neighborhood": "Bela Vista", "city": "São Paulo", "state": "SP", "zip_code": "01310-100"}'::jsonb),
        ('Pedro Oliveira', 'pedro@email.com', '97861382080', '11999990003',
         '{"street": "Rua Augusta", "number": "500", "neighborhood": "Consolação", "city": "São Paulo", "state": "SP", "zip_code": "01304-000"}'::jsonb)
      ON CONFLICT (email) DO NOTHING;
    `);

    await client.query('COMMIT');
    logger.info('Database seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Seed failed', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  seedData()
    .then(() => {
      logger.info('Seed done');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Seed error', { error: err.message });
      process.exit(1);
    });
}

module.exports = { seedData };
