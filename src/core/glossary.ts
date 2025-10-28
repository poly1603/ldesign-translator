import type { GlossaryEntry, GlossaryConfig } from '../types/index.js'
import { logger } from '../utils/logger.js'
import { readJSON, writeJSON, fileExists } from '../utils/file-utils.js'
import { escapeRegExp } from '../utils/pattern-matcher.js'

/**
 * 术语库管理器
 */
export class GlossaryManager {
  private config: GlossaryConfig
  private entries: Map<string, GlossaryEntry> = new Map()

  constructor(config: GlossaryConfig) {
    this.config = config
  }

  /**
   * 加载术语库
   */
  async load(): Promise<void> {
    if (!this.config.enabled) {
      logger.debug('术语库未启用')
      return
    }

    // 从配置中加载术语
    if (this.config.entries && this.config.entries.length > 0) {
      this.config.entries.forEach((entry) => {
        this.entries.set(entry.term.toLowerCase(), entry)
      })
      logger.debug(`从配置加载了 ${this.config.entries.length} 个术语`)
    }

    // 从文件加载术语
    if (this.config.filePath && (await fileExists(this.config.filePath))) {
      try {
        const fileEntries = await readJSON<GlossaryEntry[]>(
          this.config.filePath
        )
        fileEntries.forEach((entry) => {
          this.entries.set(entry.term.toLowerCase(), entry)
        })
        logger.debug(
          `从文件加载了 ${fileEntries.length} 个术语: ${this.config.filePath}`
        )
      } catch (error) {
        logger.error('加载术语库文件失败', error)
      }
    }

    logger.success(`术语库加载完成，共 ${this.entries.size} 个术语`)
  }

  /**
   * 保存术语库到文件
   */
  async save(): Promise<void> {
    if (!this.config.filePath) {
      logger.warn('未配置术语库文件路径')
      return
    }

    try {
      const entries = Array.from(this.entries.values())
      await writeJSON(this.config.filePath, entries, false)
      logger.success(`术语库已保存: ${this.config.filePath}`)
    } catch (error) {
      logger.error('保存术语库失败', error)
    }
  }

  /**
   * 添加术语
   */
  addTerm(entry: GlossaryEntry): void {
    const key = entry.term.toLowerCase()
    this.entries.set(key, entry)
    logger.debug(`添加术语: ${entry.term}`)
  }

  /**
   * 批量添加术语
   */
  addTerms(entries: GlossaryEntry[]): void {
    entries.forEach((entry) => this.addTerm(entry))
    logger.success(`批量添加了 ${entries.length} 个术语`)
  }

  /**
   * 删除术语
   */
  removeTerm(term: string): boolean {
    const key = term.toLowerCase()
    const deleted = this.entries.delete(key)
    if (deleted) {
      logger.debug(`删除术语: ${term}`)
    }
    return deleted
  }

  /**
   * 获取术语
   */
  getTerm(term: string): GlossaryEntry | undefined {
    return this.entries.get(term.toLowerCase())
  }

  /**
   * 获取所有术语
   */
  getAllTerms(): GlossaryEntry[] {
    return Array.from(this.entries.values())
  }

  /**
   * 查找文本中的术语
   */
  findTermsInText(text: string): Array<{
    term: string
    entry: GlossaryEntry
    positions: number[]
  }> {
    const found: Array<{
      term: string
      entry: GlossaryEntry
      positions: number[]
    }> = []

    this.entries.forEach((entry, key) => {
      const searchTerm = entry.caseSensitive ? entry.term : entry.term
      const searchText = entry.caseSensitive ? text : text.toLowerCase()

      const regex = new RegExp(escapeRegExp(searchTerm), 'g')
      const matches = searchText.matchAll(regex)
      const positions: number[] = []

      for (const match of matches) {
        if (match.index !== undefined) {
          positions.push(match.index)
        }
      }

      if (positions.length > 0) {
        found.push({
          term: entry.term,
          entry,
          positions,
        })
      }
    })

    return found
  }

  /**
   * 应用术语翻译
   */
  applyTerms(text: string, targetLang: string): string {
    let result = text

    // 按术语长度倒序排序，避免短术语覆盖长术语
    const sortedEntries = Array.from(this.entries.values()).sort(
      (a, b) => b.term.length - a.term.length
    )

    sortedEntries.forEach((entry) => {
      // 如果是禁止翻译的术语，跳过
      if (entry.doNotTranslate) {
        return
      }

      const translation = entry.translations[targetLang]
      if (!translation) {
        return
      }

      const flags = entry.caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(escapeRegExp(entry.term), flags)
      result = result.replace(regex, translation)
    })

    return result
  }

  /**
   * 保护禁止翻译的术语
   */
  protectTerms(text: string): {
    protected: string
    protectedTerms: Map<string, string>
  } {
    const protectedTerms = new Map<string, string>()
    let protected_text = text
    let index = 0

    // 按术语长度倒序排序
    const sortedEntries = Array.from(this.entries.values())
      .filter((entry) => entry.doNotTranslate)
      .sort((a, b) => b.term.length - a.term.length)

    sortedEntries.forEach((entry) => {
      const flags = entry.caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(escapeRegExp(entry.term), flags)

      const matches = protected_text.matchAll(regex)
      for (const match of matches) {
        if (match[0]) {
          const marker = `__TERM_${index}__`
          protectedTerms.set(marker, match[0])
          protected_text = protected_text.replace(match[0], marker)
          index++
        }
      }
    })

    return { protected: protected_text, protectedTerms }
  }

  /**
   * 恢复受保护的术语
   */
  restoreTerms(
    text: string,
    protectedTerms: Map<string, string>
  ): string {
    let restored = text
    protectedTerms.forEach((original, marker) => {
      restored = restored.replace(
        new RegExp(escapeRegExp(marker), 'g'),
        original
      )
    })
    return restored
  }

  /**
   * 验证译文中的术语使用
   */
  validateTermUsage(
    source: string,
    translation: string,
    targetLang: string
  ): Array<{
    term: string
    issue: 'missing' | 'incorrect' | 'untranslated'
    expected?: string
    found?: string
  }> {
    const issues: Array<{
      term: string
      issue: 'missing' | 'incorrect' | 'untranslated'
      expected?: string
      found?: string
    }> = []

    const sourceTerms = this.findTermsInText(source)

    sourceTerms.forEach(({ term, entry }) => {
      // 跳过禁止翻译的术语（它们应该保持原样）
      if (entry.doNotTranslate) {
        const termExists = translation.includes(term)
        if (!termExists) {
          issues.push({
            term,
            issue: 'untranslated',
            expected: term,
          })
        }
        return
      }

      const expectedTranslation = entry.translations[targetLang]
      if (!expectedTranslation) {
        return
      }

      // 检查译文中是否包含正确的术语翻译
      const hasCorrectTranslation = translation.includes(expectedTranslation)
      const hasSourceTerm = translation.includes(term)

      if (!hasCorrectTranslation && hasSourceTerm) {
        issues.push({
          term,
          issue: 'untranslated',
          expected: expectedTranslation,
          found: term,
        })
      } else if (!hasCorrectTranslation) {
        issues.push({
          term,
          issue: 'missing',
          expected: expectedTranslation,
        })
      }
    })

    return issues
  }

  /**
   * 导出术语库为 Excel 格式的数据
   */
  exportToExcelData(): Array<Record<string, string>> {
    const data: Array<Record<string, string>> = []

    this.entries.forEach((entry) => {
      const row: Record<string, string> = {
        term: entry.term,
        description: entry.description || '',
        doNotTranslate: entry.doNotTranslate ? 'true' : 'false',
        caseSensitive: entry.caseSensitive ? 'true' : 'false',
      }

      // 添加各语言翻译
      Object.entries(entry.translations).forEach(([lang, translation]) => {
        row[lang] = translation
      })

      data.push(row)
    })

    return data
  }

  /**
   * 从 Excel 数据导入术语库
   */
  importFromExcelData(data: Array<Record<string, string>>): void {
    const entries: GlossaryEntry[] = []

    data.forEach((row) => {
      const term = row.term
      if (!term) return

      const translations: Record<string, string> = {}
      Object.entries(row).forEach(([key, value]) => {
        if (
          key !== 'term' &&
          key !== 'description' &&
          key !== 'doNotTranslate' &&
          key !== 'caseSensitive' &&
          value
        ) {
          translations[key] = value
        }
      })

      entries.push({
        term,
        translations,
        doNotTranslate: row.doNotTranslate === 'true',
        caseSensitive: row.caseSensitive === 'true',
        description: row.description,
      })
    })

    this.addTerms(entries)
    logger.success(`从 Excel 导入了 ${entries.length} 个术语`)
  }

  /**
   * 获取统计信息
   */
  getStatistics(): {
    total: number
    protected: number
    byLanguage: Record<string, number>
  } {
    const stats = {
      total: this.entries.size,
      protected: 0,
      byLanguage: {} as Record<string, number>,
    }

    this.entries.forEach((entry) => {
      if (entry.doNotTranslate) {
        stats.protected++
      }

      Object.keys(entry.translations).forEach((lang) => {
        stats.byLanguage[lang] = (stats.byLanguage[lang] || 0) + 1
      })
    })

    return stats
  }
}

/**
 * 创建默认术语库（辅助函数）
 */
export function createDefaultGlossary(): GlossaryEntry[] {
  return [
    {
      term: 'API',
      translations: {},
      doNotTranslate: true,
      caseSensitive: true,
      description: 'Application Programming Interface',
    },
    {
      term: 'UI',
      translations: {},
      doNotTranslate: true,
      caseSensitive: true,
      description: 'User Interface',
    },
    {
      term: 'URL',
      translations: {},
      doNotTranslate: true,
      caseSensitive: true,
      description: 'Uniform Resource Locator',
    },
    {
      term: 'HTTP',
      translations: {},
      doNotTranslate: true,
      caseSensitive: true,
      description: 'HyperText Transfer Protocol',
    },
    {
      term: 'HTTPS',
      translations: {},
      doNotTranslate: true,
      caseSensitive: true,
      description: 'HyperText Transfer Protocol Secure',
    },
  ]
}
