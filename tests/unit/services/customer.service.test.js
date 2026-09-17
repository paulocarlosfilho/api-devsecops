const CustomerService = require('../../../src/services/customer.service');
const customerRepository = require('../../../src/repositories/customer.repository');
const cacheService = require('../../../src/cache/cache.service');
const { NotFoundError, ConflictError, BusinessError } = require('../../../src/errors');

jest.mock('../../../src/repositories/customer.repository');
jest.mock('../../../src/cache/cache.service');

describe('CustomerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(undefined);
    cacheService.del.mockResolvedValue(undefined);
    cacheService.getTTL.mockReturnValue(300);
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [
        { id: 1, name: 'João', email: 'joao@email.com' },
        { id: 2, name: 'Maria', email: 'maria@email.com' },
      ];
      customerRepository.findAll.mockResolvedValue({ rows: mockCustomers, total: 2 });

      const result = await CustomerService.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(mockCustomers);
      expect(result.pagination.total).toBe(2);
    });

    it('should apply search filter', async () => {
      customerRepository.findAll.mockResolvedValue({ rows: [], total: 0 });

      await CustomerService.findAll({ page: 1, limit: 20, search: 'joao' });

      expect(customerRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'joao' })
      );
    });
  });

  describe('findById', () => {
    it('should return a customer by id', async () => {
      const mockCustomer = { id: 1, name: 'João', email: 'joao@email.com', cpf: '52998224725' };
      customerRepository.findById.mockResolvedValue(mockCustomer);

      const result = await CustomerService.findById(1);

      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundError when customer does not exist', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(CustomerService.findById(999))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create a customer with unique email and CPF', async () => {
      const data = { name: 'Novo Cliente', email: 'novo@email.com', cpf: '52998224725' };
      const created = { id: 4, ...data };

      customerRepository.findByEmail.mockResolvedValue(null);
      customerRepository.findByCpf.mockResolvedValue(null);
      customerRepository.create.mockResolvedValue(created);

      const result = await CustomerService.create(data);

      expect(result).toEqual(created);
    });

    it('should throw ConflictError when email already exists', async () => {
      const data = { name: 'Cliente', email: 'existing@email.com', cpf: '52998224725' };
      customerRepository.findByEmail.mockResolvedValue({ id: 1, email: 'existing@email.com' });

      await expect(CustomerService.create(data))
        .rejects.toThrow(ConflictError);
      expect(customerRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when CPF already exists', async () => {
      const data = { name: 'Cliente', email: 'new@email.com', cpf: '52998224725' };
      customerRepository.findByEmail.mockResolvedValue(null);
      customerRepository.findByCpf.mockResolvedValue({ id: 1, cpf: '52998224725' });

      await expect(CustomerService.create(data))
        .rejects.toThrow(ConflictError);
      expect(customerRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const existing = { id: 1, name: 'João', email: 'joao@email.com' };
      const updated = { ...existing, name: 'João Silva' };

      customerRepository.findById.mockResolvedValue(existing);
      customerRepository.update.mockResolvedValue(updated);

      const result = await CustomerService.update(1, { name: 'João Silva' });

      expect(result).toEqual(updated);
      expect(cacheService.del).toHaveBeenCalledWith('customer:1');
    });

    it('should throw ConflictError when updating to an existing email', async () => {
      const existing = { id: 1, name: 'João', email: 'joao@email.com' };
      customerRepository.findById.mockResolvedValue(existing);
      customerRepository.findByEmail.mockResolvedValue({ id: 2, email: 'maria@email.com' });

      await expect(CustomerService.update(1, { email: 'maria@email.com' }))
        .rejects.toThrow(ConflictError);
    });

    it('should allow keeping the same email on update', async () => {
      const existing = { id: 1, name: 'João', email: 'joao@email.com' };
      const updated = { ...existing, name: 'João Atualizado' };

      customerRepository.findById.mockResolvedValue(existing);
      customerRepository.update.mockResolvedValue(updated);

      const result = await CustomerService.update(1, { name: 'João Atualizado', email: 'joao@email.com' });

      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete a customer with no active orders', async () => {
      const existing = { id: 1, name: 'João' };
      customerRepository.findById.mockResolvedValue(existing);
      customerRepository.countActiveOrders.mockResolvedValue(0);
      customerRepository.delete.mockResolvedValue(existing);

      const result = await CustomerService.delete(1);

      expect(result).toEqual(existing);
      expect(cacheService.del).toHaveBeenCalledWith('customer:1');
    });

    it('should throw BusinessError when customer has active orders', async () => {
      const existing = { id: 1, name: 'João' };
      customerRepository.findById.mockResolvedValue(existing);
      customerRepository.countActiveOrders.mockResolvedValue(3);

      await expect(CustomerService.delete(1))
        .rejects.toThrow(BusinessError);
      expect(customerRepository.delete).not.toHaveBeenCalled();
    });
  });
});
