import * as vscode from 'vscode';
import { getMatches, getCustomMatches } from '../getMatches';
import { isValidDocument } from '../utils/helpers';
import { IgnoredLinesManager } from '../utils/ignoredLines';
import { t } from '../i18n';

/**
 * PAWN color provider that shows colors up to VS Code's configurable decorator limit
 * Coordinates with text decorations to ensure consistent ranges
 */
export class ColorProvider implements vscode.DocumentColorProvider {
  private disposables: vscode.Disposable[] = [];
  private allColors = new Map<string, vscode.ColorInformation[]>();
  private lastDecoratorLines = new Map<string, number>(); // documentUri -> last line with color decorator
  private performanceWarningShown = new Set<string>(); // Track which limits have been warned about
  
  constructor(private ignoredLinesManager: IgnoredLinesManager) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Listen for document changes to clear cache
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(event => {
        this.clearDocumentCache(event.document.uri.toString());
      })
    );
  }

  private clearDocumentCache(documentUri: string): void {
    this.allColors.delete(documentUri);
    this.lastDecoratorLines.delete(documentUri);
  }

  /**
   * Set the last line number that has a color decorator (for text provider coordination)
   */
  private setLastDecoratorLine(documentUri: string, lineNumber: number): void {
    this.lastDecoratorLines.set(documentUri, lineNumber);
  }

  /**
   * Get the last line number that has a color decorator (for text provider coordination)
   */
  public getLastDecoratorLine(documentUri: string): number {
    return this.lastDecoratorLines.get(documentUri) ?? -1;
  }

  public async provideDocumentColors(document: vscode.TextDocument): Promise<vscode.ColorInformation[]> {
    try {
      if (!document || !isValidDocument(document)) {
        return [];
      }

      const config = vscode.workspace.getConfiguration('pawn-painter');
      
      if (config.get<boolean>('disable', false)) {
        return [];
      }

      if (!config.get<boolean>('general.enableColorPicker', true)) {
        return [];
      }

      const documentUri = document.uri.toString();

      // Get or compute all colors for the document
      let allDocumentColors = this.allColors.get(documentUri);
      if (!allDocumentColors) {
        allDocumentColors = await this.getAllDocumentColors(document);
        this.allColors.set(documentUri, allDocumentColors);
      }

      // Get user-defined color decorator limit
      const decoratorLimit = config.get<number>('performance.colorDecoratorLimit', 500);
      
      // Show warning if user has a high limit (only once per limit value)
      const highLimitWarningKey = `limit_${decoratorLimit}`;
      if (decoratorLimit > 1000 && allDocumentColors.length > decoratorLimit && !this.performanceWarningShown.has(highLimitWarningKey)) {
        this.performanceWarningShown.add(highLimitWarningKey);
        vscode.window.showWarningMessage(
          t('messages.highPerformanceWarning', decoratorLimit)
        );
      }
      
      // Show warning if document has more colors than the current limit (only once per document+limit combination)
      const limitExceededWarningKey = `exceeded_${documentUri}_${decoratorLimit}`;
      if (allDocumentColors.length > decoratorLimit && !this.performanceWarningShown.has(limitExceededWarningKey)) {
        this.performanceWarningShown.add(limitExceededWarningKey);
        vscode.window.showWarningMessage(
          t('messages.colorLimitExceeded', allDocumentColors.length, decoratorLimit, allDocumentColors.length - decoratorLimit)
        );
      }

      // Apply the limit and store info for text provider coordination
      const limitedColors = allDocumentColors.slice(0, decoratorLimit);
      
      // Store the last decorator line for text provider coordination
      if (limitedColors.length > 0) {
        const lastColorLine = limitedColors[limitedColors.length - 1].range.start.line;
        this.setLastDecoratorLine(documentUri, lastColorLine);
      } else {
        this.setLastDecoratorLine(documentUri, -1);
      }

      return this.filterIgnoredColors(limitedColors, document);
      
    } catch (error) {
      // If any error occurs, return empty array to prevent crashes
      return [];
    }
  }

  private async getAllDocumentColors(document: vscode.TextDocument): Promise<vscode.ColorInformation[]> {
    const text = document.getText();
    
    const matches = [
      ...(await getMatches(text)),
      ...getCustomMatches(text, document.languageId),
    ];

    return matches;
  }

  private filterIgnoredColors(
    colors: vscode.ColorInformation[], 
    document: vscode.TextDocument
  ): vscode.ColorInformation[] {
    if (!this.ignoredLinesManager) {
      return colors;
    }

    return colors.filter(color => {
      const line = color.range.start.line;
      return !this.ignoredLinesManager.isLineIgnored(document, line);
    });
  }

  /**
   * Refresh colors by clearing cache
   */
  public async refreshColors(): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || !activeEditor.document) return;
    
    const documentUri = activeEditor.document.uri.toString();
    this.clearDocumentCache(documentUri);
    
    vscode.window.showInformationMessage(t('messages.colorsRefreshed'));
  }

  public provideColorPresentations(
    color: vscode.Color, 
    context: { document: vscode.TextDocument; range: vscode.Range }
  ): vscode.ProviderResult<vscode.ColorPresentation[]> {
    const { document } = context;
    
    if (!isValidDocument(document)) {
      return [];
    }
    
    const config = vscode.workspace.getConfiguration('pawn-painter');
    if (!config.get<boolean>('general.enableColorPicker', true)) {
      return [];
    }

    // Import here to avoid circular dependencies
    const { PawnColorTranslator } = require('../colorTranslatorExtended');
    
    const { red: r, green: g, blue: b, alpha } = color;
    const pawnColor = new PawnColorTranslator({
      r: r * 255,
      g: g * 255,
      b: b * 255,
      alpha,
    });

    const representations = [
      pawnColor.pawnHex,
      pawnColor.pawnHexNoAlpha,
      pawnColor.pawnBraced,
      pawnColor.pawnDecimal,
      pawnColor.pawnRgb,
    ];

    return representations.map(
      (representation) => new vscode.ColorPresentation(representation)
    );
  }

  public clearCache(): void {
    this.allColors.clear();
    this.lastDecoratorLines.clear();
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.allColors.clear();
    this.lastDecoratorLines.clear();
    this.performanceWarningShown.clear();
  }
}