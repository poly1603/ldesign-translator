import { cosmiconfig } from 'cosmiconfig'
import type { TranslatorConfig } from '../types/index.js'
import { logger } from '../utils/logger.js'

const MODULE_NAME = 'translator'

/**
 * 默认配置
 */
export const defaultConfig: Partial<TranslatorConfig> = {
  sourceLanguage: 'zh-CN',
  targetLanguages: ['en'],
  api: {
    provider: 'google',
    key: '',
    rateLimit: 10,
    batchSize: 50,
    retries: 3,
  },
  extract: {
    include: ['src/**/*.{js,jsx,ts,tsx,vue}'],
    exclude: ['node_modules', 'dist', 'build'],
    includeComments: false,
  },
  output: {
    dir: 'src/locales',
    format: 'json',
    minify: false,
    splitByNamespace: false,
  },
  memory: {
    enabled: true,
    dbPath: '.translator/memory.db',
    similarityThreshold: 0.7,
  },
  incremental: true,
}

/**
 * 加载配置文件
 */
export async function loadConfig(
  searchFrom?: string
): Promise<TranslatorConfig> {
  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      'package.json',
      `.${MODULE_NAME}rc`,
      `.${MODULE_NAME}rc.json`,
      `.${MODULE_NAME}rc.yaml`,
      `.${MODULE_NAME}rc.yml`,
      `.${MODULE_NAME}rc.js`,
      `.${MODULE_NAME}rc.cjs`,
      `${MODULE_NAME}.config.js`,
      `${MODULE_NAME}.config.cjs`,
      `${MODULE_NAME}.config.ts`,
    ],
  })

  try {
    const result = await explorer.search(searchFrom)

    if (!result || !result.config) {
      logger.warn('未找到配置文件，使用默认配置')
      return defaultConfig as TranslatorConfig
    }

    logger.debug(`配置文件已加载: ${result.filepath}`)

    // 合并配置
    const config = mergeConfig(defaultConfig, result.config)

    // 验证配置
    validateConfig(config)

    return config as TranslatorConfig
  } catch (error) {
    logger.error('加载配置文件失败', error)
    throw error
  }
}

/**
 * 合并配置
 */
function mergeConfig(
  defaults: Partial<TranslatorConfig>,
  custom: Partial<TranslatorConfig>
): Partial<TranslatorConfig> {
  return {
    ...defaults,
    ...custom,
    api: {
      ...defaults.api,
      ...custom.api,
    },
    extract: {
      ...defaults.extract,
      ...custom.extract,
    },
    output: {
      ...defaults.output,
      ...custom.output,
    },
    memory: {
      ...defaults.memory,
      ...custom.memory,
    },
  }
}

/**
 * 验证配置
 */
function validateConfig(config: Partial<TranslatorConfig>): void {
  const errors: string[] = []

  if (!config.sourceLanguage) {
    errors.push('sourceLanguage 是必需的')
  }

  if (!config.targetLanguages || config.targetLanguages.length === 0) {
    errors.push('targetLanguages 至少需要一个目标语言')
  }

  if (!config.api?.provider) {
    errors.push('api.provider 是必需的')
  }

  if (!['google', 'baidu', 'deepl'].includes(config.api?.provider || '')) {
    errors.push('api.provider 必须是 google、baidu 或 deepl')
  }

  if (config.api?.provider === 'baidu' && !config.api?.baidu?.appid) {
    errors.push('使用百度翻译时，api.baidu.appid 是必需的')
  }

  if (config.api?.provider === 'baidu' && !config.api?.baidu?.secret) {
    errors.push('使用百度翻译时，api.baidu.secret 是必需的')
  }

  if (!config.extract?.include || config.extract.include.length === 0) {
    errors.push('extract.include 至少需要一个文件模式')
  }

  if (!config.output?.dir) {
    errors.push('output.dir 是必需的')
  }

  if (!['json', 'yaml', 'js', 'ts'].includes(config.output?.format || '')) {
    errors.push('output.format 必须是 json、yaml、js 或 ts')
  }

  if (errors.length > 0) {
    throw new Error(`配置验证失败:\n${errors.join('\n')}`)
  }
}

/**
 * 创建配置对象
 */
export function createConfig(
  options: Partial<TranslatorConfig>
): TranslatorConfig {
  const config = mergeConfig(defaultConfig, options)
  validateConfig(config)
  return config as TranslatorConfig
}


