import { ValidationError } from './error.js';

/**
 * Supported languages in BCP 47 format
 */
export const SUPPORTED_LANGUAGES = [
  'en-US',
  'es-ES',
  'ja-JP',
  'vi-VN',
  'zh-CN',
] as const;

/**
 * Validates language code format (BCP 47: xx-XX)
 * @param languageCode - The language code to validate
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateLanguageCode(languageCode: string): boolean {
  const trimmed = languageCode.trim();

  // Check BCP 47 format (xx-XX)
  const bcp47Pattern = /^[a-z]{2}-[A-Z]{2}$/;
  if (!bcp47Pattern.test(trimmed)) {
    throw new ValidationError(
      `语言代码格式错误。请使用 BCP 47 格式（如 en-US, zh-CN）。\n` +
      `支持的语言: ${SUPPORTED_LANGUAGES.join(', ')}`,
      'lang'
    );
  }

  // Check if it's in supported list
  if (!SUPPORTED_LANGUAGES.includes(trimmed as any)) {
    throw new ValidationError(
      `不支持的语言代码: ${trimmed}\n` +
      `支持的语言: ${SUPPORTED_LANGUAGES.join(', ')}`,
      'lang'
    );
  }

  return true;
}

/**
 * Get language code display name
 */
export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    'en-US': 'English (US)',
    'es-ES': 'Spanish (Spain)',
    'ja-JP': 'Japanese',
    'vi-VN': 'Vietnamese',
    'zh-CN': 'Chinese (Simplified)',
  };
  return names[code] || code;
}
