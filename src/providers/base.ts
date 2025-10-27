import type {
  TranslationProvider,
  TranslationResult,
  ApiConfig,
} from '../types/index.js'
import { logger } from '../utils/logger.js'

/**
 * 抽象翻译提供商基类
 */
export abstract class BaseTranslationProvider implements TranslationProvider {
  protected config: ApiConfig
  public abstract name: string

  constructor(config: ApiConfig) {
    this.config = config
  }

  /**
   * 翻译文本（需要子类实现）
   */
  abstract translate(
    texts: string[],
    from: string,
    to: string
  ): Promise<TranslationResult[]>

  /**
   * 批量翻译（带速率限制和重试）
   */
  async translateBatch(
    texts: string[],
    from: string,
    to: string
  ): Promise<TranslationResult[]> {
    const batchSize = this.config.batchSize || 50
    const results: TranslationResult[] = []

    // 分批处理
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)

      logger.debug(
        `翻译批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`
      )

      try {
        const batchResults = await this.translateWithRetry(batch, from, to)
        results.push(...batchResults)

        // 速率限制
        if (this.config.rateLimit && i + batchSize < texts.length) {
          const delay = 1000 / this.config.rateLimit
          await this.sleep(delay)
        }
      } catch (error) {
        logger.error(`批次翻译失败`, error)

        // 添加失败结果
        batch.forEach((text) => {
          results.push({
            original: text,
            translated: text,
            source: 'api',
            error: (error as Error).message,
          })
        })
      }
    }

    return results
  }

  /**
   * 带重试的翻译
   */
  private async translateWithRetry(
    texts: string[],
    from: string,
    to: string,
    retryCount = 0
  ): Promise<TranslationResult[]> {
    const maxRetries = this.config.retries || 3

    try {
      return await this.translate(texts, from, to)
    } catch (error) {
      if (retryCount < maxRetries) {
        logger.warn(
          `翻译失败，正在重试 (${retryCount + 1}/${maxRetries})...`
        )

        // 指数退避
        const delay = Math.pow(2, retryCount) * 1000
        await this.sleep(delay)

        return this.translateWithRetry(texts, from, to, retryCount + 1)
      }

      throw error
    }
  }

  /**
   * 睡眠
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 验证配置
   */
  protected validateConfig(): void {
    if (!this.config.key && !this.config.baidu) {
      throw new Error(`${this.name} 需要 API 密钥`)
    }
  }

  /**
   * 规范化语言代码
   */
  protected normalizeLanguageCode(code: string, provider: string): string {
    // 每个提供商的语言代码可能不同，子类可以覆盖此方法
    return code
  }
}


