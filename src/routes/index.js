const { Router } = require('express');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const customerRoutes = require('./customer.routes');
const orderRoutes = require('./order.routes');

const router = Router();

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
