import * as vscode from 'vscode';

/**
 * Test helper utilities for mocking VS Code APIs
 */

export interface MockEditor extends vscode.TextEditor {
  // Add any additional mock properties if needed
}

export interface MockDocument extends vscode.TextDocument {
  // Add any additional mock properties if needed
}

/**
 * Creates a mock document for testing
 */
export function createMockDocument(uri?: string, languageId = 'pawn'): MockDocument {
  return {
    uri: vscode.Uri.parse(uri || 'test://test.pwn'),
    fileName: uri?.split('/').pop() || 'test.pwn',
    languageId,
    lineCount: 1000,
    isUntitled: false,
    isDirty: false,
    isClosed: false,
    eol: vscode.EndOfLine.LF,
    version: 1,
    getText: () => 'SendClientMessage(playerid, 0xFF0000FF, "Hello World");',
    getWordRangeAtPosition: () => undefined,
    validateRange: (range: vscode.Range) => range,
    validatePosition: (position: vscode.Position) => position,
    lineAt: (line: number | vscode.Position) => {
      const lineNum = typeof line === 'number' ? line : line.line;
      return {
        text: 'SendClientMessage(playerid, 0xFF0000FF, "Hello World");',
        range: new vscode.Range(lineNum, 0, lineNum, 50),
        rangeIncludingLineBreak: new vscode.Range(lineNum, 0, lineNum + 1, 0),
        lineNumber: lineNum,
        firstNonWhitespaceCharacterIndex: 0,
        isEmptyOrWhitespace: false
      };
    },
    offsetAt: () => 0,
    positionAt: () => new vscode.Position(0, 0),
    save: () => Promise.resolve(true)
  } as MockDocument;
}

/**
 * Creates a mock editor for testing
 */
export function createMockEditor(document?: MockDocument, selection?: vscode.Selection): MockEditor {
  const mockDoc = document || createMockDocument();
  return {
    document: mockDoc,
    selection: selection || new vscode.Selection(0, 0, 0, 0),
    selections: [selection || new vscode.Selection(0, 0, 0, 0)],
    visibleRanges: [new vscode.Range(0, 0, 50, 0)],
    options: {
      cursorStyle: vscode.TextEditorCursorStyle.Line,
      insertSpaces: true,
      lineNumbers: vscode.TextEditorLineNumbersStyle.On,
      tabSize: 4
    },
    viewColumn: vscode.ViewColumn.One,
    setDecorations: () => {},
    revealRange: () => {},
    show: () => {},
    hide: () => {},
    edit: () => Promise.resolve(true),
    insertSnippet: () => Promise.resolve(true)
  } as MockEditor;
}

/**
 * Creates a mock extension context for testing
 */
export function createMockContext(): vscode.ExtensionContext {
  return {
    extensionUri: vscode.Uri.file('/mock/path'),
    extensionPath: '/mock/path',
    asAbsolutePath: (relativePath: string) => `/mock/path/${relativePath}`,
    storagePath: '/mock/storage',
    storageUri: vscode.Uri.file('/mock/storage'),
    globalStoragePath: '/mock/global-storage',
    globalStorageUri: vscode.Uri.file('/mock/global-storage'),
    logPath: '/mock/logs',
    logUri: vscode.Uri.file('/mock/logs'),
    extensionMode: vscode.ExtensionMode.Test,
    globalState: {
      get: () => undefined,
      update: () => Promise.resolve(),
      keys: () => [],
      setKeysForSync: () => {}
    } as any,
    workspaceState: {
      get: () => undefined,
      update: () => Promise.resolve(),
      keys: () => []
    } as any,
    subscriptions: [],
    environmentVariableCollection: {} as any,
    secrets: {} as any,
    extension: {} as any
  } as vscode.ExtensionContext;
}

/**
 * Mock showInformationMessage and track calls
 */
export function mockInformationMessage(): { messages: string[], restore: () => void } {
  const messages: string[] = [];
  const original = vscode.window.showInformationMessage;
  
  (vscode.window as any).showInformationMessage = (message: string) => {
    messages.push(message);
    return Promise.resolve();
  };
  
  return {
    messages,
    restore: () => {
      (vscode.window as any).showInformationMessage = original;
    }
  };
}

/**
 * Mock commands.registerCommand and track registrations
 */
export function mockCommandRegistration(): { commands: string[], restore: () => void } {
  const commands: string[] = [];
  const original = vscode.commands.registerCommand;
  
  (vscode.commands as any).registerCommand = (command: string, callback: Function) => {
    commands.push(command);
    return { dispose: () => {} };
  };
  
  return {
    commands,
    restore: () => {
      (vscode.commands as any).registerCommand = original;
    }
  };
}

/**
 * Helper to test with active editor mock
 */
export function withMockActiveEditor<T>(editor: MockEditor | undefined, fn: () => T | Promise<T>): T | Promise<T> {
  // Store original descriptor
  const descriptor = Object.getOwnPropertyDescriptor(vscode.window, 'activeTextEditor');
  
  // Define new getter
  Object.defineProperty(vscode.window, 'activeTextEditor', {
    get: () => editor,
    configurable: true
  });
  
  try {
    const result = fn();
    
    // If result is a promise, handle cleanup after it resolves
    if (result && typeof (result as any).then === 'function') {
      return (result as Promise<T>).finally(() => {
        // Restore original descriptor
        if (descriptor) {
          Object.defineProperty(vscode.window, 'activeTextEditor', descriptor);
        }
      });
    }
    
    // Restore original descriptor for synchronous calls
    if (descriptor) {
      Object.defineProperty(vscode.window, 'activeTextEditor', descriptor);
    }
    
    return result;
  } catch (error) {
    // Restore original descriptor on error
    if (descriptor) {
      Object.defineProperty(vscode.window, 'activeTextEditor', descriptor);
    }
    throw error;
  }
}
