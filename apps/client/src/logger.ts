import pino, { LoggerOptions } from 'pino';

const defaultLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

function colorLog(message: string, color: string) {
  color = color || 'black';

  switch (color.toLowerCase()) {
    case 'success':
      color = 'Green';
      break;
    case 'info':
      color = 'DodgerBlue';
      break;
    case 'error':
      color = 'Red';
      break;
    case 'warning':
      color = 'Orange';
      break;
    default:
      color = color;
  }

  console.log(`%c${message}%c`, `color: ${color}`, 'color: inherit');
}

export const logger = pino({
  name: 'client',
  level: defaultLevel,
  browser: {
    asObject: false,
    formatters: {
      level(label) {
        return { level: label.toUpperCase() };
      },
    },
    write: (log_object) => {
      const { loggerName, msg, level, time } = log_object as Record<string, any>;

      const pretty_time = new Date(time).toISOString().split('T')[1].split('.')[0];

      // console.log(`[${time}][${level}] @${loggerName} - ${msg}`);
      colorLog(`[${pretty_time}][@${loggerName}]: ${msg}`, level);
    },
  },
  formatters: {
    bindings: (bindings) => ({
      ...bindings,
      module: bindings.module,
    }),
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: true,
      ignore: 'pid,hostname,module',
      messageFormat: '{loggerName} - {msg}',
    },
  },
});

export const newLogger = (module: string) => {
  return logger.child({ loggerName: module });
};
