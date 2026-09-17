const OrderService = require('../../../src/services/order.service');
const orderRepository = require('../../../src/repositories/order.repository');
const productRepository = require('../../../src/repositories/product.repository');
const customerRepository = require('../../../src/repositories/customer.repository');
const cacheService = require('../../../src/cache/cache.service');
const db = require('../../../src/config/database');
const { NotFoundError, BusinessError } = require('../../../src/errors');

jest.mock('../../../src/repositories/order.repository');
jest.mock('../../../src/repositories/product.repository');
jest.mock('../../../src/repositories/customer.repository');
jest.mock('../../../src/cache/cache.service');
jest.mock('../../../src/config/database');

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);
    cacheService.invalidatePattern.mockResolvedValue(undefined);
    cacheService.getTTL.mockReturnValue(60);
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        { id: 1, status: 'PENDING', total: 100.00, customer_name: 'João' },
      ];
      orderRepository.findAll.mockResolvedValue({ rows: mockOrders, total: 1 });

      const result = await OrderService.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(mockOrders);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by status', async () => {
      orderRepository.findAll.mockResolvedValue({ rows: [], total: 0 });

      await OrderService.findAll({ page: 1, limit: 20, status: 'PENDING' });

      expect(orderRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING' })
      );
    });
  });

  describe('findById', () => {
    it('should return order with items', async () => {
      const mockOrder = { id: 1, status: 'PENDING', total: 2499.99 };
      const mockItems = [
        { id: 1, product_name: 'Smartphone', quantity: 1, unit_price: 2499.99 },
      ];

      orderRepository.findById.mockResolvedValue(mockOrder);
      orderRepository.findItemsByOrderId.mockResolvedValue(mockItems);

      const result = await OrderService.findById(1);

      expect(result.items).toEqual(mockItems);
      expect(result.status).toBe('PENDING');
    });

    it('should throw NotFoundError when order does not exist', async () => {
      orderRepository.findById.mockResolvedValue(null);

      await expect(OrderService.findById(999))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    const createData = {
      customer_id: 1,
      items: [
        { product_id: 1, quantity: 2 },
        { product_id: 2, quantity: 1 },
      ],
      notes: 'Entregar rápido',
    };

    it('should create an order with stock validation', async () => {
      const customer = { id: 1, name: 'João' };
      const product1 = { id: 1, name: 'Smartphone', price: '2499.99', stock: 50 };
      const product2 = { id: 2, name: 'Notebook', price: '4999.00', stock: 20 };
      const createdOrder = { id: 1, customer_id: 1, total: 9998.98, status: 'PENDING' };

      customerRepository.findById.mockResolvedValue(customer);
      productRepository.findById
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      // Mock transaction
      db.transaction.mockImplementation(async (fn) => {
        const mockClient = { query: jest.fn() };
        orderRepository.create.mockResolvedValue(createdOrder);
        orderRepository.createItem.mockResolvedValue({});
        productRepository.updateStock.mockResolvedValue({ id: 1, stock: 48 });
        return fn(mockClient);
      });

      const result = await OrderService.create(createData);

      expect(result.items).toHaveLength(2);
      expect(customerRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError when customer does not exist', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(OrderService.create(createData))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      customerRepository.findById.mockResolvedValue({ id: 1 });
      productRepository.findById.mockResolvedValue(null);

      await expect(OrderService.create(createData))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw BusinessError when insufficient stock', async () => {
      const customer = { id: 1, name: 'João' };
      const product = { id: 1, name: 'Smartphone', price: '2499.99', stock: 1 };

      customerRepository.findById.mockResolvedValue(customer);
      productRepository.findById.mockResolvedValue(product);

      await expect(OrderService.create({
        customer_id: 1,
        items: [{ product_id: 1, quantity: 5 }],
      })).rejects.toThrow(BusinessError);
    });
  });

  describe('updateStatus', () => {
    it('should transition from PENDING to CONFIRMED', async () => {
      const order = { id: 1, status: 'PENDING' };
      const updated = { ...order, status: 'CONFIRMED' };

      orderRepository.findById
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(updated);
      orderRepository.updateStatus.mockResolvedValue(updated);

      const result = await OrderService.updateStatus(1, 'CONFIRMED');

      expect(result.status).toBe('CONFIRMED');
    });

    it('should transition from CONFIRMED to SHIPPED', async () => {
      const order = { id: 1, status: 'CONFIRMED' };
      const updated = { ...order, status: 'SHIPPED' };

      orderRepository.findById
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(updated);
      orderRepository.updateStatus.mockResolvedValue(updated);

      const result = await OrderService.updateStatus(1, 'SHIPPED');

      expect(result.status).toBe('SHIPPED');
    });

    it('should transition from SHIPPED to DELIVERED', async () => {
      const order = { id: 1, status: 'SHIPPED' };
      const updated = { ...order, status: 'DELIVERED' };

      orderRepository.findById
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(updated);
      orderRepository.updateStatus.mockResolvedValue(updated);

      const result = await OrderService.updateStatus(1, 'DELIVERED');

      expect(result.status).toBe('DELIVERED');
    });

    it('should throw BusinessError for invalid status transition', async () => {
      const order = { id: 1, status: 'DELIVERED' };
      orderRepository.findById.mockResolvedValue(order);

      await expect(OrderService.updateStatus(1, 'CANCELLED'))
        .rejects.toThrow(BusinessError);
    });

    it('should throw BusinessError when trying to ship a pending order', async () => {
      const order = { id: 1, status: 'PENDING' };
      orderRepository.findById.mockResolvedValue(order);

      await expect(OrderService.updateStatus(1, 'SHIPPED'))
        .rejects.toThrow(BusinessError);
    });

    it('should restore stock when cancelling an order', async () => {
      const order = { id: 1, status: 'PENDING' };
      const items = [
        { product_id: 1, quantity: 2 },
        { product_id: 2, quantity: 1 },
      ];

      orderRepository.findById
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce({ ...order, status: 'CANCELLED' });
      orderRepository.findItemsByOrderId.mockResolvedValue(items);

      const mockClient = { query: jest.fn() };
      db.transaction.mockImplementation(async (fn) => {
        productRepository.updateStock.mockResolvedValue({});
        return fn(mockClient);
      });

      const result = await OrderService.updateStatus(1, 'CANCELLED');

      expect(result.status).toBe('CANCELLED');
      expect(db.transaction).toHaveBeenCalled();
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('products:*');
    });

    it('should throw NotFoundError when order does not exist', async () => {
      orderRepository.findById.mockResolvedValue(null);

      await expect(OrderService.updateStatus(999, 'CONFIRMED'))
        .rejects.toThrow(NotFoundError);
    });
  });
});
