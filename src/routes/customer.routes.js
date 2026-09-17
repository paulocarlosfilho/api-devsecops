const { Router } = require('express');
const customerController = require('../controllers/customer.controller');
const validate = require('../middlewares/validate');
const { createCustomer, updateCustomer, queryCustomers } = require('../validators/customer.validator');

const router = Router();

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Listar clientes com paginação
 *     tags: [Customers]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou email
 *     responses:
 *       200:
 *         description: Lista paginada de clientes
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
 *                     $ref: '#/components/schemas/Customer'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', validate(queryCustomers, 'query'), (req, res, next) => customerController.findAll(req, res, next));

/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Buscar cliente por ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Cliente não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', (req, res, next) => customerController.findById(req, res, next));

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Criar novo cliente
 *     description: Email e CPF devem ser únicos. O CPF é validado algoritmicamente.
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomer'
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Erro de validação (CPF inválido, campos obrigatórios)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: Email ou CPF já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validate(createCustomer), (req, res, next) => customerController.create(req, res, next));

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Atualizar cliente
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomer'
 *     responses:
 *       200:
 *         description: Cliente atualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Erro de validação
 *       404:
 *         description: Cliente não encontrado
 *       409:
 *         description: Email já cadastrado
 */
router.put('/:id', validate(updateCustomer), (req, res, next) => customerController.update(req, res, next));

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Deletar cliente
 *     description: Não é possível deletar um cliente que possui pedidos ativos (PENDING, CONFIRMED ou SHIPPED).
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     responses:
 *       204:
 *         description: Cliente deletado com sucesso
 *       404:
 *         description: Cliente não encontrado
 *       422:
 *         description: Cliente possui pedidos ativos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', (req, res, next) => customerController.delete(req, res, next));

module.exports = router;
