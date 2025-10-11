import chai from "chai";
import * as vscode from "vscode";
import { GameTextProvider } from "../../src/providers/gameTextProvider";

// Mock VS Code APIs for testing
const mockCreateTextEditorDecorationType = () => ({
  dispose: () => {},
});

const mockEditor = {
  document: {
    getText: () => "~r~Red ~g~Green {FF0000} 0xFF0000FF",
    languageId: "pawn",
    fileName: "test.pwn"
  },
  setDecorations: () => {}
};

// Note: These are integration-style tests that would need a full VS Code environment
// For now, we'll create basic unit tests for the core logic

suite("GameText Provider Tests", () => {
  let provider: GameTextProvider;

  setup(() => {
    // Mock vscode.window.createTextEditorDecorationType
    (global as any).vscode = {
      window: {
        createTextEditorDecorationType: mockCreateTextEditorDecorationType,
        onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
      },
      workspace: {
        onDidChangeTextDocument: () => ({ dispose: () => {} }),
      },
      Color: vscode.Color,
      Range: vscode.Range,
      Position: vscode.Position,
    };
  });

  teardown(() => {
    if (provider) {
      provider.dispose();
    }
  });

  test("GameTextProvider can be created and disposed", () => {
    provider = new GameTextProvider();
    chai.assert.isNotNull(provider);
    
    // Should not throw when disposing
    chai.assert.doesNotThrow(() => provider.dispose());
  });

  test("isPawnFile correctly identifies PAWN files", () => {
    provider = new GameTextProvider();
    
    // Access private method via any cast for testing
    const isPawnFile = (provider as any).isPawnFile;
    
    // Test PAWN language ID
    chai.assert.isTrue(isPawnFile({ languageId: "pawn", fileName: "test.pwn" }));
    
    // Test PAWN file extensions
    chai.assert.isTrue(isPawnFile({ languageId: "plaintext", fileName: "test.pwn" }));
    chai.assert.isTrue(isPawnFile({ languageId: "plaintext", fileName: "test.inc" }));
    chai.assert.isTrue(isPawnFile({ languageId: "plaintext", fileName: "test.p" }));
    chai.assert.isTrue(isPawnFile({ languageId: "plaintext", fileName: "test.pawno" }));
    
    // Test non-PAWN files
    chai.assert.isFalse(isPawnFile({ languageId: "javascript", fileName: "test.js" }));
    chai.assert.isFalse(isPawnFile({ languageId: "plaintext", fileName: "test.txt" }));
  });

  test("getGameTextColor returns correct colors", () => {
    provider = new GameTextProvider();
    
    // Access private method via any cast for testing
    const getGameTextColor = (provider as any).getGameTextColor;
    
    // Test basic colors with correct SA-MP values
    const redColor = getGameTextColor("r", 0);
    chai.assert.isNotNull(redColor);
    chai.assert.approximately(redColor.red, 156/255, 0.001); // SA-MP red
    chai.assert.approximately(redColor.green, 23/255, 0.001);
    chai.assert.approximately(redColor.blue, 26/255, 0.001);
    
    const greenColor = getGameTextColor("g", 0);
    chai.assert.isNotNull(greenColor);
    chai.assert.approximately(greenColor.red, 46/255, 0.001);
    chai.assert.approximately(greenColor.green, 89/255, 0.001); // SA-MP green
    chai.assert.approximately(greenColor.blue, 38/255, 0.001);
    
    const blueColor = getGameTextColor("b", 0);
    chai.assert.isNotNull(blueColor);
    chai.assert.approximately(blueColor.red, 43/255, 0.001);
    chai.assert.approximately(blueColor.green, 51/255, 0.001);
    chai.assert.approximately(blueColor.blue, 110/255, 0.001); // SA-MP blue
    
    // Test invalid color
    const invalidColor = getGameTextColor("x", 0);
    chai.assert.isNull(invalidColor);
  });

  test("regex pattern matches basic GameText codes correctly", () => {
    const gameTextPattern = /~([rgbyplws])~((?:~h~)*)/g;
    
    // Test basic colors without light levels
    const basicTests = [
      "~r~", "~g~", "~b~", "~y~", "~p~", "~w~", "~l~", "~s~"
    ];
    
    for (const test of basicTests) {
      const match = gameTextPattern.exec(test);
      chai.assert.isNotNull(match, `Should match ${test}`);
      chai.assert.equal(match![1], test[1], `Should capture color char from ${test}`);
      chai.assert.equal(match![2], "", `Should have empty light part for ${test}`);
      gameTextPattern.lastIndex = 0; // Reset for next test
    }
    
    // Test with light levels
    const lightTests = [
      { input: "~r~~h~", char: "r", lights: 1 },
      { input: "~g~~h~~h~", char: "g", lights: 2 },
      { input: "~b~~h~~h~~h~", char: "b", lights: 3 }
    ];
    
    for (const test of lightTests) {
      gameTextPattern.lastIndex = 0;
      const match = gameTextPattern.exec(test.input);
      chai.assert.isNotNull(match, `Should match ${test.input}`);
      chai.assert.equal(match![1], test.char, `Should capture color char from ${test.input}`);
      const lightCount = (match![2].match(/~h~/g) || []).length;
      chai.assert.equal(lightCount, test.lights, `Should have ${test.lights} light levels for ${test.input}`);
    }
  });

  test("getGameTextColor applies light levels correctly", () => {
    provider = new GameTextProvider();
    
    // Access private method via any cast for testing
    const getGameTextColor = (provider as any).getGameTextColor;
    
    // Test red with no light levels
    const redNormal = getGameTextColor("r", 0);
    
    // Test red with light levels
    const redLight1 = getGameTextColor("r", 1);
    const redLight2 = getGameTextColor("r", 2);
    
    // Light levels should increase all components
    chai.assert.isAbove(redLight1.red, redNormal.red);
    chai.assert.isAbove(redLight1.green, redNormal.green);
    chai.assert.isAbove(redLight1.blue, redNormal.blue);
    chai.assert.isAbove(redLight2.red, redLight1.red);
    chai.assert.isAbove(redLight2.green, redLight1.green);
    chai.assert.isAbove(redLight2.blue, redLight1.blue);
  });

  test("createDecorationStyle returns correct styles", () => {
    provider = new GameTextProvider();
    
    // Access private method via any cast for testing
    const createDecorationStyle = (provider as any).createDecorationStyle;
    
    const testColor = new vscode.Color(1, 0, 0, 1); // Red
    
    // Test text style
    const textStyle = createDecorationStyle(testColor, "text");
    chai.assert.isDefined(textStyle.color);
    chai.assert.include(textStyle.color, "rgba(255, 0, 0, 1)");
    chai.assert.equal(textStyle.fontWeight, "bold");
    
    // Test underline style
    const underlineStyle = createDecorationStyle(testColor, "underline");
    chai.assert.isDefined(underlineStyle.textDecoration);
    chai.assert.include(underlineStyle.textDecoration, "border-bottom");
    chai.assert.equal(underlineStyle.fontWeight, "bold");
    
    // Test background style
    const backgroundStyle = createDecorationStyle(testColor, "background");
    chai.assert.isDefined(backgroundStyle.backgroundColor);
    chai.assert.isDefined(backgroundStyle.border);
    chai.assert.include(backgroundStyle.backgroundColor, "rgba(255, 0, 0, 0.2)");
  });

  test("findGameTextFollowingText finds text after GameText codes", () => {
    provider = new GameTextProvider();
    
    // Create a mock text document
    const testText = `GameTextForPlayer(playerid, "~r~Red Text~g~Green Text", 3000, 1);`;
    const mockDocument = {
      getText: () => testText,
      positionAt: (index: number) => ({ line: 0, character: index }),
      lineAt: (line: number) => ({ range: { end: { line: 0, character: testText.length } } })
    };
    
    const mockEditor = {
      document: mockDocument
    };
    
    // Access private method via any cast for testing
    const findGameTextFollowingText = (provider as any).findGameTextFollowingText;
    
    // Find the ~r~ position
    const redCodeIndex = testText.indexOf('~r~');
    const afterRedCodeIndex = redCodeIndex + 3; // After "~r~"
    
    const textRange = findGameTextFollowingText(mockEditor, afterRedCodeIndex);
    
    chai.assert.isNotNull(textRange);
    if (textRange) {
      const expectedStart = afterRedCodeIndex;
      const expectedEnd = testText.indexOf('~g~');
      
      chai.assert.equal(textRange.start.character, expectedStart);
      chai.assert.equal(textRange.end.character, expectedEnd);
    }
  });
});

