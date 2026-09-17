const { Router } = require('express');
const orderController = require('../controllers/order.controller');
const validate = require('../middlewares/validate');
const { createOrder, updateOrderStatus, queryOrders } = require('../validators/order.validator');

const router = Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Listar pedidos com filtros e paginação
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED]
 *         description: Filtrar por status
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: integer
 *         description: Filtrar por cliente
 *     responses:
 *       200:
 *         description: Lista paginada de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', validate(queryOrders, 'query'), (req, res, next) => orderController.findAll(req, res, next));

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Buscar pedido por ID (inclui itens)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido encontrado com itens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Pedido não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', (req, res, next) => orderController.findById(req, res, next));

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Criar novo pedido
 *     description: |
 *       Cria um pedido com os itens especificados. O sistema:
 *       - Valida se o cliente existe
 *       - Valida se os produtos existem e têm estoque suficiente
 *       - Calcula o total automaticamente
 *       - Decrementa o estoque dos produtos (dentro de uma transação)
 *       - O pedido é criado com status **PENDING**
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrder'
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Cliente ou produto não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Estoque insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validate(createOrder), (req, res, next) => orderController.create(req, res, next));

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Atualizar status do pedido
 *     description: |
 *       Transições de status permitidas:
 *       - `PENDING` → `CONFIRMED` ou `CANCELLED`
 *       - `CONFIRMED` → `SHIPPED` ou `CANCELLED`
 *       - `SHIPPED` → `DELIVERED`
 *       - `DELIVERED` → (nenhuma transição permitida)
 *       - `CANCELLED` → (nenhuma transição permitida)
 *
 *       Ao cancelar um pedido, o estoque dos produtos é restaurado automaticamente.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatus'
 *     responses:
 *       200:
 *         description: Status atualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Erro de validação
 *       404:
 *         description: Pedido não encontrado
 *       422:
 *         description: Transição de status inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/status', validate(updateOrderStatus), (req, res, next) => orderController.updateStatus(req, res, next));

module.exports = router;
