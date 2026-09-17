const { isValidCPF } = require('../../../src/validators/customer.validator');
const { createProduct, updateProduct } = require('../../../src/validators/product.validator');

describe('Validators', () => {
  describe('CPF Validation', () => {
    it('should accept a valid CPF', () => {
      expect(isValidCPF('529.982.247-25')).toBe(true);
      expect(isValidCPF('52998224725')).toBe(true);
    });

    it('should reject CPF with all same digits', () => {
      expect(isValidCPF('11111111111')).toBe(false);
      expect(isValidCPF('00000000000')).toBe(false);
    });

    it('should reject CPF with wrong check digits', () => {
      expect(isValidCPF('52998224726')).toBe(false);
      expect(isValidCPF('12345678901')).toBe(false);
    });

    it('should reject CPF with wrong length', () => {
      expect(isValidCPF('1234567890')).toBe(false);
      expect(isValidCPF('123456789012')).toBe(false);
    });
  });

  describe('Product Validation', () => {
    describe('createProduct', () => {
      it('should validate a valid product', () => {
        const { error } = createProduct.validate({
          name: 'Smartphone',
          description: 'A great phone',
          price: 2499.99,
          stock: 50,
          category_id: 1,
        });
        expect(error).toBeUndefined();
      });

      it('should require name', () => {
        const { error } = createProduct.validate({
          price: 99.90,
          stock: 10,
          category_id: 1,
        });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('name');
      });

      it('should require positive price', () => {
        const { error } = createProduct.validate({
          name: 'Produto',
          price: -10,
          stock: 10,
          category_id: 1,
        });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('price');
      });

      it('should reject zero price', () => {
        const { error } = createProduct.validate({
          name: 'Produto',
          price: 0,
          stock: 10,
          category_id: 1,
        });
        expect(error).toBeDefined();
      });

      it('should reject negative stock', () => {
        const { error } = createProduct.validate({
          name: 'Produto',
          price: 99.90,
          stock: -5,
          category_id: 1,
        });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('stock');
      });

      it('should require category_id', () => {
        const { error } = createProduct.validate({
          name: 'Produto',
          price: 99.90,
          stock: 10,
        });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('category_id');
      });
    });

    describe('updateProduct', () => {
      it('should require at least one field', () => {
        const { error } = updateProduct.validate({});
        expect(error).toBeDefined();
      });

      it('should allow partial updates', () => {
        const { error } = updateProduct.validate({ price: 199.90 });
        expect(error).toBeUndefined();
      });

      it('should reject invalid price on update', () => {
        const { error } = updateProduct.validate({ price: -1 });
        expect(error).toBeDefined();
      });
    });
  });
});
