import type { TranslatorConfig, ValidateOptions } from '../../types/index.js'
import { TranslationValidator } from '../../core/validator.js'
import { logger } from '../../utils/logger.js'
import ora from 'ora'

/**
 * 验证翻译质量命令
 */
export async function validateCommand(
  config: TranslatorConfig,
  options: ValidateOptions
): Promise<void> {
  const spinner = ora('验证翻译质量...').start()

  try {
    // 确定要验证的语言
    const languages = options.languages || config.targetLanguages

    if (!languages || languages.length === 0) {
      spinner.fail('未指定要验证的语言')
      return
    }

    spinner.text = `验证 ${languages.join(', ')} 的翻译...`

    // 创建验证器
    const validator = new TranslationValidator(config)

    // 执行验证
    const results = await validator.validateAll(languages, {
      checkPlaceholders:
        options.checkPlaceholders ?? config.validation?.checkPlaceholders ?? true,
      checkHtmlTags:
        options.checkHtmlTags ?? config.validation?.checkHtmlTags ?? true,
      checkLength: options.checkLength ?? config.validation?.checkLength ?? true,
      maxLength: options.maxLength ?? config.validation?.maxLength ?? 1000,
    })

    spinner.stop()

    // 打印报告
    validator.printReport(results)

    // 根据错误数量决定退出码
    const report = validator.generateReport(results)
    if (report.errors > 0) {
      logger.error(`\n验证失败: 发现 ${report.errors} 个错误`)
      process.exitCode = 1
    } else if (report.warnings > 0) {
      logger.warn(`\n验证通过: 但有 ${report.warnings} 个警告`)
    } else {
      logger.success('\n验证通过: 所有翻译质量良好! ✨')
    }
  } catch (error) {
    spinner.fail('验证失败')
    logger.error('验证过程中发生错误', error as Error)
    throw error
  }
}
