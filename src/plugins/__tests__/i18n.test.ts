import { describe, expect, it } from 'vitest';
import { initialLanguage } from '../i18n';

describe('initialLanguage', () => {
  it('keeps a language the user already chose', () => {
    expect(initialLanguage('es', ['pt-BR'])).toBe('es');
  });

  it('follows the browser on a first visit, by base tag', () => {
    expect(initialLanguage(null, ['es-AR', 'en'])).toBe('es');
    expect(initialLanguage(null, ['pt-BR'])).toBe('pt');
  });

  it('skips browser languages the app does not speak', () => {
    expect(initialLanguage(null, ['de-DE', 'pt-PT'])).toBe('pt');
  });

  it('falls back to English when nothing matches', () => {
    expect(initialLanguage(null, ['de-DE', 'fr'])).toBe('en');
    expect(initialLanguage(null, [])).toBe('en');
  });

  it('ignores a saved value it does not recognise', () => {
    expect(initialLanguage('klingon', ['es'])).toBe('es');
  });
});
