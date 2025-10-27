import Database from 'better-sqlite3'
import path from 'path'
import type { MemoryEntry, MemoryConfig } from '../types/index.js'
import { logger } from '../utils/logger.js'
import { ensureDir } from '../utils/file-utils.js'
import { calculateSimilarity } from '../utils/pattern-matcher.js'

/**
 * 翻译记忆管理器
 */
export class TranslationMemory {
  private db: Database.Database
  private config: MemoryConfig

  constructor(config: MemoryConfig) {
    this.config = config
    const dbPath = config.dbPath || '.translator/memory.db'

    // 确保数据库目录存在
    const dbDir = path.dirname(dbPath)
    ensureDir(dbDir)

    // 初始化数据库
    this.db = new Database(dbPath)
    this.initDatabase()

    logger.debug(`翻译记忆数据库已初始化: ${dbPath}`)
  }

  /**
   * 初始化数据库表
   */
  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS translations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        target_lang TEXT NOT NULL,
        translation TEXT NOT NULL,
        source_type TEXT DEFAULT 'api',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        usage_count INTEGER DEFAULT 1,
        UNIQUE(source, target_lang)
      );

      CREATE INDEX IF NOT EXISTS idx_source ON translations(source);
      CREATE INDEX IF NOT EXISTS idx_target_lang ON translations(target_lang);
      CREATE INDEX IF NOT EXISTS idx_usage_count ON translations(usage_count DESC);
    `)
  }

  /**
   * 添加或更新翻译
   */
  addTranslation(
    source: string,
    targetLang: string,
    translation: string,
    sourceType: 'api' | 'manual' | 'imported' = 'api'
  ): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO translations (source, target_lang, translation, source_type, created_at, updated_at, usage_count)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), 1)
        ON CONFLICT(source, target_lang) 
        DO UPDATE SET 
          translation = excluded.translation,
          source_type = excluded.source_type,
          updated_at = datetime('now'),
          usage_count = usage_count + 1
      `)

      stmt.run(source, targetLang, translation, sourceType)
      logger.debug(`翻译已保存: ${source} -> ${translation}`)
    } catch (error) {
      logger.error('保存翻译失败', error)
    }
  }

  /**
   * 查找翻译
   */
  findTranslation(source: string, targetLang: string): string | null {
    try {
      const stmt = this.db.prepare(`
        SELECT translation FROM translations 
        WHERE source = ? AND target_lang = ?
      `)

      const row = stmt.get(source, targetLang) as { translation: string } | undefined

      if (row) {
        // 更新使用次数
        this.incrementUsageCount(source, targetLang)
        return row.translation
      }

      return null
    } catch (error) {
      logger.error('查找翻译失败', error)
      return null
    }
  }

  /**
   * 查找相似翻译
   */
  findSimilarTranslations(
    source: string,
    targetLang: string,
    limit = 5
  ): Array<{ source: string; translation: string; similarity: number }> {
    try {
      const stmt = this.db.prepare(`
        SELECT source, translation FROM translations 
        WHERE target_lang = ?
        ORDER BY usage_count DESC
        LIMIT 100
      `)

      const rows = stmt.all(targetLang) as Array<{
        source: string
        translation: string
      }>

      const threshold = this.config.similarityThreshold || 0.7
      const results: Array<{
        source: string
        translation: string
        similarity: number
      }> = []

      for (const row of rows) {
        const similarity = calculateSimilarity(source, row.source)
        if (similarity >= threshold) {
          results.push({
            source: row.source,
            translation: row.translation,
            similarity,
          })
        }
      }

      // 按相似度排序
      results.sort((a, b) => b.similarity - a.similarity)

      return results.slice(0, limit)
    } catch (error) {
      logger.error('查找相似翻译失败', error)
      return []
    }
  }

  /**
   * 批量添加翻译
   */
  addTranslationsBatch(
    translations: Array<{
      source: string
      targetLang: string
      translation: string
      sourceType?: 'api' | 'manual' | 'imported'
    }>
  ): void {
    const insert = this.db.transaction((items) => {
      const stmt = this.db.prepare(`
        INSERT INTO translations (source, target_lang, translation, source_type, created_at, updated_at, usage_count)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), 1)
        ON CONFLICT(source, target_lang) 
        DO UPDATE SET 
          translation = excluded.translation,
          source_type = excluded.source_type,
          updated_at = datetime('now'),
          usage_count = usage_count + 1
      `)

      for (const item of items) {
        stmt.run(
          item.source,
          item.targetLang,
          item.translation,
          item.sourceType || 'api'
        )
      }
    })

    try {
      insert(translations)
      logger.success(`批量添加 ${translations.length} 条翻译记忆`)
    } catch (error) {
      logger.error('批量添加翻译失败', error)
    }
  }

  /**
   * 增加使用次数
   */
  private incrementUsageCount(source: string, targetLang: string): void {
    try {
      const stmt = this.db.prepare(`
        UPDATE translations 
        SET usage_count = usage_count + 1,
            updated_at = datetime('now')
        WHERE source = ? AND target_lang = ?
      `)

      stmt.run(source, targetLang)
    } catch (error) {
      logger.error('更新使用次数失败', error)
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics(targetLang?: string): {
    total: number
    byLanguage: Record<string, number>
  } {
    try {
      let total = 0
      const byLanguage: Record<string, number> = {}

      if (targetLang) {
        const stmt = this.db.prepare(`
          SELECT COUNT(*) as count FROM translations WHERE target_lang = ?
        `)
        const row = stmt.get(targetLang) as { count: number }
        total = row.count
        byLanguage[targetLang] = row.count
      } else {
        const stmt = this.db.prepare(`
          SELECT target_lang, COUNT(*) as count 
          FROM translations 
          GROUP BY target_lang
        `)
        const rows = stmt.all() as Array<{ target_lang: string; count: number }>

        for (const row of rows) {
          byLanguage[row.target_lang] = row.count
          total += row.count
        }
      }

      return { total, byLanguage }
    } catch (error) {
      logger.error('获取统计信息失败', error)
      return { total: 0, byLanguage: {} }
    }
  }

  /**
   * 清空所有翻译
   */
  clear(): void {
    try {
      this.db.exec('DELETE FROM translations')
      logger.success('翻译记忆已清空')
    } catch (error) {
      logger.error('清空翻译记忆失败', error)
    }
  }

  /**
   * 导出翻译记忆
   */
  export(targetLang?: string): MemoryEntry[] {
    try {
      let stmt: Database.Statement

      if (targetLang) {
        stmt = this.db.prepare(`
          SELECT * FROM translations WHERE target_lang = ? ORDER BY usage_count DESC
        `)
        return stmt.all(targetLang) as MemoryEntry[]
      } else {
        stmt = this.db.prepare(`
          SELECT * FROM translations ORDER BY target_lang, usage_count DESC
        `)
        return stmt.all() as MemoryEntry[]
      }
    } catch (error) {
      logger.error('导出翻译记忆失败', error)
      return []
    }
  }

  /**
   * 关闭数据库
   */
  close(): void {
    try {
      this.db.close()
      logger.debug('翻译记忆数据库已关闭')
    } catch (error) {
      logger.error('关闭数据库失败', error)
    }
  }
}


