const customerRepository = require('../repositories/customer.repository');
const cacheService = require('../cache/cache.service');
const { NotFoundError, ConflictError, BusinessError } = require('../errors');

class CustomerService {
  async findAll(filters) {
    const { rows, total } = await customerRepository.findAll(filters);
    return {
      data: rows,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total,
        totalPages: Math.ceil(total / (filters.limit || 20)),
      },
    };
  }

  async findById(id) {
    const cacheKey = `customer:${id}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundError('Customer', id);
    }

    await cacheService.set(cacheKey, customer, cacheService.getTTL('customer'));
    return customer;
  }

  async create(data) {
    // Check for duplicate email
    const existingEmail = await customerRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError(`Customer with email "${data.email}" already exists`);
    }

    // Check for duplicate CPF
    const existingCpf = await customerRepository.findByCpf(data.cpf);
    if (existingCpf) {
      throw new ConflictError('Customer with this CPF already exists');
    }

    return customerRepository.create(data);
  }

  async update(id, data) {
    const customer = await this.findById(id);

    if (data.email && data.email !== customer.email) {
      const existing = await customerRepository.findByEmail(data.email);
      if (existing) {
        throw new ConflictError(`Customer with email "${data.email}" already exists`);
      }
    }

    const updated = await customerRepository.update(id, data);
    await cacheService.del(`customer:${id}`);
    return updated;
  }

  async delete(id) {
    await this.findById(id);

    const activeOrders = await customerRepository.countActiveOrders(id);
    if (activeOrders > 0) {
      throw new BusinessError(
        `Cannot delete customer: there are ${activeOrders} active order(s) associated`
      );
    }

    const deleted = await customerRepository.delete(id);
    await cacheService.del(`customer:${id}`);
    return deleted;
  }
}

module.exports = new CustomerService();
