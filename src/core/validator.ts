import type {
  TranslatorConfig,
  TranslationEntry,
  ValidationResult,
} from '../types/index.js'
import {
  validatePlaceholders,
  validateHtmlTags,
  extractPlaceholders,
  extractHtmlTags,
} from '../utils/pattern-matcher.js'
import { logger } from '../utils/logger.js'
import { readJSON, fileExists } from '../utils/file-utils.js'
import path from 'path'

/**
 * 翻译验证器
 */
export class TranslationValidator {
  private config: TranslatorConfig

  constructor(config: TranslatorConfig) {
    this.config = config
  }

  /**
   * 验证所有翻译
   */
  async validateAll(
    targetLangs: string[],
    options?: {
      checkPlaceholders?: boolean
      checkHtmlTags?: boolean
      checkLength?: boolean
      maxLength?: number
    }
  ): Promise<ValidationResult[]> {
    const {
      checkPlaceholders = true,
      checkHtmlTags = true,
      checkLength = true,
      maxLength = 1000,
    } = options || {}

    const results: ValidationResult[] = []

    for (const lang of targetLangs) {
      logger.info(`验证 ${lang} 翻译...`)

      const entries = await this.loadTranslations(lang)
      if (entries.length === 0) {
        logger.warn(`未找到 ${lang} 的翻译文件`)
        continue
      }

      for (const entry of entries) {
        const translation = entry.translations[lang]

        // 检查空翻译
        if (!translation || translation.trim() === '') {
          results.push({
            key: entry.key,
            language: lang,
            type: 'empty',
            severity: 'error',
            message: '翻译为空',
            source: entry.source,
          })
          continue
        }

        // 检查占位符
        if (checkPlaceholders) {
          const placeholderResult = validatePlaceholders(
            entry.source,
            translation
          )

          if (!placeholderResult.valid) {
            if (placeholderResult.missing.length > 0) {
              results.push({
                key: entry.key,
                language: lang,
                type: 'placeholder',
                severity: 'error',
                message: `缺失占位符: ${placeholderResult.missing.join(', ')}`,
                source: entry.source,
                translation,
              })
            }

            if (placeholderResult.extra.length > 0) {
              results.push({
                key: entry.key,
                language: lang,
                type: 'placeholder',
                severity: 'warning',
                message: `额外占位符: ${placeholderResult.extra.join(', ')}`,
                source: entry.source,
                translation,
              })
            }
          }
        }

        // 检查 HTML 标签
        if (checkHtmlTags) {
          const htmlResult = validateHtmlTags(entry.source, translation)

          if (!htmlResult.valid) {
            if (htmlResult.missing.length > 0) {
              results.push({
                key: entry.key,
                language: lang,
                type: 'html',
                severity: 'error',
                message: `缺失 HTML 标签: ${htmlResult.missing.join(', ')}`,
                source: entry.source,
                translation,
              })
            }

            if (htmlResult.extra.length > 0) {
              results.push({
                key: entry.key,
                language: lang,
                type: 'html',
                severity: 'warning',
                message: `额外 HTML 标签: ${htmlResult.extra.join(', ')}`,
                source: entry.source,
                translation,
              })
            }
          }
        }

        // 检查长度
        if (checkLength && translation.length > maxLength) {
          results.push({
            key: entry.key,
            language: lang,
            type: 'length',
            severity: 'warning',
            message: `翻译过长 (${translation.length}/${maxLength})`,
            source: entry.source,
            translation,
          })
        }

        // 检查长度比例（翻译长度不应该是源文本的 3 倍以上）
        if (checkLength && translation.length > entry.source.length * 3) {
          results.push({
            key: entry.key,
            language: lang,
            type: 'length',
            severity: 'info',
            message: `翻译长度异常 (源: ${entry.source.length}, 译: ${translation.length})`,
            source: entry.source,
            translation,
          })
        }
      }

      logger.success(`${lang} 验证完成`)
    }

    return results
  }

