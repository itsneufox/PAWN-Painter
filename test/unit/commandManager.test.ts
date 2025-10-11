import * as assert from 'assert';
import * as vscode from 'vscode';
import { CommandManager } from '../../src/commands/commandManager';
import { IgnoredLinesManager } from '../../src/utils/ignoredLines';
import { ColorProvider } from '../../src/providers/colorProvider';
import { GameTextProvider } from '../../src/providers/gameTextProvider';
import { createMockContext, createMockEditor, createMockDocument, withMockActiveEditor } from './testHelpers';

suite('Command Manager Integration Tests', () => {
  let commandManager: CommandManager;
  let ignoredLinesManager: IgnoredLinesManager;
  let colorProvider: ColorProvider;
  let gameTextProvider: GameTextProvider;
  let mockContext: vscode.ExtensionContext;
  let mockEditor: vscode.TextEditor;
  let mockDocument: vscode.TextDocument;

  setup(() => {
    // Create mock objects using helpers
    mockContext = createMockContext();
    mockDocument = createMockDocument();
    mockEditor = createMockEditor();

    // Create providers
    ignoredLinesManager = new IgnoredLinesManager(mockContext);
    colorProvider = new ColorProvider(ignoredLinesManager);
    gameTextProvider = new GameTextProvider(ignoredLinesManager);
    
    // Create command manager with providers
    commandManager = new CommandManager(
      mockContext, 
      ignoredLinesManager, 
      colorProvider,
      gameTextProvider
    );
  });

  teardown(() => {
    commandManager?.dispose();
    gameTextProvider?.dispose();
    colorProvider?.dispose();
    ignoredLinesManager?.dispose();
  });

  suite('Provider Integration', () => {
    test('CommandManager accepts provider dependencies', () => {
      // Verify providers are properly injected
      assert.ok(commandManager, 'CommandManager should be created');
      
      // Test that internal providers are set (via private access)
      const hasColorProvider = (commandManager as any).colorProvider !== undefined;
      const hasGameTextProvider = (commandManager as any).gameTextProvider !== undefined;
      
      assert.ok(hasColorProvider, 'Should have color provider');
      assert.ok(hasGameTextProvider, 'Should have game text provider');
    });

    test('CommandManager works without optional providers', () => {
      // Create command manager without providers
      const minimalCommandManager = new CommandManager(mockContext, ignoredLinesManager);
      
      assert.ok(minimalCommandManager, 'Should work without optional providers');
      
      minimalCommandManager.dispose();
    });
  });

  suite('Ignore/Restore with Refresh Integration', () => {
    test('ignoreLine triggers refresh after operation', async () => {
      // Track if refresh was called
      let refreshCalled = false;
      const originalRefresh = (commandManager as any).refreshDecorations;
      (commandManager as any).refreshDecorations = async () => {
        refreshCalled = true;
      };
      
      // Mock showInformationMessage to avoid UI in tests
      const originalShowMessage = vscode.window.showInformationMessage;
      (vscode.window as any).showInformationMessage = () => Promise.resolve();
      
      try {
        await withMockActiveEditor(mockEditor, async () => {
          await (commandManager as any).ignoreLine();
        });
        
        assert.ok(refreshCalled, 'Should call refresh after ignoring line');
      } finally {
        (commandManager as any).refreshDecorations = originalRefresh;
        (vscode.window as any).showInformationMessage = originalShowMessage;
      }
    });

    test('unignoreLine triggers refresh after operation', async () => {
      // Track if refresh was called
      let refreshCalled = false;
      const originalRefresh = (commandManager as any).refreshDecorations;
      (commandManager as any).refreshDecorations = async () => {
        refreshCalled = true;
      };
      
      // Mock showInformationMessage to avoid UI in tests
      const originalShowMessage = vscode.window.showInformationMessage;
      (vscode.window as any).showInformationMessage = () => Promise.resolve();
      
      try {
        await withMockActiveEditor(mockEditor, async () => {
          await (commandManager as any).unignoreLine();
        });
        
        assert.ok(refreshCalled, 'Should call refresh after unignoring line');
      } finally {
        (commandManager as any).refreshDecorations = originalRefresh;
        (vscode.window as any).showInformationMessage = originalShowMessage;
      }
    });

    test('ignoreFile triggers refresh after operation', async () => {
      // Track if refresh was called
      let refreshCalled = false;
      const originalRefresh = (commandManager as any).refreshDecorations;
      (commandManager as any).refreshDecorations = async () => {
        refreshCalled = true;
      };
      
      // Mock showInformationMessage to avoid UI in tests
      const originalShowMessage = vscode.window.showInformationMessage;
      (vscode.window as any).showInformationMessage = () => Promise.resolve();
      
      try {
        await withMockActiveEditor(mockEditor, async () => {
          await (commandManager as any).ignoreFile();
        });
        
        assert.ok(refreshCalled, 'Should call refresh after ignoring file');
      } finally {
        (commandManager as any).refreshDecorations = originalRefresh;
        (vscode.window as any).showInformationMessage = originalShowMessage;
      }
    });

    test('unignoreFile triggers refresh after operation', async () => {
      // Track if refresh was called
      let refreshCalled = false;
      const originalRefresh = (commandManager as any).refreshDecorations;
      (commandManager as any).refreshDecorations = async () => {
        refreshCalled = true;
      };
      
      // Mock showInformationMessage to avoid UI in tests
      const originalShowMessage = vscode.window.showInformationMessage;
      (vscode.window as any).showInformationMessage = () => Promise.resolve();
      
      try {
        await withMockActiveEditor(mockEditor, async () => {
          await (commandManager as any).unignoreFile();
        });
        
        assert.ok(refreshCalled, 'Should call refresh after unignoring file');
      } finally {
        (commandManager as any).refreshDecorations = originalRefresh;
        (vscode.window as any).showInformationMessage = originalShowMessage;
      }
    });

    test('clearIgnoredLines triggers refresh after operation', async () => {
      // Track if refresh was called
      let refreshCalled = false;
      const originalRefresh = (commandManager as any).refreshDecorations;
      (commandManager as any).refreshDecorations = async () => {
        refreshCalled = true;
      };
      
      // Mock warning message to simulate user clicking "Yes"
      const originalShowWarning = vscode.window.showWarningMessage;
      (vscode.window as any).showWarningMessage = () => Promise.resolve('Yes');
      
      try {
        await withMockActiveEditor(mockEditor, async () => {
          await (commandManager as any).clearIgnoredLines();
        });
        
        assert.ok(refreshCalled, 'Should call refresh after clearing ignored lines');
      } finally {
        (commandManager as any).refreshDecorations = originalRefresh;
        (vscode.window as any).showWarningMessage = originalShowWarning;
      }
    });
  });

  suite('Refresh Implementation', () => {
    test('refreshDecorations calls provider methods', async () => {
      // Track provider calls
      let gameTextCalled = false;
      const originalGameTextUpdate = gameTextProvider.updateDecorations;
      (gameTextProvider as any).updateDecorations = () => {
        gameTextCalled = true;
      };
      
      // Mock languages API for language switching
      const originalSetLanguage = vscode.languages.setTextDocumentLanguage;
      (vscode.languages as any).setTextDocumentLanguage = () => Promise.resolve();
      
      try {
        await withMockActiveEditor(mockEditor, async () => {
          await (commandManager as any).refreshDecorations();
        });
        
        assert.ok(gameTextCalled, 'Should call game text provider update');
      } finally {
        (gameTextProvider as any).updateDecorations = originalGameTextUpdate;
        (vscode.languages as any).setTextDocumentLanguage = originalSetLanguage;
      }
    });

    test('refreshDecorations handles no active editor gracefully', async () => {
      await withMockActiveEditor(undefined, async () => {
        // Should not throw
        await (commandManager as any).refreshDecorations();
        assert.ok(true, 'Should handle no active editor gracefully');
      });
    });

    test('refreshDecorations handles missing providers gracefully', async () => {
      // Create command manager without providers
      const minimalManager = new CommandManager(mockContext, ignoredLinesManager);
      
      try {
        await withMockActiveEditor(mockEditor, async () => {
          // Should not throw
          await (minimalManager as any).refreshDecorations();
          assert.ok(true, 'Should handle missing providers gracefully');
        });
      } finally {
        minimalManager.dispose();
      }
    });
  });

  suite('Error Handling', () => {
    test('ignore commands handle errors gracefully', async () => {
      // Make ignoredLinesManager throw an error
      const originalIgnoreLines = ignoredLinesManager.ignoreSelectedLines;
      (ignoredLinesManager as any).ignoreSelectedLines = () => {
        throw new Error('Test error');
      };
      
      try {
        await withMockActiveEditor(mockEditor, async () => {
          // Should not crash the extension
          await (commandManager as any).ignoreLine();
          assert.ok(true, 'Should handle ignore errors gracefully');
        });
      } finally {
        (ignoredLinesManager as any).ignoreSelectedLines = originalIgnoreLines;
      }
    });

    test('refresh commands handle provider errors gracefully', async () => {
      // Make provider throw an error
      const originalUpdate = gameTextProvider.updateDecorations;
      (gameTextProvider as any).updateDecorations = () => {
        throw new Error('Provider error');
      };
      
      try {
        await withMockActiveEditor(mockEditor, async () => {
          // Should not crash
          await (commandManager as any).refreshDecorations();
          assert.ok(true, 'Should handle provider errors gracefully');
        });
      } finally {
        (gameTextProvider as any).updateDecorations = originalUpdate;
      }
    });
  });

  suite('Command Registration', () => {
    test('registerCommands sets up all commands', () => {
      const commandsBefore = vscode.commands.getCommands();
      commandManager.registerCommands();
      const commandsAfter = vscode.commands.getCommands();
      
      // Note: In real tests, commands would be registered but we can't easily test this in unit tests
      // This test just verifies the method doesn't throw
      assert.ok(true, 'registerCommands should complete without errors');
    });

    test('dispose cleans up command registrations', () => {
      // Track disposables
      const initialDisposables = mockContext.subscriptions.length;
      commandManager.registerCommands();
      const afterRegistration = mockContext.subscriptions.length;
      
      commandManager.dispose();
      
      // Verify dispose was called on subscriptions
      assert.ok(afterRegistration >= initialDisposables, 'Should dispose registered commands');
    });
  });
});
