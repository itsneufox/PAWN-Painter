import * as vscode from 'vscode';

export interface Translation {
  commands: {
    convertToHexWithAlpha: string;
    convertToHexNoAlpha: string;
    convertToBraced: string;
    convertToRGB: string;
    toggleHexColorHighlight: string;
    toggleGameTextColorPicker: string;
    toggleNormalColorPicker: string;
    ignoreLine: string;
    unignoreLine: string;
    clearIgnoredLines: string;
    showIgnoredLines: string;
    ignoreFile: string;
    unignoreFile: string;
    resetGuideState: string;
    refreshDecorations: string;
  };
  messages: {
    lineIgnored: string;
    lineRestored: string;
    lineNotIgnored: string;
    linesIgnored: string;
    linesRestored: string;
    fileIgnored: string;
    fileAlreadyIgnored: string;
    fileRestored: string;
    noIgnoredLinesInFile: string;
    ignoredLinesCleared: string;
    noIgnoredLines: string;
    noActiveEditor: string;
    selectColorToConvert: string;
    invalidColorFormat: string;
    colorConverted: string;
    hexHighlightEnabled: string;
    hexHighlightDisabled: string;
    gameTextEnabled: string;
    gameTextDisabled: string;
    colorPickerEnabled: string;
    colorPickerDisabled: string;
    guideStateReset: string;
    colorsRefreshed: string;
    textDecorationsRefreshed: string;
    colorLimitExceeded: string;
    highPerformanceWarning: string;
    settingsUpdatedHigh: string;
    settingsUpdatedNormal: string;
    settingsUpdateFailed: string;
  };
  warnings: {
    invisibleColor: string;
    unevenTildes: string;
  };
  configuration: {
    disable: {
      description: string;
    };
    lowPerformanceMode: {
      description: string;
    };
    autoPerformanceMode: {
      description: string;
    };
    general: {
      enableColorPicker: {
        description: string;
      };
    };
    gameText: {
      textEnabled: {
        description: string;
      };
      textStyle: {
        description: string;
      };
    };
    inlineText: {
      textEnabled: {
        description: string;
      };
      textStyle: {
        description: string;
      };
    };
    hexParameter: {
      textEnabled: {
        description: string;
      };
      textStyle: {
        description: string;
      };
    };
    hex: {
      showAlphaWarnings: {
        description: string;
      };
    };
    alphaWarnings: {
      highlightCode: {
        description: string;
      };
      highlightStyle: {
        description: string;
      };
    };
  };
  menus: {
    convertColorTo: string;
    ignoreRestoreColors: string;
    ignoreSelectedLines: string;
    restoreSelectedLines: string;
    ignoreAllColorsInFile: string;
    restoreAllColorsInFile: string;
  };
}

export class I18nManager {
  private static instance: I18nManager;
  private translations: Map<string, Translation> = new Map();
  private currentLanguage: string = 'en';
  private fallbackLanguage: string = 'en';

  private constructor() {
    this.detectLanguage();
    this.loadTranslations();
  }

  public static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  private detectLanguage(): void {
    // Always use VS Code's language - simple and consistent
    const vsCodeLanguage = vscode.env.language;
    
    
    // Map common language codes to our supported languages
    const languageMap: { [key: string]: string } = {
      'en': 'en',
      'en-us': 'en',
      'en-gb': 'en',
      'pt': 'pt',
      'pt-br': 'pt',
      'pt-pt': 'pt',
      'es': 'es',
      'es-es': 'es',
      'es-mx': 'es',
      'de': 'de',
      'fr': 'fr',
      'it': 'it',
      'ru': 'ru'
      // Commented out - no translations available yet:
      // 'zh': 'zh',
      // 'zh-cn': 'zh',
      // 'zh-tw': 'zh',
      // 'ja': 'ja',
      // 'ko': 'ko'
    };

    const previousLanguage = this.currentLanguage;
    this.currentLanguage = languageMap[vsCodeLanguage.toLowerCase()] || this.fallbackLanguage;
    
  }

