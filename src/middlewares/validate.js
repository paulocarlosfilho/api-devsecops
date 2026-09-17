/**
 * Creates a validation middleware for Joi schemas.
 * Validates req.body, req.query, or req.params based on the source parameter.
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} [source='body'] - Request property to validate
 * @returns {import('express').RequestHandler}
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(error);
    }

    req[source] = value;
    next();
  };
};

module.exports = validate;
