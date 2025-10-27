#!/usr/bin/env node

import { Command } from 'commander'
import { loadConfig } from '../core/config-loader.js'
import { initCommand } from './commands/init.js'
import { extractCommand } from './commands/extract.js'
import { translateCommand } from './commands/translate.js'
import { exportCommand } from './commands/export.js'
import { importCommand } from './commands/import.js'
import { serveCommand } from './commands/serve.js'
import { logger } from '../utils/logger.js'
import type {
  InitOptions,
  ExtractOptions,
  TranslateOptions,
  ExportOptions,
  ImportOptions,
} from '../types/index.js'

// 创建 CLI 程序
const program = new Command()

program
  .name('ldesign-translator')
  .description('智能的国际化翻译管理工具，让多语言支持变得简单')
  .version('1.0.0')

// init 命令
program
  .command('init')
  .description('初始化翻译配置')
  .option('-s, --source-language <lang>', '源语言', 'zh-CN')
  .option('-t, --target-languages <langs>', '目标语言（逗号分隔）', 'en')
  .option('-p, --provider <provider>', '翻译服务提供商', 'google')
  .option('-f, --force', '强制覆盖已存在的配置文件')
  .option('--skip-prompts', '跳过交互式提示')
  .action(async (options: InitOptions) => {
    try {
      // 处理目标语言
      if (typeof options.targetLanguages === 'string') {
        options.targetLanguages = options.targetLanguages
          .split(',')
          .map((l) => l.trim())
      }

      await initCommand(options)
    } catch (error) {
      logger.error('命令执行失败', error as Error)
      process.exit(1)
    }
  })

// extract 命令
program
  .command('extract [paths...]')
  .description('扫描并提取代码中的中文文本')
  .option('-v, --verbose', '显示详细信息')
  .option('-o, --overwrite', '覆盖已有的键')
  .action(async (paths: string[], options: ExtractOptions) => {
    try {
      const config = await loadConfig()
      options.paths = paths
      await extractCommand(config, options)
    } catch (error) {
      logger.error('命令执行失败', error as Error)
      process.exit(1)
    }
  })

// translate 命令
program
  .command('translate')
  .description('翻译提取的文本')
  .requiredOption('--to <languages>', '目标语言（逗号分隔）')
  .option('-f, --force', '强制重新翻译所有文本')
  .option('-v, --verbose', '显示详细信息')
  .option('--no-use-memory', '不使用翻译记忆')
  .action(async (options: TranslateOptions) => {
    try {
      const config = await loadConfig()
      await translateCommand(config, options)
    } catch (error) {
      logger.error('命令执行失败', error as Error)
      process.exit(1)
    }
  })

// export 命令
program
  .command('export')
  .description('导出翻译到 Excel 文件')
  .requiredOption('-o, --output <file>', 'Excel 输出文件路径')
  .option('-l, --languages <langs>', '要导出的语言（逗号分隔）')
  .option('--include-metadata', '包含元数据')
  .action(async (options: ExportOptions) => {
    try {
      const config = await loadConfig()

      // 处理语言列表
      if (typeof options.languages === 'string') {
        options.languages = options.languages.split(',').map((l) => l.trim())
      }

      await exportCommand(config, options)
    } catch (error) {
      logger.error('命令执行失败', error as Error)
      process.exit(1)
    }
  })

// import 命令
program
  .command('import')
  .description('从 Excel 文件导入翻译')
  .requiredOption('-f, --file <file>', 'Excel 文件路径')
  .option('--overwrite', '覆盖已有翻译')
  .option('--no-validate', '跳过验证')
  .action(async (options: ImportOptions) => {
    try {
      const config = await loadConfig()
      await importCommand(config, options)
    } catch (error) {
      logger.error('命令执行失败', error as Error)
      process.exit(1)
    }
  })

// serve 命令
program
  .command('serve')
  .description('启动 Web UI 服务器')
  .option('-p, --port <port>', '服务器端口', '3000')
  .action(async (options: { port?: string }) => {
    try {
      const config = await loadConfig()
      const port = options.port ? parseInt(options.port, 10) : 3000
      await serveCommand(config, { port })
    } catch (error) {
      logger.error('命令执行失败', error as Error)
      process.exit(1)
    }
  })

// 解析命令行参数
program.parse()


