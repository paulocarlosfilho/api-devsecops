const ProductService = require('../../../src/services/product.service');
const productRepository = require('../../../src/repositories/product.repository');
const categoryRepository = require('../../../src/repositories/category.repository');
const cacheService = require('../../../src/cache/cache.service');
const { NotFoundError } = require('../../../src/errors');

jest.mock('../../../src/repositories/product.repository');
jest.mock('../../../src/repositories/category.repository');
jest.mock('../../../src/cache/cache.service');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);
    cacheService.invalidatePattern.mockResolvedValue(undefined);
    cacheService.getTTL.mockReturnValue(300);
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: 1, name: 'Smartphone', price: 2499.99 },
        { id: 2, name: 'Notebook', price: 4999.00 },
      ];
      productRepository.findAll.mockResolvedValue({ rows: mockProducts, total: 2 });

      const result = await ProductService.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(mockProducts);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should apply filters correctly', async () => {
      productRepository.findAll.mockResolvedValue({ rows: [], total: 0 });

      await ProductService.findAll({ page: 1, limit: 10, search: 'phone', category_id: 1 });

      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'phone', category_id: 1 })
      );
    });
  });

  describe('findById', () => {
    it('should return a product by id', async () => {
      const mockProduct = { id: 1, name: 'Smartphone', price: 2499.99, category_name: 'Eletrônicos' };
      productRepository.findById.mockResolvedValue(mockProduct);

      const result = await ProductService.findById(1);

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(ProductService.findById(999))
        .rejects.toThrow(NotFoundError);
    });

    it('should return cached product when available', async () => {
      const cached = { id: 1, name: 'Cached Product' };
      cacheService.get.mockResolvedValue(cached);

      const result = await ProductService.findById(1);

      expect(result).toEqual(cached);
      expect(productRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a product with valid category', async () => {
      const data = { name: 'Novo Produto', description: 'Desc', price: 99.90, stock: 10, sku: 'NP-001', category_id: 1 };
      const category = { id: 1, name: 'Eletrônicos' };
      const created = { id: 3, ...data };

      categoryRepository.findById.mockResolvedValue(category);
      productRepository.create.mockResolvedValue(created);

      const result = await ProductService.create(data);

      expect(result).toEqual(created);
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('products:*');
    });

    it('should throw NotFoundError when category does not exist', async () => {
      const data = { name: 'Produto', price: 99.90, stock: 10, category_id: 999 };
      categoryRepository.findById.mockResolvedValue(null);

      await expect(ProductService.create(data))
        .rejects.toThrow(NotFoundError);
      expect(productRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing product', async () => {
      const existing = { id: 1, name: 'Produto', price: 99.90 };
      const updated = { ...existing, price: 149.90 };

      productRepository.findById.mockResolvedValue(existing);
      productRepository.update.mockResolvedValue(updated);

      const result = await ProductService.update(1, { price: 149.90 });

      expect(result).toEqual(updated);
      expect(cacheService.del).toHaveBeenCalledWith('product:1');
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('products:list:*');
    });

    it('should validate new category on update', async () => {
      const existing = { id: 1, name: 'Produto', category_id: 1 };
      productRepository.findById.mockResolvedValue(existing);
      categoryRepository.findById.mockResolvedValue(null);

      await expect(ProductService.update(1, { category_id: 999 }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should soft delete a product', async () => {
      const existing = { id: 1, name: 'Produto' };
      productRepository.findById.mockResolvedValue(existing);
      productRepository.softDelete.mockResolvedValue({ ...existing, deleted_at: new Date() });

      const result = await ProductService.delete(1);

      expect(result.deleted_at).toBeDefined();
      expect(productRepository.softDelete).toHaveBeenCalledWith(1);
      expect(cacheService.del).toHaveBeenCalledWith('product:1');
    });

    it('should throw NotFoundError when product does not exist', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(ProductService.delete(999))
        .rejects.toThrow(NotFoundError);
    });
  });
});
