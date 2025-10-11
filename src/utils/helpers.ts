import { PawnColorTranslator } from "../colorTranslatorExtended";
import * as vscode from "vscode";

export function parseColorString(initialColour: string | any) {
  try {
    let colour: PawnColorTranslator;
    if (typeof initialColour === "string") {
      const colourLowerCase = initialColour.toLowerCase();
      colour = new PawnColorTranslator(colourLowerCase);
    } else {
      colour = new PawnColorTranslator(initialColour);
    }
    const { r, g, b, alpha } = (colour as any).rgb;
    return new vscode.Color(r / 255, g / 255, b / 255, alpha ?? 1);
  } catch (error) {
    return null;
  }
}

export function isValidDocument(document: vscode.TextDocument) {
  const disable = getSetting<boolean>("disable");
  if (disable) {
    return false;
  }

  return document.languageId === 'pawn' || ['.pwn', '.inc', '.p', '.pawno'].some(ext => 
    document.fileName.endsWith(ext)
  );
}

export function isSettingEnabled(
  settings: string[],
  target: string,
  target2?: string
) {
  let isValid = false;

  if (settings.includes("*")) {
    isValid = true;
  }
  if (settings.includes(target)) {
    isValid = true;
  }
  if (settings.includes(`!${target}`)) {
    isValid = false;
  }
  if (target2 && settings.includes(`${target}:${target2}`)) {
    isValid = true;
  }
  if (target2 && settings.includes(`!${target}:${target2}`)) {
    isValid = false;
  }

  return isValid;
}

export function getSetting<T>(setting: string) {
  return vscode.workspace
    .getConfiguration("pawn-painter")
    .get<T>(setting);
}

export function parseGameTextColour(colourChar: string, lightLevels: number = 0): vscode.Color | null {
  const gameTextColours = {
    'r': { r: 255, g: 0, b: 0 },
    'g': { r: 0, g: 255, b: 0 },
    'b': { r: 0, g: 0, b: 255 },
    'y': { r: 255, g: 255, b: 0 },
    'p': { r: 255, g: 0, b: 255 },
    'l': { r: 0, g: 0, b: 0 },
    'w': { r: 255, g: 255, b: 255 },
    's': { r: 128, g: 128, b: 128 },
  };

  const baseColour = gameTextColours[colourChar.toLowerCase() as keyof typeof gameTextColours];
  if (!baseColour) return null;

  let { r, g, b } = baseColour;
  for (let i = 0; i < lightLevels; i++) {
    r = Math.min(255, r + (255 - r) * 0.3);
    g = Math.min(255, g + (255 - g) * 0.3);
    b = Math.min(255, b + (255 - b) * 0.3);
  }

  return new vscode.Color(r / 255, g / 255, b / 255, 1);
}

export function isPawnGameTextColour(text: string): boolean {
  return /~[rgbyplws]~(?:~h~)*/.test(text);
}