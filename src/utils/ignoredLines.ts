import * as vscode from "vscode";
import { t } from '../i18n';

interface IgnoredLine {
  uri: string;
  line: number;
  timestamp: Date;
  reason?: string;
}

export class IgnoredLinesManager {
  private static readonly STORAGE_KEY = 'pawn-painter.ignoredLines';
  private ignoredLines: IgnoredLine[] = [];
  private context: vscode.ExtensionContext;
  private documentChangeDisposable?: vscode.Disposable;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadIgnoredLines();
    this.setupDocumentChangeListener();
  }

  private loadIgnoredLines() {
    const stored = this.context.globalState.get<IgnoredLine[]>(IgnoredLinesManager.STORAGE_KEY);
    if (stored) {
      this.ignoredLines = stored.map(line => ({
        ...line,
        timestamp: new Date(line.timestamp)
      }));
    }
  }

  private saveIgnoredLines() {
    this.context.globalState.update(IgnoredLinesManager.STORAGE_KEY, this.ignoredLines);
  }

  private setupDocumentChangeListener() {
    this.documentChangeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
      this.updateIgnoredLinesAfterEdit(event);
    });
  }

  private updateIgnoredLinesAfterEdit(event: vscode.TextDocumentChangeEvent) {
    const uri = event.document.uri.toString();
    let hasChanges = false;

    const documentIgnoredLines = this.ignoredLines.filter(ignored => ignored.uri === uri);
    if (documentIgnoredLines.length === 0) {
      return;
    }
    for (const change of event.contentChanges) {
      const startLine = change.range.start.line;
      const endLine = change.range.end.line;
      const newText = change.text;
      
      const oldLineCount = endLine - startLine + 1;
      const newLineCount = newText.split('\n').length;
      const lineDelta = newLineCount - oldLineCount;

      if (lineDelta !== 0) {
        for (const ignoredLine of documentIgnoredLines) {
          if (ignoredLine.line > endLine) {
            ignoredLine.line += lineDelta;
            hasChanges = true;
          } else if (ignoredLine.line >= startLine && ignoredLine.line <= endLine) {
            const index = this.ignoredLines.indexOf(ignoredLine);
            if (index > -1) {
              this.ignoredLines.splice(index, 1);
              hasChanges = true;
            }
          }
        }
      }
    }

    if (hasChanges) {
      this.saveIgnoredLines();
    }
  }

  public isLineIgnored(document: vscode.TextDocument, lineNumber: number): boolean {
    return this.ignoredLines.some(ignored => 
      ignored.uri === document.uri.toString() && 
      ignored.line === lineNumber
    );
  }

  public ignoreLine(document: vscode.TextDocument, lineNumber: number, reason?: string) {
    const uri = document.uri.toString();
    
    if (this.isLineIgnored(document, lineNumber)) {
      return;
    }

    this.ignoredLines.push({
      uri,
      line: lineNumber,
      timestamp: new Date(),
      reason
    });
    
    this.saveIgnoredLines();
    vscode.window.showInformationMessage(t('messages.lineIgnored', lineNumber + 1));
  }

  public unignoreLine(document: vscode.TextDocument, lineNumber: number) {
    const uri = document.uri.toString();
    const initialLength = this.ignoredLines.length;
    
    this.ignoredLines = this.ignoredLines.filter(ignored => 
      !(ignored.uri === uri && ignored.line === lineNumber)
    );
    
    if (this.ignoredLines.length < initialLength) {
      this.saveIgnoredLines();
      vscode.window.showInformationMessage(t('messages.lineRestored', lineNumber + 1));
    } else {
      vscode.window.showWarningMessage(t('messages.lineNotIgnored', lineNumber + 1));
    }
  }

  public ignoreSelectedLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selections = editor.selections;
    let ignoredCount = 0;

    selections.forEach(selection => {
      for (let line = selection.start.line; line <= selection.end.line; line++) {
        if (!this.isLineIgnored(editor.document, line)) {
          this.ignoreLine(editor.document, line, 'User selection');
          ignoredCount++;
        }
      }
    });

    if (ignoredCount > 0) {
      vscode.window.showInformationMessage(t('messages.linesIgnored', ignoredCount));
    }
  }

  public unignoreSelectedLines() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selections = editor.selections;
    let restoredCount = 0;

    selections.forEach(selection => {
      for (let line = selection.start.line; line <= selection.end.line; line++) {
        if (this.isLineIgnored(editor.document, line)) {
          this.unignoreLine(editor.document, line);
          restoredCount++;
        }
      }
    });

    if (restoredCount > 0) {
      vscode.window.showInformationMessage(t('messages.linesRestored', restoredCount));
    }
  }

  public ignoreCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const uri = editor.document.uri.toString();
    const lineCount = editor.document.lineCount;
    let ignoredCount = 0;

    for (let line = 0; line < lineCount; line++) {
      if (!this.isLineIgnored(editor.document, line)) {
        this.ignoreLine(editor.document, line, 'Ignore entire file');
        ignoredCount++;
      }
    }

    if (ignoredCount > 0) {
      vscode.window.showInformationMessage(t('messages.fileIgnored', ignoredCount));
    } else {
      vscode.window.showInformationMessage(t('messages.fileAlreadyIgnored'));
    }
  }

  public unignoreCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const uri = editor.document.uri.toString();
    const initialLength = this.ignoredLines.length;
    
    this.ignoredLines = this.ignoredLines.filter(ignored => ignored.uri !== uri);
    
    const removedCount = initialLength - this.ignoredLines.length;
    if (removedCount > 0) {
      this.saveIgnoredLines();
      vscode.window.showInformationMessage(t('messages.fileRestored', removedCount));
    } else {
      vscode.window.showInformationMessage(t('messages.noIgnoredLinesInFile'));
    }
  }

  public clearAllIgnoredLines() {
    const count = this.ignoredLines.length;
    this.ignoredLines = [];
    this.saveIgnoredLines();
    vscode.window.showInformationMessage(t('messages.ignoredLinesCleared', count));
  }

  public showIgnoredLinesHistory() {
    if (this.ignoredLines.length === 0) {
      vscode.window.showInformationMessage(t('messages.noIgnoredLines'));
      return;
    }

    const items = this.ignoredLines.map(ignored => {
      const uri = vscode.Uri.parse(ignored.uri);
      const fileName = uri.path.split('/').pop();
      return {
        label: `${fileName}:${ignored.line + 1}`,
        description: ignored.reason || 'No reason provided',
        detail: `Ignored on ${ignored.timestamp.toLocaleString()}`,
        ignored
      };
    });

    vscode.window.showQuickPick(items, {
      placeHolder: 'Select a line to restore or view details'
    }).then(selected => {
      if (selected) {
        const uri = vscode.Uri.parse(selected.ignored.uri);
        vscode.window.showTextDocument(uri).then(editor => {
          const line = selected.ignored.line;
          const range = new vscode.Range(line, 0, line, editor.document.lineAt(line).text.length);
          editor.selection = new vscode.Selection(range.start, range.end);
          editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        });
      }
    });
  }

  public getIgnoredLines(): IgnoredLine[] {
    return [...this.ignoredLines];
  }

  public dispose() {
    this.documentChangeDisposable?.dispose();
  }
}
