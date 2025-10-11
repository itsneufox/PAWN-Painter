import chai from "chai";
import { getMatches, getGameTextMatches } from "../../src/getMatches";
import * as vscode from "vscode";

suite("PAWN Color Matches Tests", () => {
  test("Matches PAWN hex colors (0xRRGGBB)", async () => {
    const testText = "const red = 0xFF0000; const green = 0x00FF00;";
    const matches = await getMatches(testText);
    
    chai.assert.equal(matches.length, 2);
    
    // Check red color
    const redMatch = matches[0];
    chai.assert.equal(Math.round(redMatch.color.red * 255), 255);
    chai.assert.equal(Math.round(redMatch.color.green * 255), 0);
    chai.assert.equal(Math.round(redMatch.color.blue * 255), 0);
    chai.assert.equal(redMatch.color.alpha, 1);
    
    // Check green color
    const greenMatch = matches[1];
    chai.assert.equal(Math.round(greenMatch.color.red * 255), 0);
    chai.assert.equal(Math.round(greenMatch.color.green * 255), 255);
    chai.assert.equal(Math.round(greenMatch.color.blue * 255), 0);
    chai.assert.equal(greenMatch.color.alpha, 1);
  });

  test("Matches PAWN hex colors with alpha (0xRRGGBBAA)", async () => {
    const testText = "const redAlpha = 0xFF000080;"; // Red with 50% alpha
    const matches = await getMatches(testText);
    
    chai.assert.equal(matches.length, 1);
    
    const match = matches[0];
    chai.assert.equal(Math.round(match.color.red * 255), 255);
    chai.assert.equal(Math.round(match.color.green * 255), 0);
    chai.assert.equal(Math.round(match.color.blue * 255), 0);
    chai.assert.approximately(match.color.alpha, 0.5, 0.01); // 128/255 ≈ 0.5
  });

  test("Matches PAWN braced colors {RRGGBB}", async () => {
    const testText = "SendClientMessage(playerid, {FF0000}, \"Red message\");";
    const matches = await getMatches(testText);
    
    chai.assert.equal(matches.length, 1);
    
    const match = matches[0];
    chai.assert.equal(Math.round(match.color.red * 255), 255);
    chai.assert.equal(Math.round(match.color.green * 255), 0);
    chai.assert.equal(Math.round(match.color.blue * 255), 0);
    chai.assert.equal(match.color.alpha, 1);
  });


  test("Matches PAWN RGB colors", async () => {
    const testText = "SetPlayerColor(playerid, 255, 128, 64);";
    const matches = await getMatches(testText);
    
    chai.assert.equal(matches.length, 1);
    
    const match = matches[0];
    chai.assert.equal(Math.round(match.color.red * 255), 255);
    chai.assert.equal(Math.round(match.color.green * 255), 128);
    chai.assert.equal(Math.round(match.color.blue * 255), 64);
    chai.assert.equal(match.color.alpha, 1);
  });

  test("Ignores invalid PAWN colors", async () => {
    const testText = `
      const invalid1 = 0x12; // Too short
      const invalid2 = {12345}; // Wrong length
      const invalid3 = 300, 400, 500; // Out of range
      const invalid4 = 123; // Too short decimal
    `;
    const matches = await getMatches(testText);
    
    chai.assert.equal(matches.length, 0);
  });

  test("Matches multiple PAWN color formats in mixed content", async () => {
    const testText = `
      #define COLOR_RED 0xFF0000FF
      SendClientMessage(playerid, {00FF00}, "Green message");
      SetPlayerColor(playerid, 0, 0, 255);
      const yellow = 4294967040;
    `;
    const matches = await getMatches(testText);
    
    chai.assert.equal(matches.length, 3); // hex, braced, rgb
  });
});

suite("PAWN GameText Color Matches Tests", () => {
  test("Matches basic GameText colors", () => {
    const testText = "~r~Red ~g~Green ~b~Blue ~y~Yellow";
    const matches = getGameTextMatches(testText);
    
    chai.assert.equal(matches.length, 4);
    
    // Check red (SA-MP colors)
    const redMatch = matches[0];
    chai.assert.equal(Math.round(redMatch.color.red * 255), 156);
    chai.assert.equal(Math.round(redMatch.color.green * 255), 23);
    chai.assert.equal(Math.round(redMatch.color.blue * 255), 26);
    
    // Check green (SA-MP colors)
    const greenMatch = matches[1];
    chai.assert.equal(Math.round(greenMatch.color.red * 255), 46);
    chai.assert.equal(Math.round(greenMatch.color.green * 255), 89);
    chai.assert.equal(Math.round(greenMatch.color.blue * 255), 38);
  });

  test("Matches GameText colors with light levels", () => {
    const testText = "~r~~h~Light Red ~g~~h~~h~Very Light Green";
    const matches = getGameTextMatches(testText);
    
    chai.assert.equal(matches.length, 2);
    
    // Light red should be lighter than pure red (SA-MP color system)
    const lightRedMatch = matches[0];
    chai.assert.isAbove(lightRedMatch.color.red, 156/255); // Should be lighter than base red
    chai.assert.isAbove(lightRedMatch.color.green, 23/255); // Should be lighter than base green
    chai.assert.isAbove(lightRedMatch.color.blue, 26/255); // Should be lighter than base blue
  });

  test("Matches all GameText color characters", () => {
    const testText = "~r~Red ~g~Green ~b~Blue ~y~Yellow ~p~Purple ~l~Black ~w~White ~s~Silver";
    const matches = getGameTextMatches(testText);
    
    chai.assert.equal(matches.length, 8);
  });

  test("Ignores invalid GameText colors", () => {
    const testText = "~x~Invalid ~z~Wrong ~1~Number";
    const matches = getGameTextMatches(testText);
    
    chai.assert.equal(matches.length, 0);
  });
});