suite('Hex Parameter Edge Cases Tests', () => {
  let provider: GameTextProvider;
  
  setup(() => {
    provider = new GameTextProvider();
  });
  
  teardown(() => {
    provider.dispose();
  });

  const edgeCaseTests = [
    // Basic function calls
    {
      name: "Standard SendClientMessage",
      code: `SendClientMessage(playerid, 0xFF0000FF, "Red message");`,
      expected: { function: "SendClientMessage", hex: "0xFF0000FF", text: "Red message" }
    },
    {
      name: "Custom function with Ex suffix",
      code: `SendClientMessageEx(playerid, 0x00FF00FF, "Green message");`,
      expected: { function: "SendClientMessageEx", hex: "0x00FF00FF", text: "Green message" }
    },
    {
      name: "Completely custom function",
      code: `MyCustomFunction(param, 0x0000FFFF, "Blue message");`,
      expected: { function: "MyCustomFunction", hex: "0x0000FFFF", text: "Blue message" }
    },
    
    // Edge cases that should work
    {
      name: "Nested function calls",
      code: `SendMessage(GetPlayer(id + 1), 0xFF0000FF, "Nested");`,
      expected: { function: "SendMessage", hex: "0xFF0000FF", text: "Nested" }
    },
    {
      name: "Multiple hex values (should match last one before string)",
      code: `ComplexFunc(0x12345678, player, 0xFF0000FF, "Should match second");`,
      expected: { function: "ComplexFunc", hex: "0xFF0000FF", text: "Should match second" }
    },
    {
      name: "Escaped quotes in string",
      code: `TestFunc(id, 0xFF0000FF, "He said \\"Hello\\" to me");`,
      expected: { function: "TestFunc", hex: "0xFF0000FF", text: `He said \\"Hello\\" to me` }
    },
    {
      name: "Function name with numbers and underscores",
      code: `Send2Player_Ex(id, 0xFF0000FF, "Custom naming");`,
      expected: { function: "Send2Player_Ex", hex: "0xFF0000FF", text: "Custom naming" }
    },
    {
      name: "6-character hex (valid PAWN format)",
      code: `TestFunc6(id, 0xFF0000, "Six chars valid");`,
      expected: { function: "TestFunc6", hex: "0xFF0000", text: "Six chars valid" }
    },
    {
      name: "Lots of whitespace",
      code: `SpacyFunc(   id   ,   0xFF0000FF   ,   "Lots of spaces"   );`,
      expected: { function: "SpacyFunc", hex: "0xFF0000FF", text: "Lots of spaces" }
    },
    {
      name: "Long parameter list",
      code: `VeryLongFunc(a, b, c, d, e, f, g, h, i, j, 0xFF0000FF, "Long params");`,
      expected: { function: "VeryLongFunc", hex: "0xFF0000FF", text: "Long params" }
    },
    {
      name: "Hex content in string (should not interfere)",
      code: `TestFunc(id, 0xFF0000FF, "Message has 0x123456 inside");`,
      expected: { function: "TestFunc", hex: "0xFF0000FF", text: "Message has 0x123456 inside" }
    },
    {
      name: "Multiple string parameters (should match first)",
      code: `MultiString(id, 0xFF0000FF, "First string", "Second string");`,
      expected: { function: "MultiString", hex: "0xFF0000FF", text: "First string" }
    }
  ];

  edgeCaseTests.forEach((testCase, index) => {
    test(`should handle ${testCase.name}`, () => {
      // Create mock editor
      const mockEditor = {
        document: {
          getText: () => testCase.code,
          positionAt: (offset: number) => ({ line: 0, character: offset }),
        }
      } as any;

      // Test the hex parameter pattern directly
      const hexParameterPattern = /\b(\w+)\s*\([^"]*?(0x[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)\s*,\s*"((?:[^"\\]|\\.)*)"/g;
      const matches = [...testCase.code.matchAll(hexParameterPattern)];
      
      chai.assert.isTrue(matches.length > 0, `Should find at least one match in: ${testCase.code}`);
      
      if (matches.length > 0) {
        const match = matches[0];
        chai.assert.equal(match[1], testCase.expected.function, `Function name should be ${testCase.expected.function}`);
        chai.assert.equal(match[2], testCase.expected.hex, `Hex color should be ${testCase.expected.hex}`);
        chai.assert.equal(match[3], testCase.expected.text, `String content should be "${testCase.expected.text}"`);
      }
    });
  });

  const invalidCases = [
    {
      name: "No string parameter",
      code: `NoString(id, 0xFF0000FF);`,
      shouldMatch: false
    },
    {
      name: "Hex too short",
      code: `TooShort(id, 0xFF00, "short");`,
      shouldMatch: false
    },
    {
      name: "Invalid hex characters",
      code: `InvalidHex(id, 0xGGGGGGFF, "bad");`,
      shouldMatch: false
    },
    {
      name: "Missing 0x prefix",
      code: `MissingPrefix(id, FF0000FF, "no0x");`,
      shouldMatch: false
    },
    {
      name: "Hex too long",
      code: `TooLong(id, 0xFF0000FFAA, "10chars");`,
      shouldMatch: false
    }
  ];

  invalidCases.forEach((testCase) => {
    test(`should NOT match ${testCase.name}`, () => {
      const hexParameterPattern = /\b(\w+)\s*\([^"]*?(0x[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)\s*,\s*"((?:[^"\\]|\\.)*)"/g;
      const matches = [...testCase.code.matchAll(hexParameterPattern)];
      
      if (testCase.shouldMatch) {
        chai.assert.isTrue(matches.length > 0, `Should find matches in: ${testCase.code}`);
      } else {
        chai.assert.equal(matches.length, 0, `Should NOT find matches in: ${testCase.code}`);
      }
    });
  });

  test('should handle multi-line function calls', () => {
    const multiLineCode = `MultiLineFunc(
        playerid,
        0xFFFF00FF,
        "Yellow message"
    );`;
    
    const hexParameterPattern = /\b(\w+)\s*\([^"]*?(0x[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)\s*,\s*"((?:[^"\\]|\\.)*)"/g;
    const matches = [...multiLineCode.matchAll(hexParameterPattern)];
    
    chai.assert.equal(matches.length, 1, "Should find exactly one match in multi-line function");
    
    if (matches.length > 0) {
      const match = matches[0];
      chai.assert.equal(match[1], "MultiLineFunc");
      chai.assert.equal(match[2], "0xFFFF00FF");
      chai.assert.equal(match[3], "Yellow message");
    }
  });
});
