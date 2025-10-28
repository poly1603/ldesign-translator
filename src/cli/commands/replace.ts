import type { TranslatorConfig, ReplaceOptions } from '../../types/index.js'
import { CodeReplacer } from '../../core/replacer.js'
import { TextExtractor } from '../../core/extractor.js'
import { logger } from '../../utils/logger.js'
import { scanFiles } from '../../utils/file-utils.js'
import ora from 'ora'

/**
 * 替换代码中的硬编码文本命令
 */
export async function replaceCommand(
  config: TranslatorConfig,
  options: ReplaceOptions
): Promise<void> {
  const spinner = ora('准备替换...').start()

  try {
    // 扫描文件
    spinner.text = '扫描文件...'
    const patterns = options.paths || config.extract.include
    const exclude = config.extract.exclude || []

    const files = await scanFiles(patterns, {
      ignore: exclude,
    })

    if (files.length === 0) {
      spinner.warn('未找到要处理的文件')
      return
    }

    logger.info(`找到 ${files.length} 个文件`)

    // 提取已有的文本和键
    spinner.text = '加载已提取的文本...'
    const extractor = new TextExtractor(config)

    for (const file of files) {
      const texts = await extractor.extractFromFile(file)
      texts.forEach((text) => extractor.addExtractedText(text))
    }

    const extractedTexts = extractor.getAllTexts()
    logger.info(`加载了 ${extractedTexts.length} 个文本键值对`)

    if (extractedTexts.length === 0) {
      spinner.warn('未找到已提取的文本')
      return
    }

    // 创建替换器
    const replacer = new CodeReplacer(config, {
      i18nFunction: options.i18nFunction,
      addImports: options.addImports,
    })

    await replacer.loadExtractedKeys(extractedTexts)

    // 执行替换
    spinner.text = `${options.dryRun ? '预览' : '替换'}中...`

    const results = await replacer.replaceFiles(files, {
      backup: options.backup ?? true,
      dryRun: options.dryRun ?? false,
    })

    spinner.stop()

    // 打印结果
    if (options.verbose && results.length > 0) {
      results.forEach((result) => {
        if (result.success && result.replacements && result.replacements.length > 0) {
          logger.info(`\n${result.filePath}:`)
          result.replacements.forEach((rep) => {
            logger.info(
              `  行 ${rep.line}:${rep.column} - ${rep.original} => ${rep.replaced}`
            )
          })
        }
      })
    }

    // 打印报告
    replacer.printReport(results, options.dryRun)

    // 统计
    const report = replacer.generateReport(results)
    if (report.totalReplacements > 0) {
      if (options.dryRun) {
        logger.info(
          `\n预览完成! 共发现 ${report.totalReplacements} 处可替换的文本`
        )
        logger.info('运行 replace 命令（不带 --dry-run）来应用这些更改')
      } else {
        logger.success(
          `\n替换完成! 共替换了 ${report.totalReplacements} 处文本 ✨`
        )
        if (options.backup) {
          logger.info('原文件已备份为 .backup 文件')
        }
      }
    } else {
      logger.info('\n未发现需要替换的文本')
    }
  } catch (error) {
    spinner.fail('替换失败')
    logger.error('替换过程中发生错误', error as Error)
    throw error
  }
}
