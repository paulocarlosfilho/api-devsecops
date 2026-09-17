const CategoryService = require('../../../src/services/category.service');
const categoryRepository = require('../../../src/repositories/category.repository');
const cacheService = require('../../../src/cache/cache.service');
const { NotFoundError, ConflictError, BusinessError } = require('../../../src/errors');

// Mock dependencies
jest.mock('../../../src/repositories/category.repository');
jest.mock('../../../src/cache/cache.service');

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);
    cacheService.invalidatePattern.mockResolvedValue(undefined);
    cacheService.getTTL.mockReturnValue(600);
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Eletrônicos', description: 'Gadgets' },
        { id: 2, name: 'Roupas', description: 'Vestuário' },
      ];
      categoryRepository.findAll.mockResolvedValue(mockCategories);

      const result = await CategoryService.findAll();

      expect(result).toEqual(mockCategories);
      expect(categoryRepository.findAll).toHaveBeenCalledTimes(1);
      expect(cacheService.set).toHaveBeenCalledWith('categories:list', mockCategories, 600);
    });

    it('should return cached data when available', async () => {
      const cached = [{ id: 1, name: 'Cached' }];
      cacheService.get.mockResolvedValue(cached);

      const result = await CategoryService.findAll();

      expect(result).toEqual(cached);
      expect(categoryRepository.findAll).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a category by id', async () => {
      const mockCategory = { id: 1, name: 'Eletrônicos', description: 'Gadgets' };
      categoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await CategoryService.findById(1);

      expect(result).toEqual(mockCategory);
      expect(categoryRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError when category does not exist', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(CategoryService.findById(999))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const data = { name: 'Nova Categoria', description: 'Descrição' };
      const created = { id: 3, ...data };
      categoryRepository.findByName.mockResolvedValue(null);
      categoryRepository.create.mockResolvedValue(created);

      const result = await CategoryService.create(data);

      expect(result).toEqual(created);
      expect(categoryRepository.findByName).toHaveBeenCalledWith('Nova Categoria');
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('categories:*');
    });

    it('should throw ConflictError when name already exists', async () => {
      const data = { name: 'Eletrônicos', description: 'Descrição' };
      categoryRepository.findByName.mockResolvedValue({ id: 1, name: 'Eletrônicos' });

      await expect(CategoryService.create(data))
        .rejects.toThrow(ConflictError);
      expect(categoryRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing category', async () => {
      const mockCategory = { id: 1, name: 'Eletrônicos', description: 'Gadgets' };
      const updateData = { name: 'Eletrônicos Atualizado' };
      const updated = { ...mockCategory, ...updateData };

      categoryRepository.findById.mockResolvedValue(mockCategory);
      categoryRepository.findByName.mockResolvedValue(null);
      categoryRepository.update.mockResolvedValue(updated);

      const result = await CategoryService.update(1, updateData);

      expect(result).toEqual(updated);
      expect(cacheService.del).toHaveBeenCalledWith('category:1');
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('categories:*');
    });

    it('should throw ConflictError when updating to an existing name', async () => {
      const mockCategory = { id: 1, name: 'Eletrônicos' };
      categoryRepository.findById.mockResolvedValue(mockCategory);
      categoryRepository.findByName.mockResolvedValue({ id: 2, name: 'Roupas' });

      await expect(CategoryService.update(1, { name: 'Roupas' }))
        .rejects.toThrow(ConflictError);
    });

    it('should allow keeping the same name on update', async () => {
      const mockCategory = { id: 1, name: 'Eletrônicos' };
      const updated = { ...mockCategory, description: 'Atualizado' };

      categoryRepository.findById.mockResolvedValue(mockCategory);
      categoryRepository.findByName.mockResolvedValue({ id: 1, name: 'Eletrônicos' });
      categoryRepository.update.mockResolvedValue(updated);

      const result = await CategoryService.update(1, { name: 'Eletrônicos', description: 'Atualizado' });

      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete a category with no products', async () => {
      const mockCategory = { id: 1, name: 'Vazia' };
      categoryRepository.findById.mockResolvedValue(mockCategory);
      categoryRepository.countProducts.mockResolvedValue(0);
      categoryRepository.delete.mockResolvedValue(mockCategory);

      const result = await CategoryService.delete(1);

      expect(result).toEqual(mockCategory);
      expect(cacheService.del).toHaveBeenCalledWith('category:1');
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('categories:*');
    });

    it('should throw BusinessError when category has active products', async () => {
      const mockCategory = { id: 1, name: 'Eletrônicos' };
      categoryRepository.findById.mockResolvedValue(mockCategory);
      categoryRepository.countProducts.mockResolvedValue(5);

      await expect(CategoryService.delete(1))
        .rejects.toThrow(BusinessError);
      expect(categoryRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when category does not exist', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(CategoryService.delete(999))
        .rejects.toThrow(NotFoundError);
    });
  });
});
