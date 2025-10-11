import * as vscode from "vscode";
import { getSetting } from "./helpers";
import { t } from '../i18n';

export class AlphaWarningsManager {
  private alphaColourDecorations = new Map<string, vscode.TextEditorDecorationType>();
  private alphaWarningDecoration: vscode.TextEditorDecorationType;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.alphaWarningDecoration = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: '', // Will be set dynamically
        color: 'orange',
        margin: '0 0 0 10px'
      }
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && this.isPawnFile(editor.document)) {
          this.updateAlphaWarnings(editor);
        }
      }),
      
      vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document && this.isPawnFile(editor.document)) {
          this.updateAlphaWarnings(editor);
        }
      })
    );
  }

  private isPawnFile(document: vscode.TextDocument): boolean {
    return document.languageId === 'pawn' || 
           ['.pwn', '.inc', '.p', '.pawno'].some(ext => document.fileName.endsWith(ext));
  }

  public updateAlphaWarnings(editor: vscode.TextEditor) {
    if (getSetting<boolean>("disable") || !getSetting<boolean>("hex.showAlphaWarnings")) {
      this.clearAlphaWarnings(editor);
      return;
    }

    const text = editor.document.getText();
    const highlightCode = getSetting<boolean>("alphaWarnings.highlightCode") ?? true;
    const highlightStyle = getSetting<string>("alphaWarnings.highlightStyle") || "underline";
    
    const alphaColourRanges: vscode.Range[] = [];
    const alphaWarningRanges: vscode.Range[] = [];

    const hexAlphaRegex = /\b0x[0-9A-Fa-f]{6}00\b/g;
    
    let match;
    const processedLines = new Set<number>();
    
    while ((match = hexAlphaRegex.exec(text)) !== null) {
      const startPos = editor.document.positionAt(match.index);
      const endPos = editor.document.positionAt(match.index + match[0].length);
      
      if (highlightCode) {
        const colourRange = new vscode.Range(startPos, endPos);
        alphaColourRanges.push(colourRange);
      }
      
      if (!processedLines.has(startPos.line)) {
        const lineEnd = editor.document.lineAt(startPos.line).range.end;
        const warningRange = new vscode.Range(lineEnd, lineEnd);
        alphaWarningRanges.push(warningRange);
        processedLines.add(startPos.line);
      }
    }

    if (highlightCode && alphaColourRanges.length > 0) {
      const decorationKey = `alpha_warning_${highlightStyle}`;
      
      if (!this.alphaColourDecorations.has(decorationKey)) {
        this.alphaColourDecorations.set(decorationKey, 
          vscode.window.createTextEditorDecorationType(this.createHighlightStyle(highlightStyle))
        );
      }
      
      const decoration = this.alphaColourDecorations.get(decorationKey);
      if (decoration) {
        editor.setDecorations(decoration, alphaColourRanges);
      }
    }

    // Create decoration with current translation
    const currentAlphaWarningDecoration = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: t('warnings.invisibleColor'),
        color: 'orange',
        margin: '0 0 0 10px'
      }
    });
    
    // Dispose previous decoration if it exists
    this.alphaWarningDecoration.dispose();
    this.alphaWarningDecoration = currentAlphaWarningDecoration;
    
    editor.setDecorations(this.alphaWarningDecoration, alphaWarningRanges);
  }

  private createHighlightStyle(style: string): vscode.DecorationRenderOptions {
    switch (style) {
      case 'text':
        return {
          color: 'orange',
          fontWeight: 'bold'
        };
      case 'underline':
        return {
          textDecoration: 'none; border-bottom: 2px solid orange',
          fontWeight: 'bold'
        };
      case 'background':
        return {
          backgroundColor: 'rgba(255, 165, 0, 0.2)',
          border: '1px solid orange',
          borderRadius: '3px'
        };
      default:
        return {
          textDecoration: 'none; border-bottom: 2px solid orange',
          fontWeight: 'bold'
        };
    }
  }

  private clearAlphaWarnings(editor: vscode.TextEditor) {
    this.alphaColourDecorations.forEach(decoration => {
      editor.setDecorations(decoration, []);
    });
    editor.setDecorations(this.alphaWarningDecoration, []);
  }

  public dispose() {
    this.alphaColourDecorations.forEach(decoration => decoration.dispose());
    this.alphaColourDecorations.clear();
    this.alphaWarningDecoration.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}
