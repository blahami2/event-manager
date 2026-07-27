import { NextRequest } from "next/server";

import { ValidationError } from "@/lib/errors/app-errors";

/**
 * Read a JSON request body without letting a malformed one escape as a `500`.
 *
 * A body that is not valid JSON is a client error, so it is surfaced as the
 * same structured `400` as any other invalid payload (E5) rather than as an
 * unexpected internal error. The offending input is reported under the `body`
 * key, which no route treats as a form field — the admin UI deliberately skips
 * it when deciding what to highlight, because it signals a client bug rather
 * than something a user can correct.
 *
 * Shared by every admin mutation route so the malformed-payload contract cannot
 * drift between them.
 *
 * @throws {ValidationError} when the body is not parseable as JSON
 */
export async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new ValidationError("Validation failed", {
      body: "Request body must be valid JSON",
    });
  }
}
