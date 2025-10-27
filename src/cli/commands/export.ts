import ora from 'ora'
import type { ExportOptions, TranslatorConfig, TranslationEntry } from '../../types/index.js'
import { ExcelHandler } from '../../core/excel-handler.js'
import { logger } from '../../utils/logger.js'
import { readJSON, fileExists } from '../../utils/file-utils.js'
import path from 'path'

/**
 * 导出命令
 */
export async function exportCommand(
  config: TranslatorConfig,
  options: ExportOptions
): Promise<void> {
  const spinner = ora('正在准备导出...').start()

  try {
    const languages = options.languages || [
      config.sourceLanguage,
      ...config.targetLanguages,
    ]

    spinner.text = `准备导出语言: ${languages.join(', ')}`

    // 加载所有语言文件
    const translations: TranslationEntry[] = []
    const allKeys = new Set<string>()

    // 加载源语言文件
    const sourceFile = path.join(
      config.output.dir,
      `${config.sourceLanguage}.${config.output.format}`
    )

    if (!(await fileExists(sourceFile))) {
      spinner.fail()
      logger.error(`源语言文件不存在: ${sourceFile}`)
      return
    }

    const sourceData = await readJSON<Record<string, string>>(sourceFile)

    // 收集所有键
    Object.keys(sourceData).forEach((key) => allKeys.add(key))

    // 创建翻译条目
    allKeys.forEach((key) => {
      translations.push({
        key,
        source: sourceData[key] || '',
        translations: {},
      })
    })

    // 加载目标语言翻译
    for (const lang of config.targetLanguages) {
      const langFile = path.join(
        config.output.dir,
        `${lang}.${config.output.format}`
      )

      if (await fileExists(langFile)) {
        const langData = await readJSON<Record<string, string>>(langFile)

        translations.forEach((entry) => {
          if (langData[entry.key]) {
            entry.translations[lang] = langData[entry.key]
          }
        })
      }
    }

    spinner.succeed(`加载了 ${translations.length} 条翻译`)

    // 导出到 Excel
    spinner.start('正在导出到 Excel...')

    const excelHandler = new ExcelHandler()
    await excelHandler.exportToExcel(
      translations,
      options.output,
      languages.filter((l) => l !== config.sourceLanguage)
    )

    spinner.succeed(`已导出到: ${options.output}`)

    logger.newLine()
    logger.success('✨ 导出完成!')
    logger.info(`\n文件路径: ${options.output}`)
    logger.info(`包含语言: ${languages.join(', ')}`)
    logger.info(`翻译条目: ${translations.length}`)
  } catch (error) {
    spinner.fail('导出失败')
    logger.error('导出到 Excel 失败', error)
    throw error
  }
}


