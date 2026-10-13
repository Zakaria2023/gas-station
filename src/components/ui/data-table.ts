/**
 * The one look for a desktop table, shared so every list in the app reads the
 * same: a quiet header row, roomy cells, a hover on each row. Every column,
 * numbers included, lines up on the right — where an Arabic reader starts.
 */
export const TABLE_WRAP = "overflow-hidden rounded-card bg-surface shadow-card";
export const TABLE = "w-full border-collapse text-sm";
export const TABLE_HEAD_ROW = "border-b border-hairline bg-hover";
export const TH = "px-3 py-3 text-start text-xs font-bold text-muted";
export const TR = "border-b border-hairline-soft last:border-b-0 hover:bg-hover";
export const TD = "px-3 py-3 align-middle";
export const TD_NUMBER = `${TD} tabular`;
