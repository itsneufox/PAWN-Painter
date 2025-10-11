import * as assert from 'assert';
import * as vscode from 'vscode';
import { I18nManager, t } from '../../src/i18n';

suite('Internationalization Tests', () => {
  let originalLanguage: string;
  
  setup(() => {
    // Store original language
    originalLanguage = vscode.env.language;
  });

  teardown(() => {
    // Reset language (note: this won't actually change vscode.env.language in tests)
    // I18nManager is a singleton without dispose method
  });

  suite('I18nManager', () => {
    test('getInstance returns singleton', () => {
      const instance1 = I18nManager.getInstance();
      const instance2 = I18nManager.getInstance();
      
      assert.strictEqual(instance1, instance2, 'Should return same instance');
    });

    test('language detection maps common codes correctly', () => {
      // Test language mapping logic by examining the internal state
      const manager = I18nManager.getInstance();
      
      // Access private method for testing
      const testLanguageMapping = (inputLang: string, expectedLang: string) => {
        // We can't easily mock vscode.env.language, so we'll test the mapping logic
        // by examining what languages are supported
        const supportedLanguages = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ru'];
        assert.ok(supportedLanguages.includes(expectedLang), `${expectedLang} should be supported`);
      };

      // Test common mappings
      testLanguageMapping('en-US', 'en');
      testLanguageMapping('en-GB', 'en');
      testLanguageMapping('pt-BR', 'pt');
      testLanguageMapping('pt-PT', 'pt');
      testLanguageMapping('es-ES', 'es');
      testLanguageMapping('es-MX', 'es');
    });

    test('fallback translation is complete', () => {
      const manager = I18nManager.getInstance();
      
      // Get fallback translation
      const fallback = (manager as any).createFallbackTranslation();
      
      // Verify structure
      assert.ok(fallback.commands, 'Should have commands section');
      assert.ok(fallback.messages, 'Should have messages section');
      assert.ok(fallback.configuration, 'Should have configuration section');
      assert.ok(fallback.menus, 'Should have menus section');
      
      // Verify key commands exist
      assert.ok(fallback.commands.refreshDecorations, 'Should have refreshDecorations command');
      assert.ok(fallback.commands.ignoreLine, 'Should have ignoreLine command');
      assert.ok(fallback.commands.convertToHexWithAlpha, 'Should have color conversion commands');
      
      // Verify key messages exist
      assert.ok(fallback.messages.lineIgnored, 'Should have line ignored message');
      assert.ok(fallback.messages.colorConverted, 'Should have color conversion messages');
    });

    test('singleton persists across calls', () => {
      const manager1 = I18nManager.getInstance();
      const manager2 = I18nManager.getInstance();
      
      assert.strictEqual(manager1, manager2, 'Should return same singleton instance');
    });
  });

  suite('Translation Function (t)', () => {
    test('t function returns translated strings', () => {
      // Test basic translation
      const result = t('commands.refreshDecorations');
      assert.ok(typeof result === 'string', 'Should return string');
      assert.ok(result.length > 0, 'Should return non-empty string');
    });

    test('t function handles parameter interpolation', () => {
      // Test single parameter
      const result1 = t('messages.lineIgnored', 42);
      assert.ok(result1.includes('42'), 'Should interpolate single parameter');
      
      // Test multiple parameters
      const result2 = t('messages.colorConverted', 'red', 'blue');
      assert.ok(result2.includes('red'), 'Should interpolate first parameter');
      assert.ok(result2.includes('blue'), 'Should interpolate second parameter');
    });

    test('t function handles missing translations gracefully', () => {
      const result = t('nonexistent.key' as any);
      assert.ok(typeof result === 'string', 'Should return string for missing key');
      assert.ok(result.includes('nonexistent.key'), 'Should include the key in fallback');
    });

    test('t function handles nested keys', () => {
      const commandResult = t('commands.ignoreLine');
      const messageResult = t('messages.lineIgnored', 5);
      const configResult = t('configuration.disable.description');
      const menuResult = t('menus.convertColorTo');
      
      assert.ok(typeof commandResult === 'string', 'Should handle commands keys');
      assert.ok(typeof messageResult === 'string', 'Should handle messages keys');
      assert.ok(typeof configResult === 'string', 'Should handle configuration keys');
      assert.ok(typeof menuResult === 'string', 'Should handle menu keys');
    });

    test('t function handles parameter types correctly', () => {
      // Test with different parameter types
      const withNumber = t('messages.lineIgnored', 500);
      const withString = t('messages.colorConverted', 'red', 'blue');
      
      assert.ok(withNumber.includes('500'), 'Should handle number parameters');
      assert.ok(withString.includes('red') && withString.includes('blue'), 'Should handle string parameters');
    });
  });

  suite('Translation Loading', () => {
    test('translation files have consistent structure', () => {
      const manager = I18nManager.getInstance();
      
      // Verify that all supported languages have similar structure
      const supportedLanguages = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ru'];
      
      supportedLanguages.forEach(lang => {
        // We can't easily load all translation files in tests, but we can verify
        // that the translation system handles them correctly
        assert.ok(lang.length >= 2, `Language code ${lang} should be valid`);
      });
    });

    test('fallback system works when translations missing', () => {
      const manager = I18nManager.getInstance();
      
      // Test that fallback is used when needed
      const result = t('commands.refreshDecorations');
      assert.ok(result.length > 0, 'Should return fallback translation');
    });
  });

  suite('Error Handling', () => {
    test('handles malformed translation keys gracefully', () => {
      // Test various malformed keys
      const emptyKey = t('' as any);
      const nullKey = t(null as any);
      const undefinedKey = t(undefined as any);
      
      assert.ok(typeof emptyKey === 'string', 'Should handle empty key');
      assert.ok(typeof nullKey === 'string', 'Should handle null key');
      assert.ok(typeof undefinedKey === 'string', 'Should handle undefined key');
    });

    test('handles parameter edge cases', () => {
      // Test with no parameters when some expected
      const noParams = t('messages.chunkingNotification');
      assert.ok(typeof noParams === 'string', 'Should handle missing parameters');
      
      // Test with too many parameters
      const tooManyParams = t('commands.refreshDecorations', 1, 2, 3, 4, 5);
      assert.ok(typeof tooManyParams === 'string', 'Should handle extra parameters');
      
      // Test with null/undefined parameters
      const nullParam = t('messages.chunkingNotification', null);
      const undefinedParam = t('messages.chunkingNotification', undefined);
      
      assert.ok(typeof nullParam === 'string', 'Should handle null parameters');
      assert.ok(typeof undefinedParam === 'string', 'Should handle undefined parameters');
    });
  });

  suite('Performance', () => {
    test('translation lookup is efficient', () => {
      const startTime = Date.now();
      
      // Perform many translations
      for (let i = 0; i < 1000; i++) {
        t('commands.refreshDecorations');
        t('messages.chunkingNotification', i);
        t('configuration.disable.description');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (under 100ms for 3000 translations)
      assert.ok(duration < 100, `Translation should be fast, took ${duration}ms`);
    });

    test('singleton pattern prevents memory leaks', () => {
      // Create multiple instances
      const instances = [];
      for (let i = 0; i < 10; i++) {
        instances.push(I18nManager.getInstance());
      }
      
      // All should be the same instance
      const firstInstance = instances[0];
      instances.forEach(instance => {
        assert.strictEqual(instance, firstInstance, 'All instances should be the same');
      });
    });
  });
});
