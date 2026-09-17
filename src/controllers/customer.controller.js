const customerService = require('../services/customer.service');

class CustomerController {
  async findAll(req, res, next) {
    try {
      const result = await customerService.findAll(req.query);
      res.json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const customer = await customerService.findById(parseInt(req.params.id, 10));
      res.json({ status: 'success', data: customer });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const customer = await customerService.create(req.body);
      res.status(201).json({ status: 'success', data: customer });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const customer = await customerService.update(parseInt(req.params.id, 10), req.body);
      res.json({ status: 'success', data: customer });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await customerService.delete(parseInt(req.params.id, 10));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