  private loadTranslations(): void {
    // Static imports for bundled extension
    try {
      // Load English (default)
      const enTranslation = require('./translations/en.json') as Translation;
      this.translations.set('en', enTranslation);

      // Load Portuguese
      try {
        const ptTranslation = require('./translations/pt.json') as Translation;
        this.translations.set('pt', ptTranslation);
      } catch {
        // Portuguese translation not available
      }

      // Load Spanish
      try {
        const esTranslation = require('./translations/es.json') as Translation;
        this.translations.set('es', esTranslation);
      } catch {
        // Spanish translation not available
      }

      // Load French
      try {
        const frTranslation = require('./translations/fr.json') as Translation;
        this.translations.set('fr', frTranslation);
      } catch {
        // French translation not available
      }

      // Load German
      try {
        const deTranslation = require('./translations/de.json') as Translation;
        this.translations.set('de', deTranslation);
      } catch {
        // German translation not available
      }

      // Load Italian
      try {
        const itTranslation = require('./translations/it.json') as Translation;
        this.translations.set('it', itTranslation);
      } catch {
        // Italian translation not available
      }

      // Load Russian
      try {
        const ruTranslation = require('./translations/ru.json') as Translation;
        this.translations.set('ru', ruTranslation);
      } catch {
        // Russian translation not available
      }
    } catch (error) {
      // Fallback: at least try to provide English defaults
      const fallbackTranslation = this.createFallbackTranslation();
      this.translations.set('en', fallbackTranslation);
    }
  }

  private createFallbackTranslation(): Translation {
    // Minimal fallback translation in case all else fails
    return {
      commands: {
        convertToHexWithAlpha: "Convert to 0xRRGGBBAA",
        convertToHexNoAlpha: "Convert to 0xRRGGBB",
        convertToBraced: "Convert to {RRGGBB}",
        convertToRGB: "Convert to RGB",
        toggleHexColorHighlight: "Toggle Hex Colour Highlighting",
        toggleGameTextColorPicker: "Toggle GameText Colour Preview",
        toggleNormalColorPicker: "Toggle Normal Colour Picker",
        ignoreLine: "Ignore Colour On Selected Line(s)",
        unignoreLine: "Restore Colour To Selected Line(s)",
        clearIgnoredLines: "Clear All Ignored Lines",
        showIgnoredLines: "Show Ignored Lines History",
        ignoreFile: "Ignore All Colors In This File",
        unignoreFile: "Restore All Colors In This File",
        resetGuideState: "Reset Guide State (Show Guide on Next Restart)",
        refreshDecorations: "Force Refresh Colors"
      },
      messages: {
        lineIgnored: "Line {0} colours will be ignored",
        lineRestored: "Line {0} colours restored",
        lineNotIgnored: "Line {0} was not ignored",
        linesIgnored: "{0} line(s) will have colours ignored",
        linesRestored: "{0} line(s) colours restored",
        fileIgnored: "Ignored all colours in this file ({0} lines)",
        fileAlreadyIgnored: "All lines in this file were already ignored",
        fileRestored: "Restored all colours in this file ({0} lines)",
        noIgnoredLinesInFile: "No ignored lines found in this file",
        ignoredLinesCleared: "Cleared {0} ignored lines",
        noIgnoredLines: "No ignored lines found",
        noActiveEditor: "No active editor",
        selectColorToConvert: "Please select a colour to convert",
        invalidColorFormat: '"{0}" is not a valid colour format',
        colorConverted: 'Converted "{0}" to {1}',
        hexHighlightEnabled: "Hex color highlighting enabled",
        hexHighlightDisabled: "Hex color highlighting disabled",
        gameTextEnabled: "GameText color preview enabled",
        gameTextDisabled: "GameText color preview disabled",
        colorPickerEnabled: "Color picker enabled",
        colorPickerDisabled: "Color picker disabled",
        guideStateReset: "Guide state reset. Guide will show on next restart.",
        colorsRefreshed: "Colors refreshed!",
        textDecorationsRefreshed: "Text decorations refreshed!",
        colorLimitExceeded: "This file contains {0} colors, but only showing {1} due to the current limit. {2} colors are hidden. You can increase the limit in PAWN Painter settings.",
        highPerformanceWarning: "PAWN Painter: Showing {0} color decorators. High limits may impact VS Code performance. This warning shows only once per limit setting.",
        settingsUpdatedHigh: "PAWN Painter: Updated VS Code's color decorator limit to {0}. High limits may impact performance. VS Code restart may be required for full effect.",
        settingsUpdatedNormal: "PAWN Painter: Updated VS Code's color decorator limit to {0}. VS Code restart may be required for full effect.",
        settingsUpdateFailed: "PAWN Painter: Failed to update VS Code color decorator limit. You may need to manually set editor.colorDecoratorsLimit in VS Code settings.",
      },
      warnings: {
        invisibleColor: " ⚠️ contains invisible colour",
        unevenTildes: " ⚠️ Uneven tildes may crash players"
      },
      configuration: {
        disable: { description: "Disables the extension completely" },
        lowPerformanceMode: { description: "Enable low performance mode - shows only color picker squares and disables all text coloring. Use this for large files with many colors to bypass VS Code's 500 color decorator limit." },
        autoPerformanceMode: { description: "Automatically suggest low performance mode when files have many colors that may hit VS Code's decorator limit" },
        general: { enableColorPicker: { description: "Enable VS Code colour picker" } },
        gameText: { 
          textEnabled: { description: "Enable GameText highlighting" },
          textStyle: { description: "GameText display style" }
        },
        inlineText: {
          textEnabled: { description: "Enable inline text highlighting" },
          textStyle: { description: "Inline text display style" }
        },
        hexParameter: {
          textEnabled: { description: "Enable hex parameter coloring" },
          textStyle: { description: "Hex parameter display style" }
        },
        hex: { showAlphaWarnings: { description: "Show alpha warnings" } },
        alphaWarnings: {
          highlightCode: { description: "Highlight colour code" },
          highlightStyle: { description: "Alpha warning style" }
        }
      },
      menus: {
        convertColorTo: "Convert Color To",
        ignoreRestoreColors: "Ignore/Restore Colors",
        ignoreSelectedLines: "Ignore Selected Lines",
        restoreSelectedLines: "Restore Selected Lines",
        ignoreAllColorsInFile: "Ignore All Colors In This File",
        restoreAllColorsInFile: "Restore All Colors In This File"
      }
    };
  }

  public t(key: string, ...args: any[]): string {
    // Handle malformed keys gracefully
    if (!key || typeof key !== 'string') {
      return String(key ?? '');
    }
    
    const translation = this.getTranslation();
    const value = this.getNestedValue(translation, key);
    
    if (value && typeof value === 'string') {
      return this.interpolate(value, ...args);
    }
    
    // Fallback to English if key not found in current language
    if (this.currentLanguage !== this.fallbackLanguage) {
      const fallbackTranslation = this.translations.get(this.fallbackLanguage);
      if (fallbackTranslation) {
        const fallbackValue = this.getNestedValue(fallbackTranslation, key);
        if (fallbackValue && typeof fallbackValue === 'string') {
          return this.interpolate(fallbackValue, ...args);
        }
      }
    }
    
    // Return the key as fallback
    return key;
  }

  /**
   * Legacy method for backwards compatibility with tests
   */
  public refreshLanguage(): void {
    // Re-detect and load current language
    this.detectLanguage();
    this.loadTranslations();
  }

  private getTranslation(): Translation | undefined {
    return this.translations.get(this.currentLanguage);
  }

  private getNestedValue(obj: any, key: string): any {
    if (!key || typeof key !== 'string') {
      return undefined;
    }
    return key.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private interpolate(text: string, ...args: any[]): string {
    return text.replace(/\{(\d+)\}/g, (match, index) => {
      const argIndex = parseInt(index, 10);
      return args[argIndex] !== undefined ? String(args[argIndex]) : match;
    });
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public getSupportedLanguages(): string[] {
    return Array.from(this.translations.keys());
  }

  public setLanguage(language: string): void {
    if (this.translations.has(language)) {
      this.currentLanguage = language;
    }
  }

  /**
   * Simple language detection - always follows VS Code's language
   */
}

// Export singleton instance
export const i18n = I18nManager.getInstance();

// Convenience function for translations
export const t = (key: string, ...args: any[]): string => i18n.t(key, ...args);
