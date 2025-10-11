import * as vscode from "vscode";
import { getSetting } from "../utils/helpers";
import { gameTextColors } from "../shared/constants";
import { IgnoredLinesManager } from "../utils/ignoredLines";
import { t } from '../i18n';
import { ColorProvider } from './colorProvider';

export class GameTextProvider implements vscode.Disposable {
  private decorations = new Map<string, vscode.TextEditorDecorationType>();
  private gameTextWarningDecoration: vscode.TextEditorDecorationType;
  private disposables: vscode.Disposable[] = [];
  private ignoredLinesManager?: IgnoredLinesManager;
  private colorProvider?: ColorProvider;
  private allDecorationRanges = new Map<string, Map<string, vscode.Range[]>>(); // documentUri -> decorationKey -> ranges

  constructor(ignoredLinesManager?: IgnoredLinesManager, colorProvider?: ColorProvider) {
    this.ignoredLinesManager = ignoredLinesManager;
    this.colorProvider = colorProvider;
    
    this.gameTextWarningDecoration = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: '', // Will be set dynamically
        color: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        border: '1px solid rgba(255, 107, 107, 0.5)',
        margin: '0 0 0 10px'
      }
    });
    
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && this.isPawnFile(editor.document)) {
          this.updateDecorations(editor);
        }
      }),
      
      vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document && this.isPawnFile(editor.document)) {
          // Clear cache when document changes
          this.allDecorationRanges.delete(event.document.uri.toString());
          setTimeout(() => this.updateDecorations(editor), 100);
        }
      })
    );
  }

  private isPawnFile(document: vscode.TextDocument): boolean {
    return document.languageId === 'pawn' || 
           ['.pwn', '.inc', '.p', '.pawno'].some(ext => document.fileName.endsWith(ext));
  }


  public updateDecorations(editor: vscode.TextEditor) {
    if (!editor || !this.isPawnFile(editor.document)) return;
    
    if (getSetting<boolean>("disable")) return;
    
    this.clearDecorations(editor);
    
    const documentUri = editor.document.uri.toString();
    const globalDecorationRanges = new Map<string, vscode.Range[]>();
    const priorityRanges: vscode.Range[] = []; // Ranges that should not be overridden by hex parameters
    
    // Get the last line with color decorators for coordination
    const lastDecoratorLine = this.colorProvider?.getLastDecoratorLine(documentUri) ?? -1;
    
    // First, add GameText and inline decorations (higher priority)
    if (getSetting<boolean>("gameText.textEnabled")) {
      this.addGameTextDecorations(editor, globalDecorationRanges, priorityRanges, lastDecoratorLine);
    }
    
    if (getSetting<boolean>("inlineText.textEnabled")) {
      this.addInlineTextDecorations(editor, globalDecorationRanges, priorityRanges, lastDecoratorLine);
    }
    
    // Then add hex parameter decorations (lower priority, must avoid priority ranges)
    if (getSetting<boolean>("hexParameter.textEnabled")) {
      this.addHexParameterDecorations(editor, globalDecorationRanges, priorityRanges, lastDecoratorLine);
    }
    
    // Cache all decoration ranges for this document
    this.allDecorationRanges.set(documentUri, globalDecorationRanges);
    
    // Apply all decorations normally
    this.applyAllDecorations(editor, globalDecorationRanges);
  }

  private addHexColorDecorations(editor: vscode.TextEditor, globalDecorationRanges: Map<string, vscode.Range[]>) {
    const text = editor.document.getText();
    const hexStyle = getSetting<string>("hex.style") || "underline";
    
    const hexPattern = /\b0x[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?\b/g;
    
    let match;
    while ((match = hexPattern.exec(text)) !== null) {
      const hex = match[0];
      
      const startPos = editor.document.positionAt(match.index);
      if (this.ignoredLinesManager?.isLineIgnored(editor.document, startPos.line)) {
        continue;
      }
      
      const hexValue = hex.substring(2);
      const r = parseInt(hexValue.substr(0, 2), 16);
      const g = parseInt(hexValue.substr(2, 2), 16);
      const b = parseInt(hexValue.substr(4, 2), 16);
      const a = hexValue.length === 8 ? parseInt(hexValue.substr(6, 2), 16) : 255;
      
      const color = new vscode.Color(r / 255, g / 255, b / 255, a / 255);
      
      const endPos = editor.document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);
      
      const colourRgba = `${Math.round(color.red * 255)}_${Math.round(color.green * 255)}_${Math.round(color.blue * 255)}_${Math.round(color.alpha * 255)}`;
      const sharedDecorationKey = `hex_${colourRgba}_${hexStyle}`;
      
      if (!this.decorations.has(sharedDecorationKey)) {
        this.decorations.set(sharedDecorationKey, vscode.window.createTextEditorDecorationType(
          this.createDecorationStyle(color, hexStyle)
        ));
      }

      if (!globalDecorationRanges.has(sharedDecorationKey)) {
        globalDecorationRanges.set(sharedDecorationKey, []);
      }
      globalDecorationRanges.get(sharedDecorationKey)!.push(range);
    }
  }

  private addInlineColorCodeDecorations(editor: vscode.TextEditor, globalDecorationRanges: Map<string, vscode.Range[]>) {
    const text = editor.document.getText();
    const codeStyle = getSetting<string>("inlineText.codeStyle") || "underline";
    
    // Match braced colors like {RRGGBB} within string literals
    const bracedPattern = /\{[0-9a-fA-F]{6}\}/g;
    
    let match;
    while ((match = bracedPattern.exec(text)) !== null) {
      const braced = match[0];
      
      // Check if this line is ignored
      const startPos = editor.document.positionAt(match.index);
      if (this.ignoredLinesManager?.isLineIgnored(editor.document, startPos.line)) {
        continue;
      }
      
      // Parse color
      const hexValue = braced.substring(1, 7); // Remove { and }
      const r = parseInt(hexValue.substr(0, 2), 16);
      const g = parseInt(hexValue.substr(2, 2), 16);
      const b = parseInt(hexValue.substr(4, 2), 16);
      
      const color = new vscode.Color(r / 255, g / 255, b / 255, 1);
      
      const endPos = editor.document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);
      
      // Create decoration key
      const colorRgba = `${Math.round(color.red * 255)}_${Math.round(color.green * 255)}_${Math.round(color.blue * 255)}_${Math.round(color.alpha * 255)}`;
      const sharedDecorationKey = `braced_${colorRgba}_${codeStyle}`;
      
      if (!this.decorations.has(sharedDecorationKey)) {
        this.decorations.set(sharedDecorationKey, vscode.window.createTextEditorDecorationType(
          this.createDecorationStyle(color, codeStyle)
        ));
      }

      if (!globalDecorationRanges.has(sharedDecorationKey)) {
        globalDecorationRanges.set(sharedDecorationKey, []);
      }
      globalDecorationRanges.get(sharedDecorationKey)!.push(range);
    }
  }

  private addGameTextDecorations(editor: vscode.TextEditor, globalDecorationRanges: Map<string, vscode.Range[]>, priorityRanges: vscode.Range[], lastDecoratorLine: number = -1) {
    const text = editor.document.getText();
    const textEnabled = getSetting<boolean>("gameText.textEnabled") ?? true;
    const textStyle = getSetting<string>("gameText.textStyle") || "text";
    
    // For consistency with braced colors: only color the following text, not the codes themselves
    if (!textEnabled) {
      return; // No decorations if text coloring is disabled
    }
    
    // Check for GameText crash warnings
    this.checkGameTextWarnings(editor);
    
    // Create a new regex instance each time to avoid global state issues
    const gameTextPattern = /~([rgbyplws])~((?:~h~)*)/g;
    
    let match;
    while ((match = gameTextPattern.exec(text)) !== null) {
      const colorChar = match[1].toLowerCase();
      const lightPart = match[2] || "";
      const lightLevels = lightPart ? (lightPart.match(/~h~/g) || []).length : 0;
      
      const color = this.getGameTextColor(colorChar, lightLevels);
      if (!color) continue;

      // Only color the following text (for consistency with braced colors)
      const textRange = this.findGameTextFollowingText(editor, match.index + match[0].length);
      if (textRange) {
        // Check if this line is ignored
        if (this.ignoredLinesManager?.isLineIgnored(editor.document, textRange.start.line)) {
          continue;
        }
        
        // Skip if line is beyond the last color decorator line (for coordination)
        if (lastDecoratorLine >= 0 && textRange.start.line > lastDecoratorLine) {
          continue;
        }
        // Use shared decoration key based on color and style to avoid conflicts
        const colorRgba = `${Math.round(color.red * 255)}_${Math.round(color.green * 255)}_${Math.round(color.blue * 255)}_${Math.round(color.alpha * 255)}`;
        const sharedDecorationKey = `text_${colorRgba}_${textStyle}`;
        
        if (!this.decorations.has(sharedDecorationKey)) {
          this.decorations.set(sharedDecorationKey, vscode.window.createTextEditorDecorationType(
            this.createDecorationStyle(color, textStyle)
          ));
        }

        if (!globalDecorationRanges.has(sharedDecorationKey)) {
          globalDecorationRanges.set(sharedDecorationKey, []);
        }
        globalDecorationRanges.get(sharedDecorationKey)!.push(textRange);
        
        // Add to priority ranges to prevent hex parameter override
        priorityRanges.push(textRange);
      }
    }
  }

  private addInlineTextDecorations(editor: vscode.TextEditor, globalDecorationRanges: Map<string, vscode.Range[]>, priorityRanges: vscode.Range[], lastDecoratorLine: number = -1) {
    const text = editor.document.getText();
    const textStyle = getSetting<string>("inlineText.textStyle") || "text";
    
    // Look for braced colors INSIDE string literals only
    // Pattern: "...{RRGGBB}text..." (direct hex colors only, no macro expansion)
    // Be very restrictive: only match strings that start and end on the same logical line
    // This prevents matching across unrelated code spans
    const stringWithInlineColorsPattern = /"[^"\n\r]*\{[0-9a-fA-F]{6}\}[^"\n\r]*"/g;
    
    let stringMatch;
    while ((stringMatch = stringWithInlineColorsPattern.exec(text)) !== null) {
      // Within this string, find all braced colors and their following text
      const stringContent = stringMatch[0];
      const stringStartIndex = stringMatch.index;
      
      // Match only direct hex colors {RRGGBB} - no macro expansion
      const inlineColorPattern = /\{([0-9a-fA-F]{6})\}/g;
      let colorMatch;
      
      while ((colorMatch = inlineColorPattern.exec(stringContent)) !== null) {
        const hexColor = colorMatch[1];
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);
        const color = new vscode.Color(r / 255, g / 255, b / 255, 1);
        const colorKey = hexColor;
        
        // Find the text following this braced color within the string
        const colorEndIndex = stringStartIndex + colorMatch.index + colorMatch[0].length;
        const textRange = this.findInlineTextWithinString(editor, colorEndIndex, stringStartIndex + stringContent.length - 1); // -1 to exclude closing quote
        
        if (textRange) {
          // Check if this line is ignored
          if (this.ignoredLinesManager?.isLineIgnored(editor.document, textRange.start.line)) {
            continue;
          }
          
          // Skip if line is beyond the last color decorator line (for coordination)
          if (lastDecoratorLine >= 0 && textRange.start.line > lastDecoratorLine) {
            continue;
          }
          
          // Use shared decoration key based on color and style to avoid conflicts
          const colorRgba = `${Math.round(color.red * 255)}_${Math.round(color.green * 255)}_${Math.round(color.blue * 255)}_${Math.round(color.alpha * 255)}`;
          const sharedDecorationKey = `text_${colorRgba}_${textStyle}`;
          
          if (!this.decorations.has(sharedDecorationKey)) {
            this.decorations.set(sharedDecorationKey, vscode.window.createTextEditorDecorationType(
              this.createDecorationStyle(color, textStyle)
            ));
          }

          if (!globalDecorationRanges.has(sharedDecorationKey)) {
            globalDecorationRanges.set(sharedDecorationKey, []);
          }
          globalDecorationRanges.get(sharedDecorationKey)!.push(textRange);
          
          // Add to priority ranges to prevent hex parameter override
          priorityRanges.push(textRange);
        }
      }
    }
  }

  private addHexParameterDecorations(editor: vscode.TextEditor, globalDecorationRanges: Map<string, vscode.Range[]>, priorityRanges: vscode.Range[], lastDecoratorLine: number = -1) {
    const text = editor.document.getText();
    const textStyle = getSetting<string>("hexParameter.textStyle") || "text";
    
    // Look for patterns like: AnyFunction(param, 0xFF0000FF, "string")
    // The hex color should color the following string literal
    // More robust approach: any function with hex parameter followed by string
    // Handle nested parentheses and proper string parsing
    const hexParameterPattern = /\b(\w+)\s*\([^"]*?(0x[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)\s*,\s*"((?:[^"\\]|\\.)*)"/g;
    
    let match;
    while ((match = hexParameterPattern.exec(text)) !== null) {
      const functionName = match[1];
      const hexColor = match[2];
      const stringContent = match[3];
      
      // Parse hex color (handle both 0xRRGGBB and 0xRRGGBBAA)
      let hex = hexColor.substring(2); // Remove 0x prefix
      let r, g, b, a;
      
      if (hex.length === 6) {
        r = parseInt(hex.substr(0, 2), 16);
        g = parseInt(hex.substr(2, 2), 16);
        b = parseInt(hex.substr(4, 2), 16);
        a = 255; // Default alpha for 6-char hex
      } else if (hex.length === 8) {
        r = parseInt(hex.substr(0, 2), 16);
        g = parseInt(hex.substr(2, 2), 16);
        b = parseInt(hex.substr(4, 2), 16);
        a = parseInt(hex.substr(6, 2), 16); // Parse alpha channel
      } else {
        continue;
      }
      
      const color = new vscode.Color(r / 255, g / 255, b / 255, a / 255);
      
      // Find the string literal position
      const stringStart = match.index + match[0].indexOf('"') + 1;
      const stringEnd = stringStart + stringContent.length;
      
      if (stringContent.trim().length > 0) {
        const startPos = editor.document.positionAt(stringStart);
        const endPos = editor.document.positionAt(stringEnd);
        const range = new vscode.Range(startPos, endPos);
        
        // Check if this line is ignored
        if (this.ignoredLinesManager?.isLineIgnored(editor.document, startPos.line)) {
          continue;
        }
        
        // Skip if line is beyond the last color decorator line (for coordination)
        if (lastDecoratorLine >= 0 && startPos.line > lastDecoratorLine) {
          continue;
        }
        
        // Use shared decoration key based on color and style to avoid conflicts with inline text
        const colorRgba = `${Math.round(color.red * 255)}_${Math.round(color.green * 255)}_${Math.round(color.blue * 255)}_${Math.round(color.alpha * 255)}`;
        const sharedDecorationKey = `text_${colorRgba}_${textStyle}`;
        
        if (!this.decorations.has(sharedDecorationKey)) {
          this.decorations.set(sharedDecorationKey, vscode.window.createTextEditorDecorationType(
            this.createDecorationStyle(color, textStyle)
          ));
        }
        
        // Check if this string contains GameText codes or inline braced colors
        // If it does, skip hex parameter coloring entirely for this string
        const hasGameTextCodes = /~[rgbyplws]~(?:~h~)*/.test(stringContent);
        const hasInlineColors = /\{[0-9a-fA-F]{6}\}/.test(stringContent);
        
        if (!hasGameTextCodes && !hasInlineColors) {
          if (!globalDecorationRanges.has(sharedDecorationKey)) {
            globalDecorationRanges.set(sharedDecorationKey, []);
          }
          globalDecorationRanges.get(sharedDecorationKey)!.push(range);
        }
      }
    }
  }

  private rangesOverlap(range1: vscode.Range, range2: vscode.Range): boolean {
    // Check if two ranges overlap
    return !(range1.end.isBefore(range2.start) || range2.end.isBefore(range1.start));
  }

  private findInlineTextWithinString(editor: vscode.TextEditor, startIndex: number, stringEndIndex: number): vscode.Range | null {
    const text = editor.document.getText();
    
    // Find the text between this braced color and the next braced color, GameText code, or end of string
    const remainingText = text.substring(startIndex, stringEndIndex);
    const nextColorMatch = remainingText.match(/\{[0-9a-fA-F]{6}\}|~[rgbyplws]~/);
    
    let endIndex = stringEndIndex;
    if (nextColorMatch) {
      endIndex = startIndex + nextColorMatch.index!;
    }
    
    // Skip whitespace at the beginning
    let actualStartIndex = startIndex;
    while (actualStartIndex < endIndex && /\s/.test(text[actualStartIndex])) {
      actualStartIndex++;
    }
    
    // Skip whitespace at the end
    let actualEndIndex = endIndex;
    while (actualEndIndex > actualStartIndex && /\s/.test(text[actualEndIndex - 1])) {
      actualEndIndex--;
    }
    
    if (actualStartIndex >= actualEndIndex) {
      return null; // No actual text content
    }
    
    const startPos = editor.document.positionAt(actualStartIndex);
    const endPos = editor.document.positionAt(actualEndIndex);
    
    return new vscode.Range(startPos, endPos);
  }

  private findGameTextFollowingText(editor: vscode.TextEditor, startIndex: number): vscode.Range | null {
    const text = editor.document.getText();
    
    // Find the text between this GameText code and the next GameText code, braced color, or delimiter
    const nextGameTextMatch = text.substring(startIndex).match(/~[rgbyplws]~|\{[0-9a-fA-F]{6}\}|"|;|\n|\r/);
    
    if (!nextGameTextMatch) {
      // No next GameText code found, take text until end of line
      const startPos = editor.document.positionAt(startIndex);
      const line = editor.document.lineAt(startPos.line);
      const textEnd = line.range.end;
      
      if (startPos.character < textEnd.character) {
        return new vscode.Range(startPos, textEnd);
      }
      return null;
    }
    
    const endIndex = startIndex + nextGameTextMatch.index!;
    
    // Skip whitespace at the beginning
    let actualStartIndex = startIndex;
    while (actualStartIndex < endIndex && /\s/.test(text[actualStartIndex])) {
      actualStartIndex++;
    }
    
    // Skip whitespace at the end
    let actualEndIndex = endIndex;
    while (actualEndIndex > actualStartIndex && /\s/.test(text[actualEndIndex - 1])) {
      actualEndIndex--;
    }
    
    if (actualStartIndex >= actualEndIndex) {
      return null; // No actual text content
    }
    
    const startPos = editor.document.positionAt(actualStartIndex);
    const endPos = editor.document.positionAt(actualEndIndex);
    
    return new vscode.Range(startPos, endPos);
  }

  private getGameTextColor(colorChar: string, lightLevels: number): vscode.Color | null {
    const baseColor = gameTextColors[colorChar as keyof typeof gameTextColors];
    if (!baseColor) return null;

    // Define maximum light levels per color (based on open.mp documentation)
    const maxLightLevels: { [key: string]: number } = {
      'r': 5,  // Red: 5 levels
      'g': 4,  // Green: 4 levels  
      'b': 3,  // Blue: 3 levels
      'p': 2,  // Purple: 2 levels
      'y': 2,  // Yellow: 2 levels
      'w': 1,  // White: 1 level
      's': 1,  // Grey: 1 level
      'l': 0   // Black: cannot be lightened
    };

    // Limit light levels to the maximum for this color
    const maxLevels = maxLightLevels[colorChar.toLowerCase()] || 0;
    const effectiveLightLevels = Math.min(lightLevels, maxLevels);

    // Apply light levels (each ~h~ makes it lighter)
    let { r, g, b } = baseColor;
    for (let i = 0; i < effectiveLightLevels; i++) {
      r = Math.min(255, r + (255 - r) * 0.3);
      g = Math.min(255, g + (255 - g) * 0.3);
      b = Math.min(255, b + (255 - b) * 0.3);
    }

    return new vscode.Color(r / 255, g / 255, b / 255, 1);
  }

  private checkGameTextWarnings(editor: vscode.TextEditor) {
    const text = editor.document.getText();
    const warningRanges: vscode.Range[] = [];
    const processedLines = new Set<number>();

    // Find GameText function calls specifically (GameTextForAll, GameTextForPlayer)
    const gameTextFunctionPattern = /\b(GameText(?:ForAll|ForPlayer))\s*\([^"]*"([^"\n\r]*)"/g;
    let functionMatch;

    while ((functionMatch = gameTextFunctionPattern.exec(text)) !== null) {
      const functionName = functionMatch[1];
      const stringContent = functionMatch[2];
      const stringStart = functionMatch.index;
      const lineStart = editor.document.positionAt(stringStart).line;

      // Skip if this line was already processed
      if (processedLines.has(lineStart)) {
        continue;
      }

      let hasWarning = false;

      // Check for uneven tilde usage (odd number of tildes) - crash risk in GameText functions
      const tildeCount = (stringContent.match(/~/g) || []).length;
      if (tildeCount > 0 && tildeCount % 2 !== 0) {
        hasWarning = true;
      }

      if (hasWarning) {
        // Check if this line is ignored
        if (this.ignoredLinesManager?.isLineIgnored(editor.document, lineStart)) {
          continue;
        }

        const lineEnd = editor.document.lineAt(lineStart).range.end;
        const warningRange = new vscode.Range(lineEnd, lineEnd);
        warningRanges.push(warningRange);
        processedLines.add(lineStart);
      }
    }

    // Create decoration with current translation
    const currentGameTextWarningDecoration = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: t('warnings.unevenTildes'),
        color: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        border: '1px solid rgba(255, 107, 107, 0.5)',
        margin: '0 0 0 10px'
      }
    });
    
    // Dispose previous decoration if it exists
    this.gameTextWarningDecoration.dispose();
    this.gameTextWarningDecoration = currentGameTextWarningDecoration;
    
    editor.setDecorations(this.gameTextWarningDecoration, warningRanges);
  }

  private createDecorationStyle(color: vscode.Color, style: string): vscode.DecorationRenderOptions {
    // Ensure minimum alpha for readability - never go below 0.3 (30%)
    const minAlpha = 0.3;
    const alpha = Math.max(color.alpha, minAlpha);
    const colorRgba = `rgba(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)}, ${alpha})`;

    switch (style) {
      case 'text':
        return { 
          color: colorRgba,
          fontWeight: 'bold'
        };
      case 'underline':
        return { 
          textDecoration: `none; border-bottom: 2px solid ${colorRgba}`,
          fontWeight: 'bold'
        };
      case 'background':
        return { 
          backgroundColor: `rgba(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)}, 0.2)`,
          border: `1px solid ${colorRgba}`,
          borderRadius: '3px'
        };
      default:
        return { 
          color: colorRgba,
          fontWeight: 'bold'
        };
    }
  }

  private clearDecorations(editor: vscode.TextEditor) {
    this.decorations.forEach(decoration => {
      editor.setDecorations(decoration, []);
    });
    editor.setDecorations(this.gameTextWarningDecoration, []);
  }

  /**
   * Apply all decorations
   */
  private applyAllDecorations(editor: vscode.TextEditor, decorationRanges: Map<string, vscode.Range[]>): void {
    const decorationEntries = Array.from(decorationRanges.entries());
    for (const [decorationKey, ranges] of decorationEntries) {
      const decoration = this.decorations.get(decorationKey);
      if (decoration && ranges.length > 0) {
        const validRanges = ranges.filter(range => range && !range.isEmpty);
        if (validRanges.length > 0) {
          editor.setDecorations(decoration, validRanges);
        }
      }
    }
  }




  /**
   * Simple refresh method - just clear cache and update decorations
   */
  public async refreshTextDecorations(): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || !activeEditor.document) return;
    
    // Clear cache and update
    const documentUri = activeEditor.document.uri.toString();
    this.allDecorationRanges.delete(documentUri);
    this.updateDecorations(activeEditor);
    
    vscode.window.showInformationMessage(t('messages.textDecorationsRefreshed'));
  }

  public dispose(): void {
    this.decorations.forEach(decoration => decoration.dispose());
    this.decorations.clear();
    this.gameTextWarningDecoration.dispose();
    this.disposables.forEach(d => d.dispose());
    this.allDecorationRanges.clear();
  }
}
