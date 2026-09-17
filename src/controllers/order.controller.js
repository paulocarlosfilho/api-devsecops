const orderService = require('../services/order.service');

class OrderController {
  async findAll(req, res, next) {
    try {
      const result = await orderService.findAll(req.query);
      res.json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const order = await orderService.findById(parseInt(req.params.id, 10));
      res.json({ status: 'success', data: order });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const order = await orderService.create(req.body);
      res.status(201).json({ status: 'success', data: order });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const order = await orderService.updateStatus(
        parseInt(req.params.id, 10),
        req.body.status
      );
      res.json({ status: 'success', data: order });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
