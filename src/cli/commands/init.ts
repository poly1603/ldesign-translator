import inquirer from 'inquirer'
import fs from 'fs-extra'
import path from 'path'
import ejs from 'ejs'
import type { InitOptions } from '../../types/index.js'
import { logger } from '../../utils/logger.js'
import { fileExists, writeFile } from '../../utils/file-utils.js'

/**
 * 初始化配置文件
 */
export async function initCommand(options: InitOptions): Promise<void> {
  try {
    const cwd = process.cwd()
    const configPath = path.join(cwd, 'translator.config.js')

    // 检查配置文件是否已存在
    if ((await fileExists(configPath)) && !options.force) {
      logger.warn('配置文件已存在，使用 --force 覆盖')
      return
    }

    let config: Partial<InitOptions> = {}

    if (options.skipPrompts) {
      // 使用默认配置
      config = {
        sourceLanguage: options.sourceLanguage || 'zh-CN',
        targetLanguages: options.targetLanguages || ['en'],
        provider: options.provider || 'google',
      }
    } else {
      // 交互式配置
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'sourceLanguage',
          message: '源语言:',
          default: options.sourceLanguage || 'zh-CN',
        },
        {
          type: 'input',
          name: 'targetLanguages',
          message: '目标语言 (逗号分隔):',
          default:
            options.targetLanguages?.join(',') || 'en,ja,ko',
          filter: (value: string) => value.split(',').map((v) => v.trim()),
        },
        {
          type: 'list',
          name: 'provider',
          message: '选择翻译服务提供商:',
          choices: [
            { name: 'Google Translate', value: 'google' },
            { name: '百度翻译', value: 'baidu' },
            { name: 'DeepL', value: 'deepl' },
          ],
          default: options.provider || 'google',
        },
        {
          type: 'input',
          name: 'apiKey',
          message: 'API 密钥 (可稍后配置):',
          default: '',
        },
        {
          type: 'input',
          name: 'outputDir',
          message: '输出目录:',
          default: 'src/locales',
        },
        {
          type: 'list',
          name: 'outputFormat',
          message: '输出格式:',
          choices: [
            { name: 'JSON', value: 'json' },
            { name: 'YAML', value: 'yaml' },
            { name: 'JavaScript', value: 'js' },
            { name: 'TypeScript', value: 'ts' },
          ],
          default: 'json',
        },
        {
          type: 'confirm',
          name: 'enableMemory',
          message: '启用翻译记忆?',
          default: true,
        },
      ])

      config = answers
    }

    // 生成配置文件
    const templatePath = path.join(
      new URL('..', import.meta.url).pathname,
      '../../templates/translator.config.ejs'
    )

    let configContent: string

    if (await fileExists(templatePath)) {
      const template = await fs.readFile(templatePath, 'utf-8')
      configContent = ejs.render(template, config)
    } else {
      // 使用内联模板
      configContent = generateConfigContent(config)
    }

    // 写入配置文件
    await writeFile(configPath, configContent)

    logger.success(`配置文件已创建: ${configPath}`)
    logger.info('\n下一步:')
    logger.info('1. 编辑配置文件，设置 API 密钥')
    logger.info('2. 运行 `npx ldesign-translator extract` 提取文本')
    logger.info('3. 运行 `npx ldesign-translator translate --to en` 翻译文本')
  } catch (error) {
    logger.error('初始化失败', error)
    throw error
  }
}

/**
 * 生成配置文件内容
 */
function generateConfigContent(config: Partial<InitOptions> & any): string {
  return `module.exports = {
  // 源语言
  sourceLanguage: '${config.sourceLanguage || 'zh-CN'}',
  
  // 目标语言
  targetLanguages: ${JSON.stringify(config.targetLanguages || ['en'])},
  
  // 翻译 API 配置
  api: {
    provider: '${config.provider || 'google'}', // 'google', 'baidu', 'deepl'
    key: process.env.TRANSLATE_API_KEY || '${config.apiKey || ''}',
    ${config.provider === 'baidu' ? `
    // 百度翻译配置
    baidu: {
      appid: process.env.BAIDU_APPID || '',
      secret: process.env.BAIDU_SECRET || '',
    },
    ` : ''}
    rateLimit: 10, // 每秒请求数
    batchSize: 50, // 批量大小
    retries: 3, // 重试次数
  },
  
  // 扫描配置
  extract: {
    include: ['src/**/*.{js,jsx,ts,tsx,vue}'],
    exclude: ['node_modules', 'dist', 'build'],
    // 中文匹配正则
    patterns: [/[\\u4e00-\\u9fa5]+/g],
    includeComments: false,
  },
  
  // 输出配置
  output: {
    dir: '${config.outputDir || 'src/locales'}',
    format: '${config.outputFormat || 'json'}', // 'json', 'yaml', 'js', 'ts'
    minify: false,
    splitByNamespace: false,
  },
  
  // 翻译记忆配置
  memory: {
    enabled: ${config.enableMemory !== false},
    dbPath: '.translator/memory.db',
    similarityThreshold: 0.7,
  },
  
  // 增量翻译
  incremental: true,
}
`
}


