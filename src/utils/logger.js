// Logger de eventos 
// src/utils/logger.js
const chalk = require('chalk');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

// Formato personalizado para logs
const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

// Cria o logger do Winston
const winstonLogger = createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

/**
 * Sistema de logs com cores e formatação
 */
const logger = {
  info: (message) => {
    console.log(chalk.blue(`[INFO] ${message}`));
    winstonLogger.info(message);
  },
  success: (message) => {
    console.log(chalk.green(`[SUCCESS] ${message}`));
    winstonLogger.info(`[SUCCESS] ${message}`);
  },
  warn: (message) => {
    console.log(chalk.yellow(`[WARN] ${message}`));
    winstonLogger.warn(message);
  },
  error: (message, error) => {
    console.error(chalk.red(`[ERROR] ${message}`));
    if (error) {
      console.error(error);
      winstonLogger.error(`${message} - ${error.stack || error}`);
    } else {
      winstonLogger.error(message);
    }
  },
  debug: (message) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.magenta(`[DEBUG] ${message}`));
      winstonLogger.debug(message);
    }
  }
};

module.exports = { logger, winstonLogger };
