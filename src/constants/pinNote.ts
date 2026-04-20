/**
 * XoloGlobe pin description stored as sanitized HTML in `pin_note`.
 * Min/max apply to plain text length (tags stripped). HTML is still sanitized on save.
 * Keep in sync with `server/handlers/user/pinned-nfts.ts` validation.
 */
export const PIN_NOTE_MAX_LENGTH = 350;
export const PIN_NOTE_MIN_LENGTH = 3;

/** TipTap CharacterCount limit — same budget as visible/plain text max. */
export const PIN_NOTE_EDITOR_TEXT_LIMIT = PIN_NOTE_MAX_LENGTH;
