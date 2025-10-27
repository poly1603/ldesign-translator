import axios from 'axios'
import type { TranslationResult, ApiConfig } from '../types/index.js'
import { BaseTranslationProvider } from './base.js'
import { logger } from '../utils/logger.js'

/**
 * Google Translate 提供商
 */
export class GoogleTranslateProvider extends BaseTranslationProvider {
  public name = 'Google Translate'
  private apiUrl = 'https://translation.googleapis.com/language/translate/v2'

  constructor(config: ApiConfig) {
    super(config)
    this.validateConfig()
  }

  /**
   * 翻译文本
   */
  async translate(
    texts: string[],
    from: string,
    to: string
  ): Promise<TranslationResult[]> {
    try {
      logger.debug(`使用 Google Translate 翻译 ${texts.length} 条文本`)

      const response = await axios.post(
        this.apiUrl,
        {
          q: texts,
          source: this.normalizeLanguageCode(from, 'google'),
          target: this.normalizeLanguageCode(to, 'google'),
          format: 'text',
        },
        {
          params: {
            key: this.config.key,
          },
        }
      )

      const translations = response.data.data.translations

      return texts.map((original, index) => ({
        original,
        translated: translations[index].translatedText,
        source: 'api' as const,
        confidence: 1.0,
      }))
    } catch (error) {
      logger.error('Google Translate 翻译失败', error)
      throw new Error(`Google Translate 翻译失败: ${(error as Error).message}`)
    }
  }

  /**
   * 检测语言
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://translation.googleapis.com/language/translate/v2/detect',
        {
          q: text,
        },
        {
          params: {
            key: this.config.key,
          },
        }
      )

      return response.data.data.detections[0][0].language
    } catch (error) {
      logger.error('语言检测失败', error)
      throw error
    }
  }

  /**
   * 规范化语言代码
   */
  protected normalizeLanguageCode(code: string, provider: string): string {
    const mapping: Record<string, string> = {
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'zh': 'zh-CN',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
      'fr': 'fr',
      'de': 'de',
      'es': 'es',
      'it': 'it',
      'pt': 'pt',
      'ru': 'ru',
      'ar': 'ar',
    }

    return mapping[code] || code
  }
}


