// PAWN Painter Test File - Color Feature Testing
// This file tests all color detection and highlighting features

// =============================================================================
// HEX COLORS (0xRRGGBB and 0xRRGGBBAA)
// =============================================================================

// Basic hex colors - should show color picker squares
new red = 0xFF0000;
new green = 0x00FF00;
new blue = 0x0000FF;
new white = 0xFFFFFF;
new black = 0x000000;

// Hex colors with alpha - should show color picker squares
new redAlpha = 0xFF0000FF;
new greenAlpha = 0x00FF00FF;
new blueAlpha = 0x0000FFFF;
new transparentRed = 0xFF000080;
new invisibleColor = 0xFF000000; // Should trigger alpha warning

// =============================================================================
// BRACED COLORS {RRGGBB}
// =============================================================================

// Basic braced colors - should show color picker squares
new color1 = {FF0000}; // Red
new color2 = {00FF00}; // Green
new color3 = {0000FF}; // Blue
new color4 = {FFFF00}; // Yellow
new color5 = {FF00FF}; // Magenta

// =============================================================================
// RGB COLORS (r, g, b format)
// =============================================================================

// RGB format colors - should show color picker squares
new rgbRed[3] = {255, 0, 0};
new rgbGreen[3] = {0, 255, 0};
new rgbBlue[3] = {0, 0, 255};
new rgbWhite[3] = {255, 255, 255};

// =============================================================================
// GAMETEXT COLORS (~r~, ~g~, ~b~, etc.)
// =============================================================================

// Basic GameText colors - text following should be colored
format(string, sizeof(string), "~r~This text should be red");
format(string, sizeof(string), "~g~This text should be green");
format(string, sizeof(string), "~b~This text should be blue");
format(string, sizeof(string), "~y~This text should be yellow");
format(string, sizeof(string), "~p~This text should be purple");
format(string, sizeof(string), "~l~This text should be black");
format(string, sizeof(string), "~w~This text should be white");
format(string, sizeof(string), "~s~This text should be light grey");

// GameText with light levels - should progressively lighten
format(string, sizeof(string), "~r~~h~This red text should be lighter");
format(string, sizeof(string), "~g~~h~~h~This green text should be very light");
format(string, sizeof(string), "~b~~h~~h~~h~This blue text should be lightest");

// Mixed GameText colors in one string
format(string, sizeof(string), "~r~Red ~g~Green ~b~Blue ~w~White text");

// =============================================================================
// HEX PARAMETER TEXT COLORING
// =============================================================================

// Functions with hex parameters - string text should be colored based on hex
SendClientMessage(playerid, 0xFF0000FF, "This message should be red");
SendClientMessage(playerid, 0x00FF00FF, "This message should be green"); 
SendClientMessage(playerid, 0x0000FFFF, "This message should be blue");
SendClientMessage(playerid, 0xFFFF00FF, "This message should be yellow");
SendClientMessage(playerid, 0xFF00FFFF, "This message should be magenta");

// Different function names should also work
SendClientMessageToAll(0xFF0000FF, "Red message to everyone");
ShowPlayerDialog(playerid, 1, DIALOG_STYLE_MSGBOX, "Title", "~r~Red dialog text", "OK", "");

// Hex with alpha 0 - should show alpha warning and respect minimum alpha
SendClientMessage(playerid, 0xFF000000, "This should show alpha warning but still be readable");

// 6-character hex (valid PAWN format)
SendClientMessage(playerid, 0xFF0000, "This red message uses 6-char hex");

// =============================================================================
// INLINE TEXT COLORING (braced colors in strings)
// =============================================================================

// Braced colors within strings - text following should be colored
SendClientMessage(playerid, -1, "Normal text {FF0000}red text {00FF00}green text");
SendClientMessage(playerid, -1, "Start normal {0000FF}blue text {FFFF00}yellow text end");
SendClientMessage(playerid, -1, "Multiple {FF00FF}magenta {00FFFF}cyan {FFA500}orange colors");

// Mixed with GameText
SendClientMessage(playerid, -1, "~r~GameText red {00FF00}braced green ~b~GameText blue");

// =============================================================================
// EDGE CASES AND COMPLEX SCENARIOS
// =============================================================================

// Multi-line function calls
SendClientMessage(
    playerid, 
    0xFF0000FF, 
    "This red message spans multiple lines"
);

// Nested function calls
format(string, sizeof(string), "Player connected with color %s", 
    SendClientMessage(playerid, 0x00FF00FF, "Green notification"));

// Long parameter lists
ShowPlayerDialog(playerid, 1, DIALOG_STYLE_INPUT, "Title", 
    SendClientMessage(playerid, 0x0000FFFF, "Blue input dialog"), "Accept", "Cancel");

// Escaped quotes in strings
SendClientMessage(playerid, 0xFF0000FF, "Message with \"quoted text\" inside");

// Hex content in string (should not interfere with parameter coloring)
SendClientMessage(playerid, 0x00FF00FF, "This mentions hex 0xFF0000 but parameter colors it green");

// =============================================================================
// IGNORED LINES TESTING
// =============================================================================

// These lines can be used to test the ignored lines feature
// Right-click and select "Ignore Line" to exclude from color detection
new testIgnore1 = 0xFF0000; // Try ignoring this line
new testIgnore2 = {00FF00}; // Try ignoring this line
SendClientMessage(playerid, 0x0000FFFF, "Try ignoring this line");

// =============================================================================
// CONTEXT MENU TESTING
// =============================================================================

// Select these colors and right-click to test color conversion
// 0xFF0000FF
// {FF0000}
// 255, 0, 0
// 0x00FF00
// {00FF00}

// =============================================================================
// ALPHA WARNING TESTING
// =============================================================================

// These should trigger alpha warnings (alpha value = 00)
new invisible1 = 0xFF000000;
new invisible2 = 0x00FF0000;  
new invisible3 = 0x0000FF00;
SendClientMessage(playerid, 0xFFFF0000, "This should show alpha warning");

// =============================================================================
// PERFORMANCE TESTING
// =============================================================================

// Large number of colors for performance testing
new perfTest1 = 0xFF0000, perfTest2 = 0x00FF00, perfTest3 = 0x0000FF;
new perfTest4 = 0xFFFF00, perfTest5 = 0xFF00FF, perfTest6 = 0x00FFFF;
new perfTest7 = {FF0000}, perfTest8 = {00FF00}, perfTest9 = {0000FF};
new perfTest10 = {FFFF00}, perfTest11 = {FF00FF}, perfTest12 = {00FFFF};