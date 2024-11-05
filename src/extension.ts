import * as vscode from 'vscode';

interface GameTextColor {
    baseColor: vscode.Color;
    symbol: string;
}

const gameTextColors: { [key: string]: GameTextColor } = {
    'r': { baseColor: new vscode.Color(0.61, 0.09, 0.10, 1), symbol: '~r~' },
    'g': { baseColor: new vscode.Color(0.18, 0.35, 0.15, 1), symbol: '~g~' },
    'b': { baseColor: new vscode.Color(0.17, 0.20, 0.43, 1), symbol: '~b~' },
    'y': { baseColor: new vscode.Color(0.77, 0.65, 0.34, 1), symbol: '~y~' },
    'p': { baseColor: new vscode.Color(0.57, 0.37, 0.85, 1), symbol: '~p~' },
    'w': { baseColor: new vscode.Color(0.77, 0.77, 0.77, 1), symbol: '~w~' },
    'l': { baseColor: new vscode.Color(0, 0, 0, 1), symbol: '~l~' },
};

const lightenedColors: { [key: string]: vscode.Color[] } = {
    'r': [
        new vscode.Color(0.86, 0.12, 0.14, 1),
        new vscode.Color(0.86, 0.19, 0.22, 1),
        new vscode.Color(0.86, 0.28, 0.32, 1),
        new vscode.Color(0.86, 0.42, 0.49, 1),
        new vscode.Color(0.86, 0.62, 0.73, 1)
    ],
    'g': [
        new vscode.Color(0.27, 0.53, 0.22, 1),
        new vscode.Color(0.41, 0.80, 0.34, 1),
        new vscode.Color(0.61, 0.87, 0.50, 1)
    ],
    'b': [
        new vscode.Color(0.25, 0.31, 0.65, 1),
        new vscode.Color(0.38, 0.46, 0.87, 1),
        new vscode.Color(0.57, 0.69, 0.87, 1)
    ],
    'p': [
        new vscode.Color(0.85, 0.56, 0.87, 1),
        new vscode.Color(0.87, 0.84, 0.87, 1)
    ],
    'y': [
        new vscode.Color(0.87, 0.87, 0.50, 1),
        new vscode.Color(0.87, 0.87, 0.75, 1)
    ],
    'w': [
        new vscode.Color(0.87, 0.87, 0.87, 1)
    ]
};

let normalColorPickerEnabled: boolean;
let gameTextColorPickerEnabled: boolean;