  /**
   * 验证单个翻译
   */
  validateSingle(
    source: string,
    translation: string,
    language: string,
    key: string
  ): ValidationResult[] {
    const results: ValidationResult[] = []

    // 检查空翻译
    if (!translation || translation.trim() === '') {
      results.push({
        key,
        language,
        type: 'empty',
        severity: 'error',
        message: '翻译为空',
        source,
      })
      return results
    }

    // 检查占位符
    const placeholderResult = validatePlaceholders(source, translation)
    if (!placeholderResult.valid) {
      if (placeholderResult.missing.length > 0) {
        results.push({
          key,
          language,
          type: 'placeholder',
          severity: 'error',
          message: `缺失占位符: ${placeholderResult.missing.join(', ')}`,
          source,
          translation,
        })
      }

      if (placeholderResult.extra.length > 0) {
        results.push({
          key,
          language,
          type: 'placeholder',
          severity: 'warning',
          message: `额外占位符: ${placeholderResult.extra.join(', ')}`,
          source,
          translation,
        })
      }
    }

    // 检查 HTML 标签
    const htmlResult = validateHtmlTags(source, translation)
    if (!htmlResult.valid) {
      if (htmlResult.missing.length > 0) {
        results.push({
          key,
          language,
          type: 'html',
          severity: 'error',
          message: `缺失 HTML 标签: ${htmlResult.missing.join(', ')}`,
          source,
          translation,
        })
      }

      if (htmlResult.extra.length > 0) {
        results.push({
          key,
          language,
          type: 'html',
          severity: 'warning',
          message: `额外 HTML 标签: ${htmlResult.extra.join(', ')}`,
          source,
          translation,
        })
      }
    }

    return results
  }

  /**
   * 生成验证报告
   */
  generateReport(results: ValidationResult[]): {
    total: number
    errors: number
    warnings: number
    infos: number
    byType: Record<string, number>
    byLanguage: Record<string, number>
  } {
    const report = {
      total: results.length,
      errors: 0,
      warnings: 0,
      infos: 0,
      byType: {} as Record<string, number>,
      byLanguage: {} as Record<string, number>,
    }

    results.forEach((result) => {
      // 按严重级别统计
      if (result.severity === 'error') report.errors++
      else if (result.severity === 'warning') report.warnings++
      else if (result.severity === 'info') report.infos++

      // 按类型统计
      report.byType[result.type] = (report.byType[result.type] || 0) + 1

      // 按语言统计
      report.byLanguage[result.language] =
        (report.byLanguage[result.language] || 0) + 1
    })

    return report
  }

  /**
   * 打印验证报告
   */
  printReport(results: ValidationResult[]): void {
    const report = this.generateReport(results)

    logger.info('\n=== 翻译质量验证报告 ===\n')
    logger.info(`总问题数: ${report.total}`)
    logger.error(`  错误: ${report.errors}`)
    logger.warn(`  警告: ${report.warnings}`)
    logger.info(`  提示: ${report.infos}`)

    if (Object.keys(report.byType).length > 0) {
      logger.info('\n按类型统计:')
      Object.entries(report.byType).forEach(([type, count]) => {
        logger.info(`  ${type}: ${count}`)
      })
    }

    if (Object.keys(report.byLanguage).length > 0) {
      logger.info('\n按语言统计:')
      Object.entries(report.byLanguage).forEach(([lang, count]) => {
        logger.info(`  ${lang}: ${count}`)
      })
    }

    // 打印详细问题
    if (results.length > 0) {
      logger.info('\n问题详情:')
      results.forEach((result, index) => {
        const icon =
          result.severity === 'error'
            ? '❌'
            : result.severity === 'warning'
              ? '⚠️'
              : 'ℹ️'
        logger.info(
          `${index + 1}. ${icon} [${result.language}] ${result.key}: ${result.message}`
        )
        if (result.source) {
          logger.info(`   源文本: ${result.source}`)
        }
        if (result.translation) {
          logger.info(`   译文: ${result.translation}`)
        }
      })
    }
  }

  /**
   * 加载翻译条目
   */
  private async loadTranslations(
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

      // 加载源语言文件获取原文
      const sourceLang = this.config.sourceLanguage
      const sourceFilename = `${sourceLang}.${format}`
      const sourceFilePath = path.join(outputDir, sourceFilename)

      let sourceData: Record<string, string> = {}
      if (await fileExists(sourceFilePath)) {
        sourceData = await readJSON<Record<string, string>>(sourceFilePath)
      }

      const targetData = await readJSON<Record<string, string>>(filePath)

      return Object.entries(targetData).map(([key, translation]) => ({
        key,
        source: sourceData[key] || '',
        translations: {
          [targetLang]: translation,
        },
      }))
    } catch (error) {
      logger.error(`加载翻译失败: ${targetLang}`, error)
      return []
    }
  }
}

/**
 * 验证翻译（辅助函数）
 */
export async function validateTranslations(
  config: TranslatorConfig,
  targetLangs: string[],
  options?: {
    checkPlaceholders?: boolean
    checkHtmlTags?: boolean
    checkLength?: boolean
    maxLength?: number
  }
): Promise<ValidationResult[]> {
  const validator = new TranslationValidator(config)
  return validator.validateAll(targetLangs, options)
}
