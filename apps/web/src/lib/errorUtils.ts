/**
 * errorUtils.ts
 * Type-safe error message extraction for catch blocks.
 *
 * Replaces the unsafe `(error as Error).message` pattern throughout the codebase.
 * TypeScript 4.4+ sets catch variables to `unknown` in strict mode; this utility
 * handles all runtime shapes (Error, string, plain object, etc.) safely.
 */

/**
 * Extracts a human-readable message from any thrown value.
 * Safe to call with `unknown` — no type assertions needed at the call site.
 *
 * @example
 *   } catch (error) {
 *     setMessage(getErrorMessage(error));
 *   }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string" && error.length > 0) {
    return error;
  }
  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  ) {
    return (error as Record<string, unknown>).message as string;
  }
  return "An unexpected error occurred";
}

/**
 * Returns true when the thrown value is (or wraps) an Error with a message
 * that includes the given substring (case-insensitive).
 */
export function isErrorWithMessage(
  error: unknown,
  substring: string
): boolean {
  return getErrorMessage(error).toLowerCase().includes(substring.toLowerCase());
}
