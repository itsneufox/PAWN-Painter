// PAWN color formats for testing

// Hex colors (0xRRGGBB and 0xRRGGBBAA)
const pawnHex6 = "0xFF0000"; // Red
const pawnHex8 = "0xFF0000FF"; // Red with full alpha
const pawnHexLower = "0xff0000"; // Lowercase hex
const pawnHexMixed = "0xFf0000"; // Mixed case

// Braced colors {RRGGBB}
const pawnBraced1 = "{FF0000}"; // Red
const pawnBraced2 = "{00FF00}"; // Green
const pawnBraced3 = "{0000FF}"; // Blue
const pawnBracedLower = "{ff0000}"; // Lowercase

// Decimal colors
const pawnDecimal1 = "4294901760"; // Red ARGB
const pawnDecimal2 = "16711680"; // Red RGB
const pawnDecimal3 = "255"; // Blue

// RGB colors (r, g, b)
const pawnRgb1 = "255, 0, 0"; // Red
const pawnRgb2 = "0, 255, 0"; // Green
const pawnRgb3 = "0, 0, 255"; // Blue
const pawnRgbSpaced = "255,128,64"; // Orange without spaces

// GameText colors
const gameTextRed = "~r~Hello";
const gameTextGreen = "~g~World";
const gameTextBlue = "~b~Test";
const gameTextYellow = "~y~Yellow";
const gameTextPurple = "~p~Purple";
const gameTextWhite = "~w~White";
const gameTextBlack = "~l~Black";
const gameTextSilver = "~s~Silver";

// GameText with light levels
const gameTextLight1 = "~r~~h~Light Red";
const gameTextLight2 = "~g~~h~~h~Very Light Green";
const gameTextLight3 = "~b~~h~~h~~h~Ultra Light Blue";

// Invalid colors that should NOT match
const notAColor1 = "0x12"; // Too short
const notAColor2 = "{12345}"; // Wrong length
const notAColor3 = "300, 400, 500"; // Out of RGB range
const notAColor4 = "123"; // Too short decimal
const notAColor5 = "~x~Invalid"; // Invalid GameText

// Mixed content
const mixedContent = `
  Player colors:
  Red: 0xFF0000FF
  Green: {00FF00}
  Blue: 255, 0, 0
  Yellow: 4294967040
  GameText: ~y~Warning message ~r~Error
`;
