import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Repository foundation — AI_ENGINEERING_GUIDE.md §18/§37.
 *
 * Repositories are the only layer that knows Supabase exists. They translate
 * driver errors into `AppError` and contain no business rules; those belong to
 * the service layer (§38).
 */

export interface PaginationInput {
  readonly page: number;
  readonly pageSize: number;
}

export interface Paginated<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
}

/** Postgres "no rows returned" from `.single()`. */
const NO_ROWS_CODE = "PGRST116";

export abstract class BaseRepository {
  protected abstract readonly entityName: string;

  /**
   * Unwraps a Supabase result, logging and rethrowing failures so no caller
   * can silently receive `null` for a real database error (§67).
   */
  protected unwrap<T>(
    result: { data: T | null; error: PostgrestError | null },
    operation: string,
  ): T {
    if (result.error) {
      throw this.toAppError(result.error, operation);
    }

    if (result.data === null) {
      throw new AppError("NOT_FOUND", `${this.entityName} could not be found.`);
    }

    return result.data;
  }

  /** Same as `unwrap`, but a missing row is a legitimate `null` result. */
  protected unwrapMaybe<T>(
    result: { data: T | null; error: PostgrestError | null },
    operation: string,
  ): T | null {
    if (result.error) {
      if (result.error.code === NO_ROWS_CODE) {
        return null;
      }

      throw this.toAppError(result.error, operation);
    }

    return result.data;
  }

  /** Converts `page`/`pageSize` into the inclusive range Supabase expects. */
  protected toRange({ page, pageSize }: PaginationInput): { from: number; to: number } {
    const safePage = Math.max(1, Math.trunc(page));
    const safePageSize = Math.max(1, Math.trunc(pageSize));
    const from = (safePage - 1) * safePageSize;

    return { from, to: from + safePageSize - 1 };
  }

  protected toPaginated<T>(
    items: readonly T[],
    total: number,
    { page, pageSize }: PaginationInput,
  ): Paginated<T> {
    return {
      items,
      total,
      page,
      pageSize,
      pageCount: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  }

  private toAppError(error: PostgrestError, operation: string): AppError {
    logger.error(`${this.entityName}.${operation} failed`, error, {
      feature: "repository",
      action: operation,
      entity: this.entityName,
      postgrestCode: error.code,
    });

    return new AppError("DEPENDENCY_FAILED", "A database error occurred.", { cause: error });
  }
}
