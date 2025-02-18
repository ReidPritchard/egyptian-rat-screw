type LogLevel = "debug" | "info" | "warn" | "error";
type LogColor = keyof typeof COLORS | string;

const defaultLevel: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "debug";

const COLORS = {
  success: "#4CAF50", // Material Green
  info: "#2196F3", // Material Blue
  error: "#F44336", // Material Red
  warn: "#FF9800", // Material Orange
  debug: "#9E9E9E", // Material Gray
} as const;

const LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

interface LogOptions {
  color?: LogColor;
  timestamp?: boolean;
  prefix?: string;
  data?: unknown;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function colorLog(
  message: string,
  options: LogOptions & { color: LogColor; timestamp: boolean; prefix: string }
) {
  const timestamp = options.timestamp ? `[${formatTimestamp()}] ` : "";
  const prefix = options.prefix ? `${options.prefix} ` : "";
  const logColor =
    COLORS[options.color as keyof typeof COLORS] || options.color || "black";
  const logMessage = options.data
    ? `${message} ${JSON.stringify(options.data)}`
    : message;

  console.log(
    `%c${timestamp}${prefix}${logMessage}%c`,
    `color: ${logColor}; font-weight: bold`,
    "color: inherit"
  );
}

class Logger {
  private readonly name: string;
  private readonly level: LogLevel;
  private readonly defaultOptions: Partial<LogOptions>;

  constructor(
    name: string,
    level: LogLevel = defaultLevel,
    options: Partial<LogOptions> = {}
  ) {
    this.name = name;
    this.level = level;
    this.defaultOptions = {
      timestamp: true,
      prefix: `[${name}]`,
      ...options,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVELS.indexOf(this.level) <= LEVELS.indexOf(level);
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}\n${error.stack || ""}`;
    }
    return String(error);
  }

  private log(
    message: string | Error,
    level: LogLevel,
    options: Partial<LogOptions> = {}
  ): void {
    if (!this.shouldLog(level)) return;

    const finalMessage =
      message instanceof Error ? this.formatError(message) : message;
    const finalOptions = {
      color: COLORS[level] || "black",
      timestamp: true,
      prefix: `[${this.name}]`,
      ...this.defaultOptions,
      ...options,
    };

    colorLog(finalMessage, finalOptions);
  }

  public debug(
    message: string | Error,
    options: Partial<LogOptions> = {}
  ): void {
    this.log(message, "debug", {
      ...options,
      color: options.color || COLORS.debug,
    });
  }

  public info(
    message: string | Error,
    options: Partial<LogOptions> = {}
  ): void {
    this.log(message, "info", {
      ...options,
      color: options.color || COLORS.info,
    });
  }

  public warn(
    message: string | Error,
    options: Partial<LogOptions> = {}
  ): void {
    this.log(message, "warn", {
      ...options,
      color: options.color || COLORS.warn,
    });
  }

  public error(
    message: string | Error,
    options: Partial<LogOptions> = {}
  ): void {
    this.log(message, "error", {
      ...options,
      color: options.color || COLORS.error,
    });
  }

  public success(message: string, options: Partial<LogOptions> = {}): void {
    this.info(message, { ...options, color: COLORS.success });
  }

  public group(label: string): void {
    if (this.shouldLog("debug")) {
      console.group(`%c${label}`, `color: ${COLORS.debug}; font-weight: bold`);
    }
  }

  public groupEnd(): void {
    if (this.shouldLog("debug")) {
      console.groupEnd();
    }
  }

  public child(name: string, options: Partial<LogOptions> = {}): Logger {
    return new Logger(`${this.name}.${name}`, this.level, {
      ...this.defaultOptions,
      ...options,
    });
  }

  public withDefaults(options: Partial<LogOptions>): Logger {
    return new Logger(this.name, this.level, {
      ...this.defaultOptions,
      ...options,
    });
  }
}

export const logger = new Logger("client", defaultLevel);

export const newLogger = (
  module: string,
  options?: Partial<LogOptions>
): Logger => {
  return logger.child(module, options);
};
