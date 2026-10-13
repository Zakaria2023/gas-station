export * from "./dates";
export * from "./text";

/** What a Server Action hands back to a form. */
export type ActionResult = {
  success?: boolean;
  error?: string;
};

export const generateUuid = (): string => crypto.randomUUID();

/**
 * Turn a thrown value into the `{ error }` a form shows. A real Error keeps
 * its message, since services throw sentences meant for people; anything
 * else gets the fallback.
 */
export const fail = (error: unknown, fallback: string): { error: string } => {
  console.error(fallback, error);
  if (error instanceof Error && error.message && !isDatabaseError(error)) {
    return { error: error.message };
  }
  return { error: fallback };
};

const hasSqlState = (value: unknown): boolean =>
  typeof value === "object" &&
  value !== null &&
  "code" in value &&
  typeof (value as { code?: unknown }).code === "string" &&
  /^[0-9A-Z]{5}$/.test((value as { code: string }).code);

// A driver error's message is SQL, not a sentence for the person at the
// counter. Drizzle wraps the driver's error as the `cause` of its own.
const isDatabaseError = (error: Error): boolean =>
  hasSqlState(error) || hasSqlState(error.cause) || error.message.startsWith("Failed query");

/** Postgres' unique-violation code, for turning a duplicate into a readable error. */
export const isUniqueViolation = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (("code" in error && (error as { code?: unknown }).code === "23505") ||
    ("cause" in error && isUniqueViolation((error as { cause?: unknown }).cause)));
