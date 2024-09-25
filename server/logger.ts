import pino from 'pino';

export const logger = pino({
  name: 'server',
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
    },
  },
});

export const newLogger = (module: string) => {
  return logger.child({ module });
};
