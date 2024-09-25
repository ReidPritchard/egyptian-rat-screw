import pino from 'pino';

const defaultLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const logger = pino({
  name: 'client',
  level: defaultLevel,
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
      messageFormat: '{module} - {msg}',
    },
  },
});

export const newLogger = (module: string) => {
  return logger.child({ module });
};
