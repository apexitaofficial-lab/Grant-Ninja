/**
 * Structured logging — AI_ENGINEERING_GUIDE.md §41.
 *
 * Emits JSON so logs stay searchable once they are shipped off the VPS.
 * Swap the sink here (Sentry, PostHog) without touching call sites.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  readonly feature?: string;
  readonly action?: string;
  readonly durationMs?: number;
  readonly [key: string]: unknown;
}

interface LogRecord extends LogContext {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const cause = (error as { cause?: unknown }).cause;

    return {
      errorName: error.name,
      errorMessage: error.message,
      // An AppError wraps the driver error as `cause`; without unwrapping it,
      // every database failure logs as the same generic message.
      ...(cause === undefined ? {} : { errorCause: serializeError(cause) }),
      ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
    };
  }

  // PostgrestError is a plain object, not an Error. `String()` on it yields
  // "[object Object]" and throws away the only useful diagnostic there is.
  if (typeof error === "object" && error !== null) {
    return { errorDetail: { ...(error as Record<string, unknown>) } };
  }

  return { errorValue: String(error) };
}

function write(level: LogLevel, message: string, context: LogContext = {}): void {
  const record: LogRecord = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  const line = JSON.stringify(record);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === "development") {
      write("debug", message, context);
    }
  },
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, error?: unknown, context?: LogContext) =>
    write("error", message, { ...context, ...serializeError(error) }),
};
