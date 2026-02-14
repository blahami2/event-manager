/**
 * RFC 5545 compliant iCalendar (.ics) generator for event email attachments.
 *
 * @module ics-generator
 */

export interface IcsEventParams {
  readonly eventName: string;
  readonly eventDate: Date;
  readonly eventEndDate: Date;
  readonly eventLocation: string;
  readonly eventDescription: string;
  readonly organizerEmail: string;
}

/**
 * Escape text values per RFC 5545 §3.3.11.
 * Backslashes, semicolons, commas and newlines must be escaped.
 */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Fold content lines to a maximum of 75 octets per RFC 5545 §3.1.
 * Continuation lines start with a single space character.
 * Uses CRLF line endings as required by the spec.
 */
export function foldLine(line: string): string {
  const MAX_OCTETS = 75;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);

  if (bytes.length <= MAX_OCTETS) {
    return line;
  }

  const parts: string[] = [];
  let offset = 0;

  // First line: up to 75 octets
  // Subsequent lines: " " (1 octet) + up to 74 octets of content
  let currentMax = MAX_OCTETS;
  while (offset < bytes.length) {
    // We need to cut at a valid UTF-8 boundary. Walk back from max if needed.
    let end = Math.min(offset + currentMax, bytes.length);
    // Avoid splitting a multi-byte UTF-8 sequence: continuation bytes start with 10xxxxxx
    while (end < bytes.length && end > offset && ((bytes[end] ?? 0) & 0xc0) === 0x80) {
      end--;
    }
    const chunk = new TextDecoder().decode(bytes.slice(offset, end));
    parts.push(chunk);
    offset = end;
    currentMax = MAX_OCTETS - 1; // account for leading space on continuation lines
  }

  return parts.join("\r\n ");
}

/** Format a Date as an iCalendar UTC datetime string (YYYYMMDDTHHmmssZ). */
function formatDateUtc(date: Date): string {
  const pad = (n: number): string => n.toString().padStart(2, "0");
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Generate an RFC 5545 compliant iCalendar string for a single event.
 *
 * The output uses CRLF line endings and applies line folding as required.
 * Suitable for use as an email attachment with content type `text/calendar`.
 */
export function generateIcsEvent(params: IcsEventParams): string {
  const {
    eventName,
    eventDate,
    eventEndDate,
    eventLocation,
    eventDescription,
    organizerEmail,
  } = params;

  const uid = `${crypto.randomUUID()}@eventmanager.app`;
  const now = formatDateUtc(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Event Manager//Event Calendar//EN",
    "METHOD:REQUEST",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatDateUtc(eventDate)}`,
    `DTEND:${formatDateUtc(eventEndDate)}`,
    `SUMMARY:${escapeIcsText(eventName)}`,
    `LOCATION:${escapeIcsText(eventLocation)}`,
    `DESCRIPTION:${escapeIcsText(eventDescription)}`,
    `ORGANIZER:mailto:${organizerEmail}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
