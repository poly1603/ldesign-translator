/**
 * 翻译工具的配置接口
 */
export interface TranslatorConfig {
  /** 源语言 */
  sourceLanguage: string
  /** 目标语言列表 */
  targetLanguages: string[]
  /** 翻译 API 配置 */
  api: ApiConfig
  /** 扫描配置 */
  extract: ExtractConfig
  /** 输出配置 */
  output: OutputConfig
  /** 翻译记忆配置 */
  memory?: MemoryConfig
  /** 是否启用增量翻译 */
  incremental?: boolean
}

/**
 * API 配置
 */
export interface ApiConfig {
  /** 翻译服务提供商 */
  provider: 'google' | 'baidu' | 'deepl'
  /** API 密钥 */
  key: string
  /** 百度翻译配置 */
  baidu?: {
    appid: string
    secret: string
  }
  /** 速率限制（每秒请求数）*/
  rateLimit?: number
  /** 批量大小 */
  batchSize?: number
  /** 重试次数 */
  retries?: number
}

/**
 * 提取配置
 */
export interface ExtractConfig {
  /** 包含的文件模式 */
  include: string[]
  /** 排除的文件模式 */
  exclude?: string[]
  /** 中文匹配正则 */
  patterns?: RegExp[]
  /** 是否提取注释 */
  includeComments?: boolean
  /** 自定义提取函数 */
  customExtractors?: ExtractorFunction[]
}

/**
 * 输出配置
 */
export interface OutputConfig {
  /** 输出目录 */
  dir: string
  /** 输出格式 */
  format: 'json' | 'yaml' | 'js' | 'ts'
  /** 是否压缩 */
  minify?: boolean
  /** 是否按命名空间分割 */
  splitByNamespace?: boolean
}

/**
 * 翻译记忆配置
 */
export interface MemoryConfig {
  /** 是否启用翻译记忆 */
  enabled: boolean
  /** 数据库路径 */
  dbPath?: string
  /** 相似度阈值（0-1） */
  similarityThreshold?: number
}

/**
 * 提取器函数
 */
export type ExtractorFunction = (
  filePath: string,
  content: string
) => Promise<ExtractedText[]>

/**
 * 提取的文本
 */
export interface ExtractedText {
  /** 文本键 */
  key: string
  /** 原文 */
  text: string
  /** 文件路径 */
  file: string
  /** 行号 */
  line?: number
  /** 列号 */
  column?: number
  /** 上下文 */
  context?: string
  /** 命名空间 */
  namespace?: string
}

/**
 * 翻译提供商接口
 */
export interface TranslationProvider {
  /** 提供商名称 */
  name: string
  /** 翻译文本 */
  translate(
    texts: string[],
    from: string,
    to: string
  ): Promise<TranslationResult[]>
  /** 检测语言 */
  detectLanguage?(text: string): Promise<string>
  /** 支持的语言列表 */
  getSupportedLanguages?(): Promise<string[]>
}

/**
 * 翻译结果
 */
export interface TranslationResult {
  /** 原文 */
  original: string
  /** 译文 */
  translated: string
  /** 来源（api/memory/manual） */
  source: 'api' | 'memory' | 'manual'
  /** 置信度（0-1） */
  confidence?: number
  /** 错误信息 */
  error?: string
}

/**
 * 翻译条目
 */
export interface TranslationEntry {
  /** 键 */
  key: string
  /** 原文 */
  source: string
  /** 翻译映射 */
  translations: Record<string, string>
  /** 元数据 */
  metadata?: {
    file?: string
    line?: number
    context?: string
    lastModified?: string
    translatedBy?: string
  }
}

/**
 * 翻译记忆条目
 */
export interface MemoryEntry {
  /** ID */
  id?: number
  /** 原文 */
  source: string
  /** 目标语言 */
  targetLang: string
  /** 译文 */
  translation: string
  /** 创建时间 */
  createdAt: string
  /** 使用次数 */
  usageCount: number
  /** 来源 */
  source_type: 'api' | 'manual' | 'imported'
}

/**
 * Excel 数据行
 */
export interface ExcelRow {
  /** 键 */
  key: string
  /** 原文 */
  source: string
  /** 各语言翻译 */
  [lang: string]: string
}

/**
 * 提取选项
 */
export interface ExtractOptions {
  /** 目标路径 */
  paths?: string[]
  /** 是否显示详细信息 */
  verbose?: boolean
  /** 是否覆盖已有的键 */
  overwrite?: boolean
}

/**
 * 翻译选项
 */
export interface TranslateOptions {
  /** 目标语言 */
  to: string | string[]
  /** 是否强制重新翻译 */
  force?: boolean
  /** 是否显示详细信息 */
  verbose?: boolean
  /** 是否使用翻译记忆 */
  useMemory?: boolean
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 输出文件路径 */
  output: string
  /** 语言列表 */
  languages?: string[]
  /** 是否包含元数据 */
  includeMetadata?: boolean
}

/**
 * 导入选项
 */
export interface ImportOptions {
  /** Excel 文件路径 */
  file: string
  /** 是否覆盖已有翻译 */
  overwrite?: boolean
  /** 是否验证 */
  validate?: boolean
}

/**
 * 初始化选项
 */
export interface InitOptions {
  /** 源语言 */
  sourceLanguage?: string
  /** 目标语言 */
  targetLanguages?: string[]
  /** 翻译提供商 */
  provider?: 'google' | 'baidu' | 'deepl'
  /** 是否覆盖已有配置 */
  force?: boolean
  /** 是否跳过交互 */
  skipPrompts?: boolean
}

/**
 * 统计信息
 */
export interface Statistics {
  /** 总文本数 */
  totalTexts: number
  /** 已翻译数 */
  translated: number
  /** 未翻译数 */
  untranslated: number
  /** 按语言统计 */
  byLanguage: Record<
    string,
    {
      translated: number
      untranslated: number
      percentage: number
    }
  >
}

/**
 * CLI 上下文
 */
export interface CLIContext {
  /** 当前工作目录 */
  cwd: string
  /** 配置 */
  config?: TranslatorConfig
  /** 是否为调试模式 */
  debug?: boolean
}


