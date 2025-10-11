export enum PawnColorFormatFrom {
  PAWN_HEX = "hex0x",
  PAWN_BRACED = "braced",
  PAWN_DECIMAL = "decimal",
  PAWN_RGB = "rgb",
  GAMETEXT = "gametext",
}

export enum PawnColorFormatTo {
  PAWN_HEX = "pawnHex",
  PAWN_HEX_NO_ALPHA = "pawnHexNoAlpha", 
  PAWN_BRACED = "pawnBraced",
  PAWN_DECIMAL = "pawnDecimal",
  PAWN_RGB = "pawnRgb",
}

export enum CommandType {
  FILE = "File",
  LINE = "Line",
  SELECTION = "Selection",
}