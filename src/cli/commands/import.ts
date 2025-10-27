import ora from 'ora'
import type { ImportOptions, TranslatorConfig } from '../../types/index.js'
import { ExcelHandler } from '../../core/excel-handler.js'
import { TranslationMemory } from '../../core/memory.js'
import { logger } from '../../utils/logger.js'
import { writeJSON } from '../../utils/file-utils.js'
import path from 'path'

/**
 * 导入命令
 */
export async function importCommand(
  config: TranslatorConfig,
  options: ImportOptions
): Promise<void> {
  const spinner = ora('正在验证 Excel 文件...').start()

  try {
    const excelHandler = new ExcelHandler()

    // 验证文件格式
    if (options.validate !== false) {
      const validation = await excelHandler.validateExcelFile(options.file, [
        'key',
        'source',
        ...config.targetLanguages,
      ])

      if (!validation.valid) {
        spinner.fail('文件验证失败')
        validation.errors.forEach((error) => logger.error(error))
        return
      }

      spinner.succeed('文件验证通过')
    } else {
      spinner.succeed()
    }

    // 导入翻译
    spinner.start('正在导入翻译...')

    const translations = await excelHandler.importFromExcel(
      options.file,
      config.targetLanguages
    )

    spinner.succeed(`导入了 ${translations.length} 条翻译`)

    // 按语言保存翻译文件
    spinner.start('正在保存翻译文件...')

    const languagesToSave = [config.sourceLanguage, ...config.targetLanguages]

    for (const lang of languagesToSave) {
      const langTranslations: Record<string, string> = {}

      translations.forEach((entry) => {
        if (lang === config.sourceLanguage) {
          langTranslations[entry.key] = entry.source
        } else if (entry.translations[lang]) {
          langTranslations[entry.key] = entry.translations[lang]
        }
      })

      if (Object.keys(langTranslations).length > 0) {
        const outputPath = path.join(
          config.output.dir,
          `${lang}.${config.output.format}`
        )

        await writeJSON(outputPath, langTranslations, config.output.minify)
        logger.info(`  ${lang}: ${Object.keys(langTranslations).length} 条`)
      }
    }

    spinner.succeed('翻译文件已保存')

    // 保存到翻译记忆
    if (config.memory?.enabled) {
      spinner.start('正在保存到翻译记忆...')

      const memory = new TranslationMemory(config.memory)
      const memoryEntries: Array<{
        source: string
        targetLang: string
        translation: string
        sourceType: 'imported'
      }> = []

      translations.forEach((entry) => {
        config.targetLanguages.forEach((lang) => {
          if (entry.translations[lang]) {
            memoryEntries.push({
              source: entry.source,
              targetLang: lang,
              translation: entry.translations[lang],
              sourceType: 'imported',
            })
          }
        })
      })

      memory.addTranslationsBatch(memoryEntries)
      memory.close()

      spinner.succeed(`已保存 ${memoryEntries.length} 条到翻译记忆`)
    }

    logger.newLine()
    logger.success('✨ 导入完成!')
    logger.info(`\n翻译条目: ${translations.length}`)
    logger.info(`语言: ${languagesToSave.join(', ')}`)
  } catch (error) {
    spinner.fail('导入失败')
    logger.error('从 Excel 导入失败', error)
    throw error
  }
}


