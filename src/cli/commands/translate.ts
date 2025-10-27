import ora from 'ora'
import type { TranslateOptions, TranslatorConfig } from '../../types/index.js'
import { Translator } from '../../core/translator.js'
import { TextExtractor } from '../../core/extractor.js'
import { logger } from '../../utils/logger.js'
import { findFiles, readJSON, fileExists } from '../../utils/file-utils.js'
import path from 'path'

/**
 * 翻译命令
 */
export async function translateCommand(
  config: TranslatorConfig,
  options: TranslateOptions
): Promise<void> {
  const spinner = ora('正在初始化...').start()

  try {
    // 解析目标语言
    const targetLangs = Array.isArray(options.to)
      ? options.to
      : options.to.split(',').map((l) => l.trim())

    spinner.text = `准备翻译到: ${targetLangs.join(', ')}`

    // 加载源语言文件
    const sourceFile = path.join(
      config.output.dir,
      `${config.sourceLanguage}.${config.output.format}`
    )

    if (!(await fileExists(sourceFile))) {
      spinner.fail()
      logger.error(`源语言文件不存在: ${sourceFile}`)
      logger.info('请先运行 `npx ldesign-translator extract` 提取文本')
      return
    }

    const sourceData = await readJSON<Record<string, string>>(sourceFile)
    const sourceTexts = Object.entries(sourceData).map(([key, text]) => ({
      key,
      text,
      file: '',
    }))

    spinner.succeed(`加载了 ${sourceTexts.length} 条源文本`)

    if (sourceTexts.length === 0) {
      logger.warn('没有需要翻译的文本')
      return
    }

    // 创建翻译器
    const translator = new Translator(config)

    // 翻译到每个目标语言
    for (const targetLang of targetLangs) {
      logger.newLine()
      spinner.start(`正在翻译到 ${targetLang}...`)

      try {
        const entries = await translator.translateTexts(
          sourceTexts,
          targetLang,
          {
            useMemory: options.useMemory !== false,
            force: options.force,
          }
        )

        // 保存翻译结果
        await translator.saveTranslations(entries, targetLang)

        spinner.succeed(`翻译到 ${targetLang} 完成`)

        // 显示统计信息
        if (options.verbose) {
          const stats = translator.getStatistics(entries, [targetLang])
          logger.info(`  已翻译: ${stats.translated[targetLang]}/${stats.total}`)
          logger.info(`  完成率: ${stats.percentage[targetLang].toFixed(1)}%`)
        }
      } catch (error) {
        spinner.fail(`翻译到 ${targetLang} 失败`)
        logger.error(`翻译失败: ${targetLang}`, error)
      }
    }

    // 关闭翻译器
    translator.close()

    logger.newLine()
    logger.success('✨ 翻译完成!')
  } catch (error) {
    spinner.fail('翻译失败')
    logger.error('翻译过程出错', error)
    throw error
  }
}


