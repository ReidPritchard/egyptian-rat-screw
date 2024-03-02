export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

type LogConfig = {
  level: LogLevel;
  structured: boolean;
};

class Logger {
  private config: LogConfig;
  private logMethods: { [level in LogLevel]: (...args: any[]) => void };

  constructor(config?: Partial<LogConfig>) {
    this.config = {
      level: LogLevel.DEBUG,
      structured: false,
      ...config,
    };

    this.logMethods = {
      [LogLevel.DEBUG]: console.debug,
      [LogLevel.INFO]: console.info,
      [LogLevel.WARN]: console.warn,
      [LogLevel.ERROR]: console.error,
    };
  }

  configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  log(level: LogLevel, ...args: any[]): void {
    if (!(level in this.logMethods)) {
      console.error(`Invalid log level: ${level}`);
      return;
    }

    if (LogLevel[level] < LogLevel[this.config.level]) {
      return;
    }

    const message = `[${new Date().toISOString()}] LOGGER: ${level}`;

    if (this.config.structured) {
      this.logMethods[level](JSON.stringify({ message, args }));
    } else {
      this.logMethods[level](message, ...args);
    }
  }

  debug(...args: any[]): void {
    this.log(LogLevel.DEBUG, ...args);
  }

  info(...args: any[]): void {
    this.log(LogLevel.INFO, ...args);
  }

  warn(...args: any[]): void {
    this.log(LogLevel.WARN, ...args);
  }

  error(...args: any[]): void {
    this.log(LogLevel.ERROR, ...args);
  }
}

const logger = new Logger();
logger.configure({ level: LogLevel.DEBUG, structured: false });

export const log = logger.log.bind(logger);
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);

export default logger;