function getLightenedColor(baseColor: vscode.Color, level: number): vscode.Color {
    const baseColorKey = Object.keys(gameTextColors).find(key => {
        const gameColor = gameTextColors[key];
        return gameColor && gameColor.baseColor.red === baseColor.red &&
               gameColor.baseColor.green === baseColor.green &&
               gameColor.baseColor.blue === baseColor.blue &&
               gameColor.baseColor.alpha === baseColor.alpha;
    });
    
    if (!baseColorKey || !(baseColorKey in lightenedColors)) {
        return baseColor;
    }

    const colorArray = lightenedColors[baseColorKey] || [];
    return (level > 0 && level - 1 < colorArray.length) ? colorArray[level - 1] : baseColor;
}

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('pawnpainter');
    normalColorPickerEnabled = config.get('enableColorPicker', true);
    gameTextColorPickerEnabled = config.get('enableGameTextColors', false);

    // Register commands for toggling color pickers
    context.subscriptions.push(vscode.commands.registerCommand("pawnpainter.toggleNormalColorPicker", async () => {
        const config = vscode.workspace.getConfiguration('pawnpainter');
        normalColorPickerEnabled = !config.get('enableColorPicker', true);
        await config.update('enableColorPicker', normalColorPickerEnabled, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Normal Color Picker ${normalColorPickerEnabled ? 'enabled' : 'disabled'}`);
    }));

    context.subscriptions.push(vscode.commands.registerCommand("pawnpainter.toggleGameTextColorPicker", async () => {
        const config = vscode.workspace.getConfiguration('pawnpainter');
        gameTextColorPickerEnabled = !config.get('enableGameTextColors', false);
        await config.update('enableGameTextColors', gameTextColorPickerEnabled, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Game Text Color Picker ${gameTextColorPickerEnabled ? 'enabled' : 'disabled'}`);
    }));

    const colorProvider: vscode.DocumentColorProvider = {
        provideDocumentColors(document) {
            const colorRanges: vscode.ColorInformation[] = [];
            
            if (!normalColorPickerEnabled && !gameTextColorPickerEnabled) {
                return colorRanges;
            }

            const text = document.getText();
            
            if (normalColorPickerEnabled) {
                const colorRegex = /(?:0x[0-9A-Fa-f]{6,8}|\{[0-9A-Fa-f]{6}\}|[0-9A-Fa-f]{6})/g;
                let match;
                while ((match = colorRegex.exec(text)) !== null) {
                    const colorCode = match[0];
                    const range = new vscode.Range(
                        document.positionAt(match.index),
                        document.positionAt(match.index + colorCode.length)
                    );
                    const color = parseColor(colorCode);
                    if (color) {
                        colorRanges.push(new vscode.ColorInformation(range, color));
                    }
                }
            }

            if (gameTextColorPickerEnabled) {
                const gameTextRegex = /~([rgbwypl])~(?:~h~)*/g;
                let match;
                while ((match = gameTextRegex.exec(text)) !== null) {
                    const fullMatch = match[0];
                    const colorChar = match[1];
                    const lightLevels = (fullMatch.match(/~h~/g) || []).length;
                    
                    if (colorChar in gameTextColors) {
                        const startPos = document.positionAt(match.index);
                        const endPos = document.positionAt(match.index + fullMatch.length);
                        const range = new vscode.Range(startPos, endPos);
                        
                        const baseColor = gameTextColors[colorChar].baseColor;
                        const finalColor = getLightenedColor(baseColor, lightLevels);
                        
                        colorRanges.push(new vscode.ColorInformation(range, finalColor));
                    }
                }
            }

            return colorRanges;
        },

        provideColorPresentations(color, context) {
            const originalText = context.document.getText(context.range).trim();
            
            if (gameTextColorPickerEnabled && originalText.startsWith('~') && originalText.endsWith('~')) {
                return [new vscode.ColorPresentation(originalText)];
            }

            if (normalColorPickerEnabled) {
                if (originalText.startsWith("{") && originalText.endsWith("}")) {
                    const colorHex = colorToHexWithoutAlpha(color);
                    return [new vscode.ColorPresentation(`{${colorHex.slice(1)}}`)]
                } else if (originalText.startsWith("0x")) {
                    const hasAlpha = originalText.length === 10;
                    if (hasAlpha) {
                        return [new vscode.ColorPresentation(`0x${colorToHexWithAlpha(color).slice(1)}`)]
                    } else {
                        return [new vscode.ColorPresentation(`0x${colorToHexWithoutAlpha(color).slice(1)}`)]
                    }
                } else {
                    return [new vscode.ColorPresentation(colorToHexWithoutAlpha(color).slice(1))];
                }
            }

            return [];
        }
    };

    context.subscriptions.push(
        vscode.languages.registerColorProvider(
            { language: "pawn", scheme: "file" },
            colorProvider
        )
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            const config = vscode.workspace.getConfiguration('pawnpainter');
            if (e.affectsConfiguration('pawnpainter.enableColorPicker')) {
                normalColorPickerEnabled = config.get('enableColorPicker', true);
            }
            if (e.affectsConfiguration('pawnpainter.enableGameTextColors')) {
                gameTextColorPickerEnabled = config.get('enableGameTextColors', false);
            }
        })
    );
}

function parseColor(colorCode: string): vscode.Color | undefined {
    try {
        if (colorCode.startsWith("0x")) {
            const hex = colorCode.slice(2);
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            const a = hex.length > 6 ? parseInt(hex.substr(6, 2), 16) / 255 : 1;
            return new vscode.Color(r, g, b, a);
        } else if (colorCode.startsWith("{") && colorCode.endsWith("}")) {
            const hex = colorCode.slice(1, -1);
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            return new vscode.Color(r, g, b, 1);
        } else {
            const r = parseInt(colorCode.substr(0, 2), 16) / 255;
            const g = parseInt(colorCode.substr(2, 2), 16) / 255;
            const b = parseInt(colorCode.substr(4, 2), 16) / 255;
            return new vscode.Color(r, g, b, 1);
        }
    } catch (e) {
        return undefined;
    }
}

function colorToHexWithoutAlpha(color: vscode.Color): string {
    const r = Math.round(color.red * 255).toString(16).padStart(2, "0").toUpperCase();
    const g = Math.round(color.green * 255).toString(16).padStart(2, "0").toUpperCase();
    const b = Math.round(color.blue * 255).toString(16).padStart(2, "0").toUpperCase();
    return `#${r}${g}${b}`;
}

function colorToHexWithAlpha(color: vscode.Color): string {
    const r = Math.round(color.red * 255).toString(16).padStart(2, "0").toUpperCase();
    const g = Math.round(color.green * 255).toString(16).padStart(2, "0").toUpperCase();
    const b = Math.round(color.blue * 255).toString(16).padStart(2, "0").toUpperCase();
    const a = Math.round(color.alpha * 255).toString(16).padStart(2, "0").toUpperCase();
    return `#${r}${g}${b}${a}`;
}

export function deactivate() {}