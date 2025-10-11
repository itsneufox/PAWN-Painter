# PAWN Painter - Visual Studio Code Extension

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/itsneufox.pawn-painter)](https://marketplace.visualstudio.com/items?itemName=itsneufox.pawn-painter)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Advanced colour highlighting and picker for PAWN scripting language**

PAWN Painter is a Visual Studio Code extension designed specifically for PAWN developers working on SA-MP and open.mp projects. It provides intelligent colour detection, highlighting, and conversion tools for all PAWN colour formats.

## Features

### PAWN-Specific Colour Support
- **Hex Colours**: `0xFF0000FF`, `0xFF0000` (with/without alpha)
- **Braced Colours**: `{FF0000}`, `{00FF00}`, `{0000FF}`
- **RGB Arrays**: `{255, 0, 0}`, `{0, 255, 0}`
- **GameText Codes**: `~r~`, `~g~`, `~b~`, `~y~`, `~p~`, `~l~`, `~w~`, `~s~`

### Smart Text Colouring
- **GameText Text Highlighting**: Text following GameText codes gets coloured
- **Inline Braced Colours**: Text following `{RRGGBB}` codes in strings
- **Hex Parameter Colouring**: String parameters coloured by hex function arguments
- **Light Level Support**: `~r~~h~`, `~g~~h~~h~` for lighter GameText colours

### Advanced Features
- **Colour Picker Integration**: Click colour squares to open VS Code's colour picker
- **Context Menu Conversion**: Right-click to convert between PAWN colour formats
- **Alpha Warnings**: Alerts for invisible colours (alpha value 00)
- **GameText Crash Prevention**: Warns about uneven tildes in GameText functions that can crash players
- **Ignored Lines**: Exclude specific lines from colour detection
- **Performance Mode**: Lightweight mode for large files

### Comprehensive Customisation
- **Individual toggles** for each colour feature
- **Multiple visual styles**: text, underline, background highlighting
- **Configurable alpha warnings** with custom highlighting
- **Performance optimisation** options

## Installation

1. Open Visual Studio Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "PAWN Painter"
4. Click Install

Or install from [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=itsneufox.pawn-painter)

## Usage

### Basic Colour Detection
PAWN Painter automatically detects and highlights colours in `.pwn`, `.inc`, `.p`, and `.pawno` files:

```pawn
// Hex colours - show colour picker squares
new red = 0xFF0000FF;
new green = 0x00FF00;

// Braced colours - show colour picker squares  
new color1 = {FF0000};
new color2 = {00FF00};

// RGB arrays - show colour picker squares
new rgbRed[3] = {255, 0, 0};
```

### GameText Colour Highlighting
Text following GameText codes gets coloured appropriately:

```pawn
// GameText codes colour the following text
SendClientMessage(playerid, -1, "~r~This text is red ~g~This text is green");

// Light levels make colours progressively lighter
SendClientMessage(playerid, -1, "~r~~h~Light red ~g~~h~~h~Very light green");
```

### GameText Crash Prevention
PAWN Painter warns about dangerous GameText usage that can crash players:

```pawn
// ⚠️ WARNING: Uneven tildes may crash players
GameTextForAll("~r~Hello, ~g~world~", 5000, 3);  // 5 tildes (odd number)
GameTextForPlayer(playerid, "~", 3000, 1);       // 1 tilde (odd number)

// ✅ SAFE: Even number of tildes
GameTextForAll("~r~Hello, ~g~world!", 5000, 3);  // 4 tildes (even number)
GameTextForPlayer(playerid, "~w~Safe message", 3000, 1); // 2 tildes (even)
```

**Note**: This warning only applies to `GameTextForAll` and `GameTextForPlayer` functions. Other functions like `SendClientMessage` are safe from this issue.

### Inline Text Colouring
Braced colours within strings colour the following text:

```pawn
SendClientMessage(playerid, -1, "Normal text {FF0000}red text {00FF00}green text");
```

### Hex Parameter Text Colouring
String parameters are coloured based on preceding hex values:

```pawn
// String gets coloured based on the hex parameter
SendClientMessage(playerid, 0xFF0000FF, "This message appears red");
SendClientMessage(playerid, 0x00FF00FF, "This message appears green");
```

### Colour Conversion
Right-click on any colour to convert between formats:

```pawn
// Select and right-click any of these to convert
0xFF0000FF  →  Convert to braced, RGB, etc.
{FF0000}    →  Convert to hex, RGB, etc.
255, 0, 0   →  Convert to hex, braced, etc.
```

## Settings

Access settings via `Ctrl+,` / `Cmd+,` and search for "pawn-painter"

### General Settings
| Setting | Description | Default |
|---------|-------------|---------|
| `pawn-painter.general.disable` | Disable the entire extension | `false` |
| `pawn-painter.general.enableColorPicker` | Enable VS Code colour picker squares | `true` |
| `pawn-painter.general.lowPerformanceMode` | Show only colour picker squares, disable text decorations | `false` |

### GameText Settings
| Setting | Description | Default |
|---------|-------------|---------|
| `pawn-painter.gameText.textEnabled` | Enable text highlighting after GameText codes | `true` |
| `pawn-painter.gameText.textStyle` | Visual style for GameText text | `"text"` |

### Inline Text Settings
| Setting | Description | Default |
|---------|-------------|---------|
| `pawn-painter.inlineText.textEnabled` | Enable text highlighting after braced colours | `true` |
| `pawn-painter.inlineText.textStyle` | Visual style for inline text | `"text"` |

### Hex Parameter Settings
| Setting | Description | Default |
|---------|-------------|---------|
| `pawn-painter.hexParameter.textEnabled` | Enable string colouring by hex parameters | `true` |
| `pawn-painter.hexParameter.textStyle` | Visual style for hex parameter text | `"text"` |

### Alpha Warnings
| Setting | Description | Default |
|---------|-------------|---------|
| `pawn-painter.hex.showAlphaWarnings` | Show warnings for alpha 00 colours | `true` |
| `pawn-painter.alphaWarnings.highlightCode` | Highlight the colour code itself | `true` |
| `pawn-painter.alphaWarnings.highlightStyle` | How to highlight the colour code | `"underline"` |

## Visual Styles

Choose from different highlighting styles:
- **text**: Colours the text itself
- **underline**: Adds coloured underline
- **background**: Adds coloured background

## Ignored Lines

Exclude specific lines or entire files from colour detection:

1. **Ignore Line**: Right-click → "Ignore Line"
2. **Ignore File**: Right-click → "Ignore File"
3. **View Ignored**: Command palette → "Show Ignored Lines"
4. **Clear All**: Command palette → "Clear All Ignored Lines"

## Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `PAWN Painter: Convert Colour` | Convert selected colour to different format |
| `PAWN Painter: Toggle Hex Colour Highlight` | Toggle hex colour highlighting |
| `PAWN Painter: Toggle GameText Colour Picker` | Toggle GameText colour picker |
| `PAWN Painter: Ignore Line` | Ignore current line |
| `PAWN Painter: Ignore File` | Ignore entire file |
| `PAWN Painter: Show Ignored Lines` | View all ignored lines |
| `PAWN Painter: Clear Ignored Lines` | Clear all ignored lines |

## Troubleshooting

### Performance Issues
- Enable **Low Performance Mode** for large files
- Use **Ignore File** for files that don't need colour detection

### Colour Conflicts
PAWN Painter uses a priority system to prevent conflicts:
1. **GameText colours** (highest priority)
2. **Inline braced colours** 
3. **Hex parameter colours** (lowest priority)

### Alpha Warnings
Colours with alpha value `00` are invisible. PAWN Painter shows warnings for these and enforces minimum 30% opacity for readability.

## Development

### Requirements
- Node.js 16+
- VS Code 1.74+

### Building
```bash
npm install
npm run compile
npm run package
```

### Testing
```bash
npm test
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- SA-MP and open.mp communities for PAWN development
- PAWN scripting language community

---

**Happy PAWN coding!**
