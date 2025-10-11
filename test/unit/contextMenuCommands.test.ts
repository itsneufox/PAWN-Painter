import chai from "chai";
import * as vscode from "vscode";
import { ContextMenuCommands } from "../../src/commands/contextMenuCommands";

// Mock VS Code APIs for testing
const mockEditor = {
  document: {
    getText: () => "0xFF0000FF",
  },
  selection: {
    isEmpty: false,
    start: { line: 0, character: 0 },
    end: { line: 0, character: 10 }
  },
  edit: () => Promise.resolve(true)
};

suite("Context Menu Commands Tests", () => {
  let contextMenuCommands: ContextMenuCommands;

  setup(() => {
    // Mock vscode APIs
    (global as any).vscode = {
      window: {
        activeTextEditor: mockEditor,
        showErrorMessage: () => {},
        showInformationMessage: () => {}
      },
      commands: {
        registerCommand: () => ({ dispose: () => {} })
      },
      workspace: {
        getConfiguration: () => ({
          get: () => undefined
        })
      }
    };
  });

  teardown(() => {
    if (contextMenuCommands) {
      contextMenuCommands.dispose();
    }
  });

  test("ContextMenuCommands can be created and disposed", () => {
    contextMenuCommands = new ContextMenuCommands();
    chai.assert.isNotNull(contextMenuCommands);
    
    // Should not throw when disposed
    contextMenuCommands.dispose();
  });

  test("parseColorString handles basic PAWN color formats", () => {
    const validCases = [
      "0xFF0000FF",      // Hex with alpha
      "#FF0000"          // Standard hex format
    ];

    // Import parseColorString directly for testing
    const { parseColorString } = require("../../src/utils/helpers");
    
    validCases.forEach(testCase => {
      const result = parseColorString(testCase);
      chai.assert.isNotNull(result, `Should parse ${testCase} as a valid color`);
    });
  });

  test("parseColorString rejects invalid formats", () => {
    const { parseColorString } = require("../../src/utils/helpers");
    
    const invalidCases = [
      "not a color",
      "0xGGGGGG",
      "{GGGGGG}",
      "300, 400, 500", // Out of range RGB
      ""
    ];

    invalidCases.forEach(testCase => {
      const result = parseColorString(testCase);
      chai.assert.isNull(result, `Should reject ${testCase} as invalid`);
    });
  });

  test("color conversion methods exist", () => {
    contextMenuCommands = new ContextMenuCommands();
    
    // Test that the commands were registered (we can't easily test the actual conversion without a full VS Code environment)
    chai.assert.isNotNull(contextMenuCommands);
    
    // The actual conversion logic is tested through the parseColorString and PawnColorTranslator tests
  });
});
