import axios from 'axios'
import type { TranslationResult, ApiConfig } from '../types/index.js'
import { BaseTranslationProvider } from './base.js'
import { logger } from '../utils/logger.js'

/**
 * DeepL 翻译提供商
 */
export class DeepLTranslateProvider extends BaseTranslationProvider {
  public name = 'DeepL'
  private apiUrl = 'https://api-free.deepl.com/v2/translate'

  constructor(config: ApiConfig) {
    super(config)
    this.validateConfig()

    // 如果使用付费版，切换到付费 API
    if (config.key && !config.key.endsWith(':fx')) {
      this.apiUrl = 'https://api.deepl.com/v2/translate'
    }
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
      logger.debug(`使用 DeepL 翻译 ${texts.length} 条文本`)

      const response = await axios.post(
        this.apiUrl,
        {
          text: texts,
          source_lang: this.normalizeLanguageCode(from, 'deepl').toUpperCase(),
          target_lang: this.normalizeLanguageCode(to, 'deepl').toUpperCase(),
        },
        {
          headers: {
            Authorization: `DeepL-Auth-Key ${this.config.key}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const translations = response.data.translations

      return texts.map((original, index) => ({
        original,
        translated: translations[index].text,
        source: 'api' as const,
        confidence: 1.0,
      }))
    } catch (error) {
      logger.error('DeepL 翻译失败', error)
      throw new Error(`DeepL 翻译失败: ${(error as Error).message}`)
    }
  }

  /**
   * 检测语言
   */
  async detectLanguage(text: string): Promise<string> {
    // DeepL 会自动检测语言，设置 source_lang 为空即可
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          text: [text],
          target_lang: 'EN',
        },
        {
          headers: {
            Authorization: `DeepL-Auth-Key ${this.config.key}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data.translations[0].detected_source_language.toLowerCase()
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
      'zh-CN': 'ZH',
      'zh-TW': 'ZH',
      'zh': 'ZH',
      'en': 'EN',
      'ja': 'JA',
      'ko': 'KO',
      'fr': 'FR',
      'de': 'DE',
      'es': 'ES',
      'it': 'IT',
      'pt': 'PT',
      'ru': 'RU',
      'nl': 'NL',
      'pl': 'PL',
    }

    return mapping[code] || code
  }

  /**
   * 获取使用情况
   */
  async getUsage(): Promise<{
    characterCount: number
    characterLimit: number
  }> {
    try {
      const response = await axios.get(
        this.apiUrl.replace('/translate', '/usage'),
        {
          headers: {
            Authorization: `DeepL-Auth-Key ${this.config.key}`,
          },
        }
      )

      return {
        characterCount: response.data.character_count,
        characterLimit: response.data.character_limit,
      }
    } catch (error) {
      logger.error('获取使用情况失败', error)
      throw error
    }
  }
}


