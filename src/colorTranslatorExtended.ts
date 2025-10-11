import ColorTranslator from "color-translate";
import { getSetting } from "./utils/helpers";

export class PawnColorTranslator extends ColorTranslator {
  constructor(...input: ConstructorParameters<typeof ColorTranslator>) {
    const maxDigits = getSetting<number>("maxDigits");
    const [colorInput, options] = input;
    super(colorInput, { ...options, maxDigits });
  }

  // PAWN-specific color formats
  public get pawnHex(): string {
    const rgbColor = (this as any).rgb;
    const { r, g, b, alpha } = rgbColor;
    const hex = [r, g, b, Math.round((alpha ?? 1) * 255)]
      .map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    return `0x${hex}`;
  }

  public get pawnHexNoAlpha(): string {
    const rgbColor = (this as any).rgb;
    const { r, g, b } = rgbColor;
    const hex = [r, g, b]
      .map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    return `0x${hex}`;
  }

  public get pawnBraced(): string {
    const rgbColor = (this as any).rgb;
    const { r, g, b } = rgbColor;
    const hex = [r, g, b]
      .map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    return `{${hex}}`;
  }

  public get pawnDecimal(): string {
    const rgbColor = (this as any).rgb;
    const { r, g, b, alpha } = rgbColor;
    const rInt = Math.max(0, Math.min(255, Math.round(r)));
    const gInt = Math.max(0, Math.min(255, Math.round(g)));
    const bInt = Math.max(0, Math.min(255, Math.round(b)));
    const aInt = Math.max(0, Math.min(255, Math.round((alpha ?? 1) * 255)));
    
    // Use unsigned 32-bit arithmetic to prevent negative numbers
    const decimal = ((aInt << 24) | (rInt << 16) | (gInt << 8) | bInt) >>> 0;
    return decimal.toString();
  }

  public get pawnRgb(): string {
    const rgbColor = (this as any).rgb;
    const { r, g, b } = rgbColor;
    const rInt = Math.max(0, Math.min(255, Math.round(r)));
    const gInt = Math.max(0, Math.min(255, Math.round(g)));
    const bInt = Math.max(0, Math.min(255, Math.round(b)));
    return `${rInt}, ${gInt}, ${bInt}`;
  }
}
