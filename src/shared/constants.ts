// PAWN color regexes
export const pawnHexRegex = /0x([0-9a-fA-F]{6,8})/g;
export const pawnBracedRegex = /\{([0-9a-fA-F]{6})\}/g;
// Removed automatic decimal detection - will be handled manually via context menu
export const pawnRgbRegex = /(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})/g;
export const gameTextRegex = /~([rgbyplws])~((?:~h~)*)/g;

// GameText color mappings - Correct SA-MP colors from old PAWN Painter
export const gameTextColors = {
  'r': { r: 156, g: 23, b: 26 },    // Red
  'g': { r: 46, g: 89, b: 38 },     // Green
  'b': { r: 43, g: 51, b: 110 },    // Blue
  'y': { r: 196, g: 166, b: 87 },   // Yellow
  'p': { r: 145, g: 94, b: 217 },   // Purple
  'w': { r: 196, g: 196, b: 196 },  // White
  's': { r: 196, g: 196, b: 196 },  // Same as white
  'l': { r: 0, g: 0, b: 0 },        // Black
};