const categoryService = require('../services/category.service');

class CategoryController {
  async findAll(req, res, next) {
    try {
      const categories = await categoryService.findAll();
      res.json({ status: 'success', data: categories });
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const category = await categoryService.findById(parseInt(req.params.id, 10));
      res.json({ status: 'success', data: category });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.body);
      res.status(201).json({ status: 'success', data: category });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.update(parseInt(req.params.id, 10), req.body);
      res.json({ status: 'success', data: category });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await categoryService.delete(parseInt(req.params.id, 10));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
