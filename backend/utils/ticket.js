import { randomBytes } from "crypto";

/** Human-readable ticket id: VC-XXXXXX (uppercase hex) */
export function generateTicketId() {
  return `VC-${randomBytes(3).toString("hex").toUpperCase()}`;
}
