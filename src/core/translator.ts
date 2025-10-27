import type {
  TranslatorConfig,
  TranslationProvider,
  TranslationEntry,
  TranslationResult,
  ExtractedText,
} from '../types/index.js'
import { GoogleTranslateProvider } from '../providers/google.js'
import { BaiduTranslateProvider } from '../providers/baidu.js'
import { DeepLTranslateProvider } from '../providers/deepl.js'
import { TranslationMemory } from './memory.js'
import { logger } from '../utils/logger.js'
import { writeJSON, readJSON, fileExists } from '../utils/file-utils.js'
import path from 'path'

/**
 * 翻译器核心类
 */
export class Translator {
  private config: TranslatorConfig
  private provider: TranslationProvider
  private memory?: TranslationMemory

  constructor(config: TranslatorConfig) {
    this.config = config

    // 初始化翻译提供商
    this.provider = this.createProvider()

    // 初始化翻译记忆
    if (config.memory?.enabled) {
      this.memory = new TranslationMemory(config.memory)
    }
  }

  /**
   * 创建翻译提供商
   */
  private createProvider(): TranslationProvider {
    switch (this.config.api.provider) {
      case 'google':
        return new GoogleTranslateProvider(this.config.api)
      case 'baidu':
        return new BaiduTranslateProvider(this.config.api)
      case 'deepl':
        return new DeepLTranslateProvider(this.config.api)
      default:
        throw new Error(
          `不支持的翻译提供商: ${this.config.api.provider}`
        )
    }
  }

  /**
   * 翻译提取的文本
   */
  async translateTexts(
    texts: ExtractedText[],
    targetLang: string,
    options?: {
      useMemory?: boolean
      force?: boolean
    }
  ): Promise<TranslationEntry[]> {
    const { useMemory = true, force = false } = options || {}

    logger.info(`开始翻译 ${texts.length} 条文本到 ${targetLang}`)

    // 加载已有翻译
    const existingTranslations = await this.loadExistingTranslations(targetLang)

    const entries: TranslationEntry[] = []
    const textsToTranslate: { index: number; text: string }[] = []

    // 准备翻译条目
    for (let i = 0; i < texts.length; i++) {
      const extracted = texts[i]
      const entry: TranslationEntry = {
        key: extracted.key,
        source: extracted.text,
        translations: {},
        metadata: {
          file: extracted.file,
          line: extracted.line,
          context: extracted.context,
        },
      }

      // 检查已有翻译
      const existing = existingTranslations.find((e) => e.key === extracted.key)
      if (existing && !force) {
        entry.translations = existing.translations
        entries.push(entry)
        continue
      }

      // 检查翻译记忆
      if (useMemory && this.memory) {
        const memoryTranslation = this.memory.findTranslation(
          extracted.text,
          targetLang
        )

        if (memoryTranslation) {
          logger.debug(`从翻译记忆获取: ${extracted.text}`)
          entry.translations[targetLang] = memoryTranslation
          entries.push(entry)
          continue
        }

        // 查找相似翻译
        const similarTranslations = this.memory.findSimilarTranslations(
          extracted.text,
          targetLang,
          1
        )

        if (similarTranslations.length > 0) {
          logger.debug(
            `找到相似翻译 (${(similarTranslations[0].similarity * 100).toFixed(1)}%): ${extracted.text}`
          )
          // 可以选择使用相似翻译或标记需要人工审核
        }
      }

      // 需要翻译
      textsToTranslate.push({ index: i, text: extracted.text })
      entries.push(entry)
    }

    // 批量翻译
    if (textsToTranslate.length > 0) {
      logger.info(`需要翻译 ${textsToTranslate.length} 条新文本`)

      try {
        const sourceTexts = textsToTranslate.map((t) => t.text)
        const results = await this.provider.translateBatch(
          sourceTexts,
          this.config.sourceLanguage,
          targetLang
        )

        // 保存翻译结果
        for (let i = 0; i < results.length; i++) {
          const result = results[i]
          const { index } = textsToTranslate[i]

          entries[index].translations[targetLang] = result.translated

          // 保存到翻译记忆
          if (this.memory && !result.error) {
            this.memory.addTranslation(
              result.original,
              targetLang,
              result.translated,
              'api'
            )
          }
        }

        logger.success(`翻译完成!`)
      } catch (error) {
        logger.error('批量翻译失败', error)
        throw error
      }
    } else {
      logger.success('所有文本都已存在翻译')
    }

    return entries
  }

  /**
   * 翻译到多个语言
   */
  async translateToMultipleLanguages(
    texts: ExtractedText[],
    targetLangs: string[],
    options?: {
      useMemory?: boolean
      force?: boolean
    }
  ): Promise<Map<string, TranslationEntry[]>> {
    const results = new Map<string, TranslationEntry[]>()

    for (const lang of targetLangs) {
      logger.info(`\n翻译到 ${lang}...`)
      const entries = await this.translateTexts(texts, lang, options)
      results.set(lang, entries)
    }

    return results
  }

  /**
   * 保存翻译结果
   */
  async saveTranslations(
    entries: TranslationEntry[],
    targetLang: string
  ): Promise<void> {
    const outputDir = this.config.output.dir
    const format = this.config.output.format

    // 构建翻译对象
    const translations: Record<string, string> = {}
    entries.forEach((entry) => {
      if (entry.translations[targetLang]) {
        translations[entry.key] = entry.translations[targetLang]
      }
    })

    // 确定输出文件路径
    const filename = `${targetLang}.${format}`
    const outputPath = path.join(outputDir, filename)

    // 保存文件
    await writeJSON(outputPath, translations, this.config.output.minify)

    logger.success(`翻译文件已保存: ${outputPath}`)
  }

  /**
   * 加载已有翻译
   */
  private async loadExistingTranslations(
    targetLang: string
  ): Promise<TranslationEntry[]> {
    try {
      const outputDir = this.config.output.dir
      const format = this.config.output.format
      const filename = `${targetLang}.${format}`
      const filePath = path.join(outputDir, filename)

      if (!(await fileExists(filePath))) {
        return []
      }

      const data = await readJSON<Record<string, string>>(filePath)

      return Object.entries(data).map(([key, value]) => ({
        key,
        source: '', // 源文本未存储
        translations: {
          [targetLang]: value,
        },
      }))
    } catch (error) {
      logger.warn(`加载已有翻译失败: ${targetLang}`)
      return []
    }
  }

  /**
   * 合并翻译
   */
  mergeTranslations(
    existing: TranslationEntry[],
    newEntries: TranslationEntry[]
  ): TranslationEntry[] {
    const merged = new Map<string, TranslationEntry>()

    // 添加已有翻译
    existing.forEach((entry) => {
      merged.set(entry.key, entry)
    })

    // 合并新翻译
    newEntries.forEach((entry) => {
      const existingEntry = merged.get(entry.key)

      if (existingEntry) {
        // 合并翻译
        existingEntry.translations = {
          ...existingEntry.translations,
          ...entry.translations,
        }

        // 更新元数据
        if (entry.metadata) {
          existingEntry.metadata = {
            ...existingEntry.metadata,
            ...entry.metadata,
          }
        }
      } else {
        merged.set(entry.key, entry)
      }
    })

    return Array.from(merged.values())
  }

  /**
   * 获取统计信息
   */
  getStatistics(entries: TranslationEntry[], targetLangs: string[]): {
    total: number
    translated: Record<string, number>
    untranslated: Record<string, number>
    percentage: Record<string, number>
  } {
    const total = entries.length
    const translated: Record<string, number> = {}
    const untranslated: Record<string, number> = {}
    const percentage: Record<string, number> = {}

    targetLangs.forEach((lang) => {
      const translatedCount = entries.filter(
        (e) => e.translations[lang]
      ).length
      const untranslatedCount = total - translatedCount

      translated[lang] = translatedCount
      untranslated[lang] = untranslatedCount
      percentage[lang] = total > 0 ? (translatedCount / total) * 100 : 0
    })

    return {
      total,
      translated,
      untranslated,
      percentage,
    }
  }

  /**
   * 关闭翻译器
   */
  close(): void {
    if (this.memory) {
      this.memory.close()
    }
  }
}


