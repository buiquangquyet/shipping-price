const winston = require('winston');
require('winston-daily-rotate-file');

const transport = new winston.transports.DailyRotateFile({
  filename: 'shipping-price-request-%DATE%.log',
  dirname: './logging',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxFiles: '7d'
});

transport.on('rotate', function(oldFilename, newFilename) {
  // do something
});

const requestLogger = winston.createLogger({
  transports: [
    transport
  ]
});
module.exports = requestLogger