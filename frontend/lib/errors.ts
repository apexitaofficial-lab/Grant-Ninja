import { logger } from "@/lib/logger";

/**
 * Error strategy — AI_ENGINEERING_GUIDE.md §14/§40.
 *
 * Expected errors carry a message that is safe to show a user.
 * Unexpected errors are logged and replaced with a generic message so that
 * stack traces and database details never reach the browser.
 */

export type AppErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DEPENDENCY_FAILED"
  | "UNKNOWN";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly isExpected: boolean;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
    // Expected errors are safe to render; UNKNOWN never is.
    this.isExpected = code !== "UNKNOWN";
  }
}

export const notFound = (entity: string) =>
  new AppError("NOT_FOUND", `${entity} could not be found.`);

export const validationFailed = (message: string) => new AppError("VALIDATION_FAILED", message);

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

export interface ActionSuccess<T> {
  readonly ok: true;
  readonly data: T;
}

export interface ActionFailure {
  readonly ok: false;
  readonly code: AppErrorCode;
  readonly message: string;
}

/** Predictable return shape for every Server Action — §14. */
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function success<T>(data: T): ActionSuccess<T> {
  return { ok: true, data };
}

export function failure(code: AppErrorCode, message: string): ActionFailure {
  return { ok: false, code, message };
}

/**
 * Converts any thrown value into a safe `ActionFailure`, logging anything
 * that was not deliberately raised as an expected error.
 */
export function toActionFailure(error: unknown, context: { feature: string; action: string }) {
  if (error instanceof AppError && error.isExpected) {
    logger.warn(error.message, { ...context, code: error.code });
    return failure(error.code, error.message);
  }

  logger.error("Unhandled error", error, context);
  return failure("UNKNOWN", GENERIC_MESSAGE);
}
