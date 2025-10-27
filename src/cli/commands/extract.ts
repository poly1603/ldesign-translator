import ora from 'ora'
import type { ExtractOptions, TranslatorConfig } from '../../types/index.js'
import { TextExtractor } from '../../core/extractor.js'
import { logger } from '../../utils/logger.js'
import { findFiles, writeJSON, ensureDir } from '../../utils/file-utils.js'
import path from 'path'

/**
 * 提取文本命令
 */
export async function extractCommand(
  config: TranslatorConfig,
  options: ExtractOptions
): Promise<void> {
  const spinner = ora('正在扫描文件...').start()

  try {
    const cwd = process.cwd()
    const { extract: extractConfig } = config

    // 确定扫描路径
    const patterns = options.paths && options.paths.length > 0
      ? options.paths
      : extractConfig.include

    // 查找文件
    const files = await findFiles(patterns, {
      cwd,
      ignore: extractConfig.exclude,
    })

    spinner.text = `找到 ${files.length} 个文件`
    spinner.succeed()

    if (files.length === 0) {
      logger.warn('未找到匹配的文件')
      return
    }

    // 提取文本
    spinner.start('正在提取文本...')
    const extractor = new TextExtractor(config)

    let extractedCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (options.verbose) {
        spinner.text = `提取文件 [${i + 1}/${files.length}]: ${file}`
      }

      try {
        const texts = await extractor.extractFromFile(file)
        texts.forEach((text) => extractor.addExtractedText(text))
        extractedCount += texts.length
      } catch (error) {
        logger.debug(`跳过文件: ${file}`)
      }
    }

    const allTexts = extractor.getAllTexts()
    spinner.succeed(`提取完成，共 ${allTexts.length} 条唯一文本`)

    if (allTexts.length === 0) {
      logger.warn('未找到中文文本')
      return
    }

    // 生成基础语言文件
    spinner.start('正在生成基础语言文件...')

    const outputDir = config.output.dir
    await ensureDir(outputDir)

    // 生成源语言文件
    const sourceTranslations: Record<string, string> = {}
    allTexts.forEach((text) => {
      sourceTranslations[text.key] = text.text
    })

    const sourceFile = path.join(
      outputDir,
      `${config.sourceLanguage}.${config.output.format}`
    )
    await writeJSON(sourceFile, sourceTranslations, config.output.minify)

    spinner.succeed(`源语言文件已生成: ${sourceFile}`)

    // 显示统计信息
    logger.newLine()
    logger.info('提取统计:')
    logger.info(`  文件数: ${files.length}`)
    logger.info(`  提取文本数: ${extractedCount}`)
    logger.info(`  唯一文本数: ${allTexts.length}`)

    // 按文件分组显示
    if (options.verbose) {
      logger.newLine()
      logger.group('提取详情:')

      const fileGroups = new Map<string, number>()
      allTexts.forEach((text) => {
        const count = fileGroups.get(text.file) || 0
        fileGroups.set(text.file, count + 1)
      })

      Array.from(fileGroups.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([file, count]) => {
          logger.info(`  ${file}: ${count} 条`)
        })

      logger.groupEnd()
    }

    logger.newLine()
    logger.success('✨ 文本提取完成!')
    logger.info('\n下一步:')
    logger.info(`  运行 \`npx ldesign-translator translate --to ${config.targetLanguages[0]}\` 开始翻译`)
  } catch (error) {
    spinner.fail('提取失败')
    logger.error('提取文本失败', error)
    throw error
  }
}


