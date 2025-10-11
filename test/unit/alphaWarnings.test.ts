import chai from "chai";
import * as vscode from "vscode";
import { AlphaWarningsManager } from "../../src/utils/alphaWarnings";

// Mock VS Code APIs for testing
const mockCreateTextEditorDecorationType = () => ({
  dispose: () => {},
});

const mockEditor = {
  document: {
    getText: () => "",
    languageId: "pawn",
    fileName: "test.pwn",
    positionAt: (offset: number) => ({ line: 0, character: offset }),
  },
  setDecorations: () => {}
};

suite("Alpha Warnings Tests", () => {
  let alphaWarningsManager: AlphaWarningsManager;

  setup(() => {
    // Mock vscode.window.createTextEditorDecorationType
    (global as any).vscode = {
      window: {
        createTextEditorDecorationType: mockCreateTextEditorDecorationType,
        onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
      },
      workspace: {
        onDidChangeTextDocument: () => ({ dispose: () => {} }),
        getConfiguration: () => ({
          get: (setting: string) => {
            if (setting === "hex.showAlphaWarnings") return true;
            return undefined;
          }
        })
      },
      Range: vscode.Range,
      Position: vscode.Position,
    };
  });

  teardown(() => {
    if (alphaWarningsManager) {
      alphaWarningsManager.dispose();
    }
  });

  test("AlphaWarningsManager can be created and disposed", () => {
    alphaWarningsManager = new AlphaWarningsManager();
    chai.assert.isNotNull(alphaWarningsManager);
    
    // Should not throw when disposed
    alphaWarningsManager.dispose();
  });

  test("detects hex colors with alpha 0", () => {
    const testText = `
      new color1 = 0xFF000000; // Red with alpha 0
      new color2 = 0x00FF0000; // Green with alpha 0  
      new color3 = 0x0000FF00; // Blue with alpha 0
      new normalColor = 0xFF0000FF; // Normal color
    `;

    // Test the regex pattern directly
    const hexAlphaRegex = /\b0x[0-9A-Fa-f]{6}00\b/g;
    const matches = [...testText.matchAll(hexAlphaRegex)];
    
    chai.assert.equal(matches.length, 3, "Should find 3 alpha-0 colors");
    
    // Check specific matches
    chai.assert.equal(matches[0][0], "0xFF000000");
    chai.assert.equal(matches[1][0], "0x00FF0000");
    chai.assert.equal(matches[2][0], "0x0000FF00");
  });

  test("does not match normal colors or invalid patterns", () => {
    const testText = `
      new normal1 = 0xFF0000FF; // Normal red
      new normal2 = 0x00FF00AA; // Normal green with partial alpha
      new invalid1 = 0xFF00; // Too short
      new invalid2 = 0xFF000000AA; // Too long
      new notHex = FF000000; // Missing 0x prefix
    `;

    const hexAlphaRegex = /\b0x[0-9A-Fa-f]{6}00\b/g;
    const matches = [...testText.matchAll(hexAlphaRegex)];
    
    chai.assert.equal(matches.length, 0, "Should not match any non-alpha-0 patterns");
  });

  test("isPawnFile correctly identifies PAWN files", () => {
    alphaWarningsManager = new AlphaWarningsManager();
    
    // Access private method for testing
    const isPawnFile = (alphaWarningsManager as any).isPawnFile;
    
    const pawnDoc = { languageId: "pawn", fileName: "test.pwn" };
    const pwninDoc = { languageId: "other", fileName: "test.pwn" };
    const incDoc = { languageId: "other", fileName: "test.inc" };
    const jsDoc = { languageId: "javascript", fileName: "test.js" };
    
    chai.assert.isTrue(isPawnFile(pawnDoc), "Should recognize pawn language");
    chai.assert.isTrue(isPawnFile(pwninDoc), "Should recognize .pwn extension");
    chai.assert.isTrue(isPawnFile(incDoc), "Should recognize .inc extension");
    chai.assert.isFalse(isPawnFile(jsDoc), "Should not recognize non-PAWN files");
  });

  test("handles mixed alpha values correctly", () => {
    const testText = `
      #define COLOR_RED_INVISIBLE 0xFF000000
      #define COLOR_GREEN_VISIBLE 0x00FF00FF
      SendClientMessage(playerid, 0x0000FF00, "Blue invisible message");
      SetPlayerColor(playerid, 0xFFFF00AA); // Yellow semi-transparent
    `;

    const hexAlphaRegex = /\b0x[0-9A-Fa-f]{6}00\b/g;
    const matches = [...testText.matchAll(hexAlphaRegex)];
    
    chai.assert.equal(matches.length, 2, "Should find exactly 2 alpha-0 colors");
    chai.assert.equal(matches[0][0], "0xFF000000");
    chai.assert.equal(matches[1][0], "0x0000FF00");
  });

  test("case insensitive hex matching", () => {
    const testText = `
      new lower = 0xff000000;
      new upper = 0xFF000000; 
      new mixed = 0xFf000000;
    `;

    const hexAlphaRegex = /\b0x[0-9A-Fa-f]{6}00\b/g;
    const matches = [...testText.matchAll(hexAlphaRegex)];
    
    chai.assert.equal(matches.length, 3, "Should match hex colors regardless of case");
  });
});
