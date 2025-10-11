import chai from "chai";
import { PawnColorTranslator } from "../../src/colorTranslatorExtended";

suite("PAWN Color Translator Tests", () => {
  test("Converts RGB to PAWN hex format", () => {
    const color = new PawnColorTranslator({ r: 255, g: 0, b: 0, alpha: 1 });
    
    chai.assert.equal(color.pawnHex, "0xFF0000FF");
    chai.assert.equal(color.pawnHexNoAlpha, "0xFF0000");
  });

  test("Converts RGB to PAWN braced format", () => {
    const color = new PawnColorTranslator({ r: 255, g: 128, b: 64 });
    
    chai.assert.equal(color.pawnBraced, "{FF8040}");
  });

  test("Converts RGB to PAWN decimal format", () => {
    const color = new PawnColorTranslator({ r: 255, g: 0, b: 0, alpha: 1 });
    
    // ARGB: 0xFF FF 00 00 = 4294901760
    chai.assert.equal(color.pawnDecimal, "4294901760");
  });

  test("Converts RGB to PAWN RGB format", () => {
    const color = new PawnColorTranslator({ r: 255, g: 128, b: 64 });
    
    chai.assert.equal(color.pawnRgb, "255, 128, 64");
  });

  test("Handles alpha values correctly", () => {
    const color = new PawnColorTranslator({ r: 255, g: 0, b: 0, alpha: 0.5 });
    
    // Alpha 0.5 = 128 in 0-255 range
    chai.assert.equal(color.pawnHex, "0xFF000080");
    chai.assert.equal(color.pawnHexNoAlpha, "0xFF0000"); // No alpha
  });

  test("Handles edge cases", () => {
    // Black
    const black = new PawnColorTranslator({ r: 0, g: 0, b: 0, alpha: 1 });
    chai.assert.equal(black.pawnHex, "0x000000FF");
    chai.assert.equal(black.pawnBraced, "{000000}");
    chai.assert.equal(black.pawnRgb, "0, 0, 0");

    // White
    const white = new PawnColorTranslator({ r: 255, g: 255, b: 255, alpha: 1 });
    chai.assert.equal(white.pawnHex, "0xFFFFFFFF");
    chai.assert.equal(white.pawnBraced, "{FFFFFF}");
    chai.assert.equal(white.pawnRgb, "255, 255, 255");

    // Transparent
    const transparent = new PawnColorTranslator({ r: 255, g: 0, b: 0, alpha: 0 });
    chai.assert.equal(transparent.pawnHex, "0xFF000000");
  });

  test("Rounds decimal values correctly", () => {
    const color = new PawnColorTranslator({ r: 255.7, g: 127.3, b: 63.9, alpha: 0.501 });
    
    // Should round to nearest integer and clamp to valid range
    chai.assert.equal(color.pawnRgb, "255, 127, 64"); // 255.7 rounds to 256, but clamped to 255
    chai.assert.equal(color.pawnBraced, "{FF7F40}");
  });
});
