import * as vscode from "vscode";
import { GameTextProvider } from "./providers/gameTextProvider";
import { ColorProvider } from "./providers/colorProvider";
import { AlphaWarningsManager } from "./utils/alphaWarnings";
import { ContextMenuCommands } from "./commands/contextMenuCommands";
import { IgnoredLinesManager } from "./utils/ignoredLines";
import { CommandManager } from "./commands/commandManager";
import { t, i18n } from './i18n';
class PawnPicker implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private gameTextProvider: GameTextProvider;
  private colorProvider: ColorProvider;
  private alphaWarningsManager: AlphaWarningsManager;
  private contextMenuCommands: ContextMenuCommands;
  private ignoredLinesManager: IgnoredLinesManager;
  private commandManager: CommandManager;

  constructor(private context: vscode.ExtensionContext) {
    this.ignoredLinesManager = new IgnoredLinesManager(context);
    this.colorProvider = new ColorProvider(this.ignoredLinesManager);
    this.gameTextProvider = new GameTextProvider(this.ignoredLinesManager, this.colorProvider);
    this.alphaWarningsManager = new AlphaWarningsManager();
    this.contextMenuCommands = new ContextMenuCommands();
    this.commandManager = new CommandManager(context, this.ignoredLinesManager, this.colorProvider, this.gameTextProvider);
    this.commandManager.registerCommands();
    
    // Set up configuration change listener for color decorator limit
    this.setupColorDecoratorLimitSync();
    
    // Register refresh all decorations command
    this.disposables.push(vscode.commands.registerCommand('pawn-painter.refreshDecorations', async () => {
      // Refresh both color squares and text decorations at the same time
      await Promise.all([
        this.colorProvider.refreshColors(),
        this.gameTextProvider.refreshTextDecorations()
      ]);
    }));

    this.register();
  }

  private register() {
    // Register the color provider
    this.disposables.push(vscode.languages.registerColorProvider(
      [
        { scheme: 'file', language: 'pawn' },
        { scheme: 'file', pattern: '**/*.pwn' },
        { scheme: 'file', pattern: '**/*.inc' },
        { scheme: 'file', pattern: '**/*.p' },
        { scheme: 'file', pattern: '**/*.pawno' },
      ],
      this.colorProvider
    ));

    // Set up event listeners for coordination
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && this.isPawnFile(editor.document)) {
          this.gameTextProvider.updateDecorations(editor);
          this.alphaWarningsManager.updateAlphaWarnings(editor);
          
        }
      })
    );

    if (vscode.window.activeTextEditor && this.isPawnFile(vscode.window.activeTextEditor.document)) {
      this.gameTextProvider.updateDecorations(vscode.window.activeTextEditor);
      this.alphaWarningsManager.updateAlphaWarnings(vscode.window.activeTextEditor);
    }
  }

  private isPawnFile(document: vscode.TextDocument): boolean {
    return document.languageId === 'pawn' || 
           ['.pwn', '.inc', '.p', '.pawno'].some(ext => document.fileName.endsWith(ext));
  }

  /**
   * Set up automatic synchronization between PAWN Painter's colorDecoratorLimit setting
   * and VS Code's editor.colorDecoratorsLimit setting
   */
  private setupColorDecoratorLimitSync(): void {
    // Initial sync on startup
    this.syncColorDecoratorLimit();
    
    // Listen for configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('pawn-painter.performance.colorDecoratorLimit')) {
          this.syncColorDecoratorLimit();
        }
      })
    );
  }

  /**
   * Sync PAWN Painter's color decorator limit setting with VS Code's editor.colorDecoratorsLimit
   */
  private async syncColorDecoratorLimit(): Promise<void> {
    try {
      const pawnConfig = vscode.workspace.getConfiguration('pawn-painter');
      const decoratorLimit = pawnConfig.get<number>('performance.colorDecoratorLimit', 500);
      
      // Get current VS Code setting
      const editorConfig = vscode.workspace.getConfiguration('editor');
      const currentVSCodeLimit = editorConfig.get<number>('colorDecoratorsLimit', 500);
      
      // Only update if different
      if (currentVSCodeLimit !== decoratorLimit) {
        await editorConfig.update('colorDecoratorsLimit', decoratorLimit, vscode.ConfigurationTarget.Global);
        
        // Clear provider caches and refresh decorations when limit changes
        this.colorProvider.clearCache();
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
          this.gameTextProvider.updateDecorations(activeEditor);
        }
        
        // Show notification about the change
        if (decoratorLimit > 1000) {
        vscode.window.showWarningMessage(
          t('messages.settingsUpdatedHigh', decoratorLimit)
        );
        } else {
          vscode.window.showInformationMessage(
            t('messages.settingsUpdatedNormal', decoratorLimit)
          );
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        t('messages.settingsUpdateFailed')
      );
    }
  }

  public dispose() {
    this.gameTextProvider?.dispose();
    this.colorProvider?.dispose();
    this.alphaWarningsManager?.dispose();
    this.contextMenuCommands?.dispose();
    this.ignoredLinesManager?.dispose();
    this.commandManager?.dispose();
    this.disposables.forEach(disposable => disposable.dispose());
    this.disposables = [];
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Initialize extension with proper language detection
  const picker = new PawnPicker(context);
  context.subscriptions.push(picker);
}
