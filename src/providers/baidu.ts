import axios from 'axios'
import md5 from 'md5'
import type { TranslationResult, ApiConfig } from '../types/index.js'
import { BaseTranslationProvider } from './base.js'
import { logger } from '../utils/logger.js'

/**
 * 百度翻译提供商
 */
export class BaiduTranslateProvider extends BaseTranslationProvider {
  public name = '百度翻译'
  private apiUrl = 'https://fanyi-api.baidu.com/api/trans/vip/translate'

  constructor(config: ApiConfig) {
    super(config)
    this.validateConfig()

    if (!config.baidu?.appid || !config.baidu?.secret) {
      throw new Error('百度翻译需要 appid 和 secret')
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
      logger.debug(`使用百度翻译翻译 ${texts.length} 条文本`)

      const results: TranslationResult[] = []

      // 百度翻译 API 不支持批量，需要逐条翻译
      for (const text of texts) {
        const salt = Date.now().toString()
        const sign = this.generateSign(text, salt)

        const response = await axios.get(this.apiUrl, {
          params: {
            q: text,
            from: this.normalizeLanguageCode(from, 'baidu'),
            to: this.normalizeLanguageCode(to, 'baidu'),
            appid: this.config.baidu!.appid,
            salt,
            sign,
          },
        })

        if (response.data.error_code) {
          throw new Error(
            `百度翻译错误 ${response.data.error_code}: ${response.data.error_msg}`
          )
        }

        const translated =
          response.data.trans_result?.[0]?.dst || text

        results.push({
          original: text,
          translated,
          source: 'api' as const,
          confidence: 1.0,
        })

        // 添加小延迟避免速率限制
        await this.sleep(100)
      }

      return results
    } catch (error) {
      logger.error('百度翻译失败', error)
      throw new Error(`百度翻译失败: ${(error as Error).message}`)
    }
  }

  /**
   * 生成签名
   */
  private generateSign(text: string, salt: string): string {
    const { appid, secret } = this.config.baidu!
    const str = `${appid}${text}${salt}${secret}`
    return md5(str)
  }

  /**
   * 规范化语言代码
   */
  protected normalizeLanguageCode(code: string, provider: string): string {
    const mapping: Record<string, string> = {
      'zh-CN': 'zh',
      'zh-TW': 'cht',
      'zh': 'zh',
      'en': 'en',
      'ja': 'jp',
      'ko': 'kor',
      'fr': 'fra',
      'de': 'de',
      'es': 'spa',
      'it': 'it',
      'pt': 'pt',
      'ru': 'ru',
      'ar': 'ara',
    }

    return mapping[code] || code
  }
}


