/**
 * Translation of Zod issues into the API's field-error contract.
 *
 * `ApiErrorResponse.error.fields` (docs/ARCHITECTURE_RULES.md API2, E5) is a
 * flat `field -> message` map, which is also the shape the admin edit modal
 * renders against its inputs. Building it in one place keeps every endpoint's
 * `400` body identical.
 *
 * @module field-errors
 */

import type { z } from "zod";

/**
 * Field name used for issues that belong to the payload as a whole rather than
 * to one of its fields — a body that is not an object at all, for instance.
 * Zod reports those with an empty path, which would otherwise produce a
 * nameless `""` key.
 */
const ROOT_FIELD = "body";

/**
 * Flatten a `ZodError` into a `field -> message` map.
 *
 * When several issues name the same field only the last is kept: the map is a
 * UI contract (one message per input), not a diagnostic log.
 */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    fields[path.length > 0 ? path : ROOT_FIELD] = issue.message;
  }

  return fields;
}
