const winston = require('winston')

require('winston-daily-rotate-file')

// https://github.com/deepakchandola717/morgan-winston-example

const transport = new winston.transports.DailyRotateFile({
  filename: `${__dirname}/../logs/application-%DATE%.log`,
  datePattern: 'DD-MM-YYYY',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
})

// timezone function winston calls to get timezone(ASIA/KOLKATA)
const timezoned = () =>
  new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
  })

const options = {
  file: {
    level: 'info',
    filename: `${__dirname}./logs/app.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 1,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
}

// logger object with above defined options
const logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
    transport,
  ],
  format: winston.format.combine(
    winston.format.simple(),
    winston.format.timestamp({
      format: timezoned,
    }),
    winston.format.printf(
      (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
    )
  ),
  exitOnError: false,
})

// writing file
logger.stream = {
  write(message) {
    logger.info(message)
  },
}

module.exports = logger
