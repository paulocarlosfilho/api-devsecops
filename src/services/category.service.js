const categoryRepository = require('../repositories/category.repository');
const cacheService = require('../cache/cache.service');
const { NotFoundError, ConflictError, BusinessError } = require('../errors');

class CategoryService {
  async findAll() {
    const cacheKey = 'categories:list';
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const categories = await categoryRepository.findAll();
    await cacheService.set(cacheKey, categories, cacheService.getTTL('categories_list'));
    return categories;
  }

  async findById(id) {
    const cacheKey = `category:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    await cacheService.set(cacheKey, category, cacheService.getTTL('category'));
    return category;
  }

  async create(data) {
    const existing = await categoryRepository.findByName(data.name);
    if (existing) {
      throw new ConflictError(`Category with name "${data.name}" already exists`);
    }

    const category = await categoryRepository.create(data);
    await cacheService.invalidatePattern('categories:*');
    return category;
  }

  async update(id, data) {
    await this.findById(id);

    if (data.name) {
      const existing = await categoryRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Category with name "${data.name}" already exists`);
      }
    }

    const updated = await categoryRepository.update(id, data);
    await cacheService.del(`category:${id}`);
    await cacheService.invalidatePattern('categories:*');
    return updated;
  }

  async delete(id) {
    await this.findById(id);

    const productCount = await categoryRepository.countProducts(id);
    if (productCount > 0) {
      throw new BusinessError(
        `Cannot delete category: it has ${productCount} active product(s) associated`
      );
    }

    const deleted = await categoryRepository.delete(id);
    await cacheService.del(`category:${id}`);
    await cacheService.invalidatePattern('categories:*');
    return deleted;
  }
}

module.exports = new CategoryService();
