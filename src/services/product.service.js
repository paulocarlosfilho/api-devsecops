const crypto = require('crypto');
const productRepository = require('../repositories/product.repository');
const categoryRepository = require('../repositories/category.repository');
const cacheService = require('../cache/cache.service');
const { NotFoundError } = require('../errors');

class ProductService {
  async findAll(filters) {
    const hash = crypto.createHash('md5').update(JSON.stringify(filters)).digest('hex');
    const cacheKey = `products:list:${hash}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const { rows, total } = await productRepository.findAll(filters);
    const result = {
      data: rows,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total,
        totalPages: Math.ceil(total / (filters.limit || 20)),
      },
    };

    await cacheService.set(cacheKey, result, cacheService.getTTL('products_list'));
    return result;
  }

  async findById(id) {
    const cacheKey = `product:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product', id);
    }

    await cacheService.set(cacheKey, product, cacheService.getTTL('product'));
    return product;
  }

  async create(data) {
    // Validate category exists
    const category = await categoryRepository.findById(data.category_id);
    if (!category) {
      throw new NotFoundError('Category', data.category_id);
    }

    const product = await productRepository.create(data);
    await cacheService.invalidatePattern('products:*');
    return product;
  }

  async update(id, data) {
    await this.findById(id);

    if (data.category_id) {
      const category = await categoryRepository.findById(data.category_id);
      if (!category) {
        throw new NotFoundError('Category', data.category_id);
      }
    }

    const updated = await productRepository.update(id, data);
    await cacheService.del(`product:${id}`);
    await cacheService.invalidatePattern('products:list:*');
    return updated;
  }

  async delete(id) {
    await this.findById(id);

    const deleted = await productRepository.softDelete(id);
    await cacheService.del(`product:${id}`);
    await cacheService.invalidatePattern('products:list:*');
    return deleted;
  }
}

module.exports = new ProductService();
