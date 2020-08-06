const winston = require('winston');
require('winston-daily-rotate-file');

const transport = new winston.transports.DailyRotateFile({
  filename: 'shipping-price-response-%DATE%.log',
  dirname: './logging',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '100m',
  maxFiles: '7d'
});

transport.on('rotate', function(oldFilename, newFilename) {
  // do something
});

const responseLogger = winston.createLogger({
  transports: [
    transport
  ]
});
module.exports = responseLogger