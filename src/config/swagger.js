const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'E-Commerce API',
      version: '1.0.0',
      description: 'API RESTful de e-commerce com arquitetura Service Layer, PostgreSQL e Redis.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    tags: [
      { name: 'Categories', description: 'Gerenciamento de categorias' },
      { name: 'Products', description: 'Gerenciamento de produtos' },
      { name: 'Customers', description: 'Gerenciamento de clientes' },
      { name: 'Orders', description: 'Gerenciamento de pedidos' },
    ],
    components: {
      schemas: {
        // ─── Error ──────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            code: { type: 'string', example: 'NOT_FOUND' },
            message: { type: 'string', example: 'Resource not found' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Validation failed' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'price' },
                  message: { type: 'string', example: 'Price must be greater than zero' },
                },
              },
            },
          },
        },

        // ─── Pagination ─────────────────────────────────────
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 50 },
            totalPages: { type: 'integer', example: 3 },
          },
        },

        // ─── Category ───────────────────────────────────────
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Eletrônicos' },
            description: { type: 'string', example: 'Dispositivos eletrônicos e gadgets' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateCategory: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'Eletrônicos' },
            description: { type: 'string', maxLength: 500, example: 'Dispositivos eletrônicos' },
          },
        },
        UpdateCategory: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100, example: 'Eletrônicos Atualizados' },
            description: { type: 'string', maxLength: 500, example: 'Descrição atualizada' },
          },
        },

        // ─── Product ────────────────────────────────────────
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Smartphone Galaxy X' },
            description: { type: 'string', example: 'Smartphone com tela AMOLED 6.5"' },
            price: { type: 'number', format: 'decimal', example: 2499.99 },
            stock: { type: 'integer', example: 50 },
            sku: { type: 'string', example: 'SMRT-001' },
            category_id: { type: 'integer', example: 1 },
            category_name: { type: 'string', example: 'Eletrônicos' },
            deleted_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateProduct: {
          type: 'object',
          required: ['name', 'price', 'stock', 'category_id'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 255, example: 'Smartphone Galaxy X' },
            description: { type: 'string', maxLength: 2000, example: 'Smartphone com tela AMOLED' },
            price: { type: 'number', minimum: 0.01, example: 2499.99 },
            stock: { type: 'integer', minimum: 0, example: 50 },
            category_id: { type: 'integer', example: 1 },
            sku: { type: 'string', maxLength: 100, example: 'SMRT-001' },
          },
        },
        UpdateProduct: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 255 },
            description: { type: 'string', maxLength: 2000 },
            price: { type: 'number', minimum: 0.01 },
            stock: { type: 'integer', minimum: 0 },
            category_id: { type: 'integer' },
            sku: { type: 'string', maxLength: 100 },
          },
        },

        // ─── Address ────────────────────────────────────────
        Address: {
          type: 'object',
          properties: {
            street: { type: 'string', example: 'Rua das Flores' },
            number: { type: 'string', example: '100' },
            complement: { type: 'string', example: 'Apto 42' },
            neighborhood: { type: 'string', example: 'Centro' },
            city: { type: 'string', example: 'São Paulo' },
            state: { type: 'string', example: 'SP', minLength: 2, maxLength: 2 },
            zip_code: { type: 'string', example: '01001-000' },
          },
        },

        // ─── Customer ───────────────────────────────────────
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', format: 'email', example: 'joao@email.com' },
            cpf: { type: 'string', example: '52998224725' },
            phone: { type: 'string', example: '11999990001' },
            address: { $ref: '#/components/schemas/Address' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateCustomer: {
          type: 'object',
          required: ['name', 'email', 'cpf'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 255, example: 'João Silva' },
            email: { type: 'string', format: 'email', example: 'joao@email.com' },
            cpf: { type: 'string', example: '529.982.247-25', description: 'CPF válido (com ou sem máscara)' },
            phone: { type: 'string', maxLength: 20, example: '11999990001' },
            address: { $ref: '#/components/schemas/Address' },
          },
        },
        UpdateCustomer: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 255 },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', maxLength: 20 },
            address: { $ref: '#/components/schemas/Address' },
          },
        },

        // ─── Order ──────────────────────────────────────────
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            order_id: { type: 'integer', example: 1 },
            product_id: { type: 'integer', example: 1 },
            product_name: { type: 'string', example: 'Smartphone Galaxy X' },
            quantity: { type: 'integer', example: 2 },
            unit_price: { type: 'number', example: 2499.99 },
            subtotal: { type: 'number', example: 4999.98 },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            customer_id: { type: 'integer', example: 1 },
            customer_name: { type: 'string', example: 'João Silva' },
            customer_email: { type: 'string', example: 'joao@email.com' },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
              example: 'PENDING',
            },
            total: { type: 'number', example: 4999.98 },
            notes: { type: 'string', example: 'Entregar rápido' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateOrderItem: {
          type: 'object',
          required: ['product_id', 'quantity'],
          properties: {
            product_id: { type: 'integer', example: 1 },
            quantity: { type: 'integer', minimum: 1, example: 2 },
          },
        },
        CreateOrder: {
          type: 'object',
          required: ['customer_id', 'items'],
          properties: {
            customer_id: { type: 'integer', example: 1 },
            items: {
              type: 'array',
              minItems: 1,
              items: { $ref: '#/components/schemas/CreateOrderItem' },
            },
            notes: { type: 'string', maxLength: 500, example: 'Entregar rápido' },
          },
        },
        UpdateOrderStatus: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
              example: 'CONFIRMED',
              description: 'Fluxo: PENDING → CONFIRMED → SHIPPED → DELIVERED. Cancelamento possível de PENDING ou CONFIRMED.',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
