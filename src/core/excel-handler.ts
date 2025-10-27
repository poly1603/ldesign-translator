import xlsx from 'xlsx'
import type { ExcelRow, TranslationEntry } from '../types/index.js'
import { logger } from '../utils/logger.js'
import { readFile, writeFile, fileExists } from '../utils/file-utils.js'

/**
 * Excel 处理器
 */
export class ExcelHandler {
  /**
   * 导出翻译到 Excel
   */
  async exportToExcel(
    translations: TranslationEntry[],
    outputPath: string,
    languages: string[]
  ): Promise<void> {
    try {
      logger.info(`正在导出到 Excel: ${outputPath}`)

      // 准备数据
      const rows: ExcelRow[] = translations.map((entry) => {
        const row: ExcelRow = {
          key: entry.key,
          source: entry.source,
        }

        // 添加各语言翻译
        languages.forEach((lang) => {
          row[lang] = entry.translations[lang] || ''
        })

        // 添加元数据（可选）
        if (entry.metadata?.file) {
          row['file'] = entry.metadata.file
        }
        if (entry.metadata?.context) {
          row['context'] = entry.metadata.context
        }

        return row
      })

      // 创建工作簿
      const workbook = xlsx.utils.book_new()

      // 创建工作表
      const worksheet = xlsx.utils.json_to_sheet(rows)

      // 设置列宽
      const columnWidths = [
        { wch: 30 }, // key
        { wch: 40 }, // source
        ...languages.map(() => ({ wch: 40 })), // translations
      ]

      if (rows.some((r) => 'file' in r)) {
        columnWidths.push({ wch: 30 }) // file
      }
      if (rows.some((r) => 'context' in r)) {
        columnWidths.push({ wch: 30 }) // context
      }

      worksheet['!cols'] = columnWidths

      // 添加工作表到工作簿
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Translations')

      // 写入文件
      xlsx.writeFile(workbook, outputPath)

      logger.success(`已导出 ${translations.length} 条翻译到 ${outputPath}`)
    } catch (error) {
      logger.error('导出到 Excel 失败', error)
      throw error
    }
  }

  /**
   * 从 Excel 导入翻译
   */
  async importFromExcel(
    filePath: string,
    languages: string[]
  ): Promise<TranslationEntry[]> {
    try {
      logger.info(`正在从 Excel 导入: ${filePath}`)

      // 检查文件是否存在
      if (!(await fileExists(filePath))) {
        throw new Error(`文件不存在: ${filePath}`)
      }

      // 读取 Excel 文件
      const workbook = xlsx.readFile(filePath)

      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // 转换为 JSON
      const rows = xlsx.utils.sheet_to_json<ExcelRow>(worksheet)

      // 验证数据
      if (rows.length === 0) {
        throw new Error('Excel 文件为空')
      }

      // 转换为 TranslationEntry
      const translations: TranslationEntry[] = rows.map((row) => {
        const entry: TranslationEntry = {
          key: row.key || '',
          source: row.source || '',
          translations: {},
        }

        // 提取各语言翻译
        languages.forEach((lang) => {
          if (row[lang]) {
            entry.translations[lang] = row[lang]
          }
        })

        // 提取元数据
        if (row['file'] || row['context']) {
          entry.metadata = {
            file: row['file'],
            context: row['context'],
          }
        }

        return entry
      })

      // 验证必填字段
      const invalidEntries = translations.filter(
        (t) => !t.key || !t.source
      )

      if (invalidEntries.length > 0) {
        logger.warn(`发现 ${invalidEntries.length} 条无效记录（缺少 key 或 source）`)
      }

      const validTranslations = translations.filter((t) => t.key && t.source)

      logger.success(`已从 Excel 导入 ${validTranslations.length} 条翻译`)

      return validTranslations
    } catch (error) {
      logger.error('从 Excel 导入失败', error)
      throw error
    }
  }

  /**
   * 导出翻译模板
   */
  async exportTemplate(
    outputPath: string,
    languages: string[],
    sampleTexts: string[] = []
  ): Promise<void> {
    try {
      logger.info(`正在导出翻译模板: ${outputPath}`)

      // 创建示例数据
      const rows: ExcelRow[] = sampleTexts.map((text, index) => {
        const row: ExcelRow = {
          key: `sample_${index + 1}`,
          source: text,
        }

        languages.forEach((lang) => {
          row[lang] = '' // 空白待翻译
        })

        return row
      })

      // 如果没有示例文本，创建空模板
      if (rows.length === 0) {
        const emptyRow: ExcelRow = {
          key: 'example_key',
          source: '示例文本',
        }

        languages.forEach((lang) => {
          emptyRow[lang] = ''
        })

        rows.push(emptyRow)
      }

      // 创建工作簿
      const workbook = xlsx.utils.book_new()
      const worksheet = xlsx.utils.json_to_sheet(rows)

      // 设置列宽
      worksheet['!cols'] = [
        { wch: 30 }, // key
        { wch: 40 }, // source
        ...languages.map(() => ({ wch: 40 })), // translations
      ]

      // 添加工作表
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Translations')

      // 写入文件
      xlsx.writeFile(workbook, outputPath)

      logger.success(`翻译模板已导出到 ${outputPath}`)
    } catch (error) {
      logger.error('导出模板失败', error)
      throw error
    }
  }

  /**
   * 验证 Excel 文件格式
   */
  async validateExcelFile(
    filePath: string,
    requiredColumns: string[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      // 检查文件是否存在
      if (!(await fileExists(filePath))) {
        errors.push(`文件不存在: ${filePath}`)
        return { valid: false, errors }
      }

      // 读取 Excel
      const workbook = xlsx.readFile(filePath)

      // 检查是否有工作表
      if (workbook.SheetNames.length === 0) {
        errors.push('Excel 文件中没有工作表')
        return { valid: false, errors }
      }

      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // 获取列名
      const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1')
      const headers: string[] = []

      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = xlsx.utils.encode_cell({ r: 0, c: col })
        const cell = worksheet[cellAddress]
        if (cell && cell.v) {
          headers.push(cell.v.toString())
        }
      }

      // 检查必需的列
      const missingColumns = requiredColumns.filter(
        (col) => !headers.includes(col)
      )

      if (missingColumns.length > 0) {
        errors.push(`缺少必需的列: ${missingColumns.join(', ')}`)
      }

      // 检查是否有数据行
      if (range.e.r < 1) {
        errors.push('Excel 文件中没有数据行')
      }

      return { valid: errors.length === 0, errors }
    } catch (error) {
      errors.push(`验证文件时出错: ${(error as Error).message}`)
      return { valid: false, errors }
    }
  }
}

/**
 * 创建 Excel 处理器实例
 */
export function createExcelHandler(): ExcelHandler {
  return new ExcelHandler()
}


