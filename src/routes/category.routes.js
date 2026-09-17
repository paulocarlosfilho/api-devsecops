const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const validate = require('../middlewares/validate');
const { createCategory, updateCategory } = require('../validators/category.validator');

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Listar todas as categorias
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lista de categorias
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
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/', (req, res, next) => categoryController.findAll(req, res, next));

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Buscar categoria por ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Categoria não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', (req, res, next) => categoryController.findById(req, res, next));

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Criar nova categoria
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategory'
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: Nome já existente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validate(createCategory), (req, res, next) => categoryController.create(req, res, next));

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Atualizar categoria
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da categoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategory'
 *     responses:
 *       200:
 *         description: Categoria atualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Erro de validação
 *       404:
 *         description: Categoria não encontrada
 *       409:
 *         description: Nome já existente
 */
router.put('/:id', validate(updateCategory), (req, res, next) => categoryController.update(req, res, next));

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Deletar categoria
 *     description: Não é possível deletar uma categoria que possui produtos ativos vinculados.
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da categoria
 *     responses:
 *       204:
 *         description: Categoria deletada com sucesso
 *       404:
 *         description: Categoria não encontrada
 *       422:
 *         description: Categoria possui produtos ativos vinculados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', (req, res, next) => categoryController.delete(req, res, next));

module.exports = router;
