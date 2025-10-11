import * as assert from 'assert';
import * as vscode from 'vscode';
import { GameTextProvider } from '../../src/providers/gameTextProvider';
import { ColorProvider } from '../../src/providers/colorProvider';
import { IgnoredLinesManager } from '../../src/utils/ignoredLines';
import { createMockDocument, createMockEditor, createMockContext, withMockActiveEditor } from './testHelpers';

suite('Refresh Commands Tests', () => {
  let gameTextProvider: GameTextProvider;
  let colorProvider: ColorProvider;
  let ignoredLinesManager: IgnoredLinesManager;
  let mockContext: vscode.ExtensionContext;
  let mockEditor: vscode.TextEditor;
  let mockDocument: vscode.TextDocument;

  setup(() => {
    mockContext = createMockContext();
    mockDocument = createMockDocument();
    mockEditor = createMockEditor();
    
    ignoredLinesManager = new IgnoredLinesManager(mockContext);
    colorProvider = new ColorProvider(ignoredLinesManager);
    gameTextProvider = new GameTextProvider(ignoredLinesManager, colorProvider);
  });

  teardown(() => {
    gameTextProvider?.dispose();
    colorProvider?.dispose();
    ignoredLinesManager?.dispose();
  });

  suite('ColorProvider Refresh', () => {
    test('refreshColors clears cache and shows message', async () => {
      await withMockActiveEditor(mockEditor, async () => {
        let messageShown = false;
        let messageContent = '';
        
        const originalShowMessage = (vscode.window as any).showInformationMessage;
        const originalShowWarning = (vscode.window as any).showWarningMessage;
        
        (vscode.window as any).showInformationMessage = (message: string) => {
          messageShown = true;
          messageContent = message;
          return Promise.resolve();
        };
        
        // Mock warning messages to prevent interference with tests
        (vscode.window as any).showWarningMessage = () => Promise.resolve();
        
        try {
          await colorProvider.refreshColors();
          
          assert.ok(messageShown, 'Should show refresh message');
          assert.ok(messageContent.includes('refresh') || messageContent.includes('cleared'), 'Message should mention refresh');
        } finally {
          (vscode.window as any).showInformationMessage = originalShowMessage;
          (vscode.window as any).showWarningMessage = originalShowWarning;
        }
      });
    });
  });

  suite('GameTextProvider Refresh', () => {
    test('refreshTextDecorations clears cache and shows message', async () => {
      await withMockActiveEditor(mockEditor, async () => {
        let messageShown = false;
        let messageContent = '';
        
        const originalShowMessage = (vscode.window as any).showInformationMessage;
        const originalShowWarning = (vscode.window as any).showWarningMessage;
        
        (vscode.window as any).showInformationMessage = (message: string) => {
          messageShown = true;
          messageContent = message;
          return Promise.resolve();
        };
        
        // Mock warning messages to prevent interference with tests
        (vscode.window as any).showWarningMessage = () => Promise.resolve();
        
        try {
          await gameTextProvider.refreshTextDecorations();
          
          assert.ok(messageShown, 'Should show refresh message');
          assert.ok(messageContent.includes('refresh'), 'Message should mention refresh');
        } finally {
          (vscode.window as any).showInformationMessage = originalShowMessage;
          (vscode.window as any).showWarningMessage = originalShowWarning;
        }
      });
    });
  });
});