const productService = require('../services/product.service');

class ProductController {
  async findAll(req, res, next) {
    try {
      const result = await productService.findAll(req.query);
      res.json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const product = await productService.findById(parseInt(req.params.id, 10));
      res.json({ status: 'success', data: product });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const product = await productService.create(req.body);
      res.status(201).json({ status: 'success', data: product });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const product = await productService.update(parseInt(req.params.id, 10), req.body);
      res.json({ status: 'success', data: product });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await productService.delete(parseInt(req.params.id, 10));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
