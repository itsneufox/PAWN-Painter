import * as vscode from "vscode";
import { Document } from "./models/Document";
import { pawnHexRegex, pawnBracedRegex, pawnRgbRegex, gameTextRegex, gameTextColors } from "./shared/constants";

type TextRange = { start: number; end: number };

function isTagPrefixedHex(text: string, hexStartIndex: number): boolean {
  const prefix = text.slice(0, hexStartIndex);
  return /[A-Za-z_][A-Za-z0-9_]*:\s*$/.test(prefix);
}

function getCommentRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let commentStart = -1;

  for (let i = 0; i < text.length; i++) {
    const current = text[i];
    const next = i + 1 < text.length ? text[i + 1] : "";

    if (inLineComment) {
      if (current === "\n") {
        ranges.push({ start: commentStart, end: i });
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (current === "*" && next === "/") {
        ranges.push({ start: commentStart, end: i + 2 });
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (current === "\\") {
        i++;
        continue;
      }
      if (current === "\"") {
        inString = false;
      }
      continue;
    }

    if (current === "\"") {
      inString = true;
      continue;
    }

    if (current === "/" && next === "/") {
      inLineComment = true;
      commentStart = i;
      i++;
      continue;
    }

    if (current === "/" && next === "*") {
      inBlockComment = true;
      commentStart = i;
      i++;
    }
  }

  if (inLineComment || inBlockComment) {
    ranges.push({ start: commentStart, end: text.length });
  }

  return ranges;
}

function isInRanges(index: number, ranges: TextRange[]): boolean {
  for (const range of ranges) {
    if (index >= range.start && index < range.end) {
      return true;
    }
  }
  return false;
}

export async function getMatches(
  text: string,
  offset: number = 0
): Promise<vscode.ColorInformation[]> {
  const result: vscode.ColorInformation[] = [];
  const currentTextDocument = new Document(text);
  const commentRanges = getCommentRanges(text);

  // PAWN Hex colors (0xRRGGBB or 0xRRGGBBAA)
  const hexMatches = [...text.matchAll(pawnHexRegex)];
  for (const match of hexMatches) {
    if (match.index !== undefined) {
      if (isInRanges(match.index, commentRanges)) {
        continue;
      }
      if (isTagPrefixedHex(text, match.index)) {
        continue;
      }

      const hex = match[1];
      let color: vscode.Color | null = null;
      
      if (hex.length === 6) {
        // 0xRRGGBB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        color = new vscode.Color(r / 255, g / 255, b / 255, 1);
      } else if (hex.length === 8) {
        // 0xRRGGBBAA
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const a = parseInt(hex.substr(6, 2), 16);
        color = new vscode.Color(r / 255, g / 255, b / 255, a / 255);
      }
      
      if (color) {
        const range = new vscode.Range(
          currentTextDocument.positionAt(match.index),
          currentTextDocument.positionAt(match.index + match[0].length)
        );
        result.push(new vscode.ColorInformation(range, color));
      }
    }
  }

  // PAWN Braced colors {RRGGBB}
  const bracedMatches = [...text.matchAll(pawnBracedRegex)];
  for (const match of bracedMatches) {
    if (match.index !== undefined) {
      if (isInRanges(match.index, commentRanges)) {
        continue;
      }
      const hex = match[1];
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const color = new vscode.Color(r / 255, g / 255, b / 255, 1);
      
      const range = new vscode.Range(
        currentTextDocument.positionAt(match.index),
        currentTextDocument.positionAt(match.index + match[0].length)
      );
      result.push(new vscode.ColorInformation(range, color));
    }
  }

  // PAWN Decimal colors - REMOVED automatic detection to prevent false positives
  // Decimal colors will be handled manually via right-click context menu

  // PAWN RGB colors (r, g, b)
  const rgbMatches = [...text.matchAll(pawnRgbRegex)];
  for (const match of rgbMatches) {
    if (match.index !== undefined) {
      if (isInRanges(match.index, commentRanges)) {
        continue;
      }
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      
      // Only consider valid RGB ranges
      if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
        const color = new vscode.Color(r / 255, g / 255, b / 255, 1);
        
        const range = new vscode.Range(
          currentTextDocument.positionAt(match.index),
          currentTextDocument.positionAt(match.index + match[0].length)
        );
        result.push(new vscode.ColorInformation(range, color));
      }
    }
  }

  return result;
}

export function getGameTextMatches(text: string): vscode.ColorInformation[] {
  const result: vscode.ColorInformation[] = [];
  const currentTextDocument = new Document(text);
  const commentRanges = getCommentRanges(text);

  const gameTextMatches = [...text.matchAll(gameTextRegex)];
  for (const match of gameTextMatches) {
    if (match.index !== undefined) {
      if (isInRanges(match.index, commentRanges)) {
        continue;
      }
      const colorChar = match[1].toLowerCase();
      const lightLevels = match[2] ? (match[2].match(/~h~/g) || []).length : 0;
      
      if (gameTextColors[colorChar as keyof typeof gameTextColors]) {
        const baseColor = gameTextColors[colorChar as keyof typeof gameTextColors];
        
        // Apply light levels (each ~h~ makes it lighter)
        let { r, g, b } = baseColor;
        for (let i = 0; i < lightLevels; i++) {
          r = Math.min(255, r + (255 - r) * 0.3);
          g = Math.min(255, g + (255 - g) * 0.3);
          b = Math.min(255, b + (255 - b) * 0.3);
        }
        
        const color = new vscode.Color(r / 255, g / 255, b / 255, 1);
        
        const range = new vscode.Range(
          currentTextDocument.positionAt(match.index),
          currentTextDocument.positionAt(match.index + match[0].length)
        );
        result.push(new vscode.ColorInformation(range, color));
      }
    }
  }

  return result;
}

export function getCustomMatches(text: string, languageId: string) {
  // For now, return empty array - can be extended later for custom PAWN regexes
  return [];
}
