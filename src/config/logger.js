const { createLogger, format, transports } = require('winston');
const env = require('./env');

const logger = createLogger({
  level: env.isProduction() ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    env.isProduction()
      ? format.json()
      : format.combine(format.colorize(), format.simple())
  ),
  defaultMeta: { service: 'ecommerce-api' },
  transports: [
    new transports.Console({
      silent: env.isTest(),
    }),
  ],
});

module.exports = logger;
