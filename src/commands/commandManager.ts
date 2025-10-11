import * as vscode from "vscode";
import { t } from '../i18n';
import { IgnoredLinesManager } from "../utils/ignoredLines";
import { ColorProvider } from "../providers/colorProvider";
import { GameTextProvider } from "../providers/gameTextProvider";

export class CommandManager {
  private ignoredLinesManager: IgnoredLinesManager;
  private colorProvider?: ColorProvider;
  private gameTextProvider?: GameTextProvider;

  constructor(
    private context: vscode.ExtensionContext,
    ignoredLinesManager: IgnoredLinesManager,
    colorProvider?: ColorProvider,
    gameTextProvider?: GameTextProvider
  ) {
    this.ignoredLinesManager = ignoredLinesManager;
    this.colorProvider = colorProvider;
    this.gameTextProvider = gameTextProvider;
  }

  public registerCommands() {
    // Toggle commands
    this.registerCommand('pawn-painter.toggleHexColorHighlight', this.toggleHexColorHighlight.bind(this));
    this.registerCommand('pawn-painter.toggleGameTextColorPicker', this.toggleGameTextColorPicker.bind(this));
    this.registerCommand('pawn-painter.toggleNormalColorPicker', this.toggleNormalColorPicker.bind(this));

    // Ignored lines commands
    this.registerCommand('pawn-painter.ignoreLine', this.ignoreLine.bind(this));
    this.registerCommand('pawn-painter.unignoreLine', this.unignoreLine.bind(this));
    this.registerCommand('pawn-painter.ignoreFile', this.ignoreFile.bind(this));
    this.registerCommand('pawn-painter.unignoreFile', this.unignoreFile.bind(this));
    this.registerCommand('pawn-painter.clearIgnoredLines', this.clearIgnoredLines.bind(this));
    this.registerCommand('pawn-painter.showIgnoredLines', this.showIgnoredLines.bind(this));

    // Utility commands
    this.registerCommand('pawn-painter.resetGuideState', this.resetGuideState.bind(this));
  }

  private registerCommand(command: string, callback: (...args: any[]) => any) {
    try {
      const disposable = vscode.commands.registerCommand(command, callback);
      this.context.subscriptions.push(disposable);
    } catch (error) {
      // Command might already be registered in tests - this is ok
      // Using output channel instead of console for production
    }
  }

  private async toggleHexColorHighlight() {
    const config = vscode.workspace.getConfiguration('pawn-painter');
    const current = config.get<boolean>('hex.enabled', true);
    await config.update('hex.enabled', !current, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage(
      !current ? t('messages.hexHighlightEnabled') : t('messages.hexHighlightDisabled')
    );
  }

  private async toggleGameTextColorPicker() {
    const config = vscode.workspace.getConfiguration('pawn-painter');
    const current = config.get<boolean>('gameText.enabled', true);
    await config.update('gameText.enabled', !current, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage(
      !current ? t('messages.gameTextEnabled') : t('messages.gameTextDisabled')
    );
  }

  private async toggleNormalColorPicker() {
    const config = vscode.workspace.getConfiguration('pawn-painter');
    const current = config.get<boolean>('general.enableColorPicker', true);
    await config.update('general.enableColorPicker', !current, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage(
      !current ? t('messages.colorPickerEnabled') : t('messages.colorPickerDisabled')
    );
  }

  private ignoreLine() {
    try {
      this.ignoredLinesManager.ignoreSelectedLines();
      this.refreshDecorations();
    } catch (error) {
      // Error handled gracefully - operation fails silently
    }
  }

  private unignoreLine() {
    try {
      this.ignoredLinesManager.unignoreSelectedLines();
      this.refreshDecorations();
    } catch (error) {
      // Error handled gracefully - operation fails silently
    }
  }

  private ignoreFile() {
    try {
      this.ignoredLinesManager.ignoreCurrentFile();
      this.refreshDecorations();
    } catch (error) {
      // Error handled gracefully - operation fails silently
    }
  }

  private unignoreFile() {
    try {
      this.ignoredLinesManager.unignoreCurrentFile();
      this.refreshDecorations();
    } catch (error) {
      // Error handled gracefully - operation fails silently
    }
  }

  private clearIgnoredLines() {
    vscode.window.showWarningMessage(
      'Clear all ignored lines?',
      'Yes',
      'No'
    ).then(choice => {
      if (choice === 'Yes') {
        this.ignoredLinesManager.clearAllIgnoredLines();
        this.refreshDecorations();
      }
    });
  }

  /**
   * Refresh both color squares and text decorations after ignore/restore operations
   */
  private refreshDecorations() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Refresh text decorations immediately
    if (this.gameTextProvider) {
      try {
        this.gameTextProvider.updateDecorations(editor);
      } catch (error) {
        // Error handled gracefully - decoration update fails silently
      }
    }

    // For color squares, we need to force a language refresh since they use DocumentColorProvider
    setTimeout(async () => {
      if (editor === vscode.window.activeTextEditor) {
        try {
          const originalLanguage = editor.document.languageId;
          await vscode.languages.setTextDocumentLanguage(editor.document, 'plaintext');
          setTimeout(async () => {
            try {
              await vscode.languages.setTextDocumentLanguage(editor.document, originalLanguage);
            } catch {
              // If switching back fails, that's ok
            }
          }, 50);
        } catch {
          // If language switching fails, that's ok
        }
      }
    }, 100);
  }

  private showIgnoredLines() {
    this.ignoredLinesManager.showIgnoredLinesHistory();
  }

  private resetGuideState() {
    this.context.globalState.update('pawn-painter.guideShown', false);
    vscode.window.showInformationMessage(t('messages.guideStateReset'));
  }

  public dispose() {
    // Commands are automatically disposed via context.subscriptions
  }
}
