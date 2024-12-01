const { createLogger, transports, format } = require('winston');

export const logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp(),
		format.printf(
			({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`,
		),
	),
	transports: [new transports.Console()],
});
