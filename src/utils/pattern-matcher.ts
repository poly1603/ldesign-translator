/**
 * 中文字符正则
 */
export const CHINESE_REGEX = /[\u4e00-\u9fa5]+/g

/**
 * 完整中文文本正则（包含标点符号）
 */
export const CHINESE_TEXT_REGEX = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]+/g

/**
 * 检查是否包含中文
 */
export function hasChinese(text: string): boolean {
  return CHINESE_REGEX.test(text)
}

/**
 * 提取文本中的所有中文
 */
export function extractChinese(text: string): string[] {
  const matches = text.match(CHINESE_TEXT_REGEX)
  return matches ? Array.from(new Set(matches)) : []
}

/**
 * 提取字符串字面量中的中文
 */
export function extractChineseFromString(text: string): string | null {
  if (!hasChinese(text)) {
    return null
  }
  return text.trim()
}

/**
 * 生成唯一键
 */
export function generateKey(text: string, namespace?: string): string {
  // 移除空格和特殊字符
  const cleanText = text.replace(/[\s\n\r\t]+/g, '_').replace(/[^\u4e00-\u9fa5a-zA-Z0-9_]/g, '')

  // 如果文本太长，截取前20个字符
  const shortText = cleanText.length > 20 ? cleanText.substring(0, 20) : cleanText

  // 添加命名空间前缀
  const prefix = namespace ? `${namespace}.` : ''

  return `${prefix}${shortText}`
}

/**
 * 生成基于哈希的键
 */
export function generateHashKey(text: string, namespace?: string): string {
  const crypto = require('crypto')
  const hash = crypto.createHash('md5').update(text).digest('hex').substring(0, 8)
  const prefix = namespace ? `${namespace}.` : ''
  return `${prefix}${hash}`
}

/**
 * 计算两个字符串的相似度（Levenshtein 距离）
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return len2 === 0 ? 1 : 0
  if (len2 === 0) return 0

  const matrix: number[][] = []

  // 初始化矩阵
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  // 计算编辑距离
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 删除
        matrix[i][j - 1] + 1, // 插入
        matrix[i - 1][j - 1] + cost // 替换
      )
    }
  }

  const distance = matrix[len1][len2]
  const maxLen = Math.max(len1, len2)

  // 返回相似度（0-1）
  return 1 - distance / maxLen
}

/**
 * 查找最相似的字符串
 */
export function findMostSimilar(
  target: string,
  candidates: string[],
  threshold = 0.7
): { text: string; similarity: number } | null {
  let bestMatch: { text: string; similarity: number } | null = null
  let maxSimilarity = threshold

  for (const candidate of candidates) {
    const similarity = calculateSimilarity(target, candidate)
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity
      bestMatch = { text: candidate, similarity }
    }
  }

  return bestMatch
}

/**
 * 验证语言代码
 */
export function isValidLanguageCode(code: string): boolean {
  // ISO 639-1 语言代码 + 常见变体
  const validCodes = [
    'en', 'zh', 'zh-CN', 'zh-TW', 'ja', 'ko', 'fr', 'de', 'es', 'it',
    'pt', 'ru', 'ar', 'hi', 'th', 'vi', 'id', 'ms', 'tr', 'pl',
    'nl', 'sv', 'da', 'no', 'fi', 'cs', 'hu', 'ro', 'bg', 'uk',
    'el', 'he', 'fa', 'ur', 'bn', 'ta', 'te', 'mr', 'gu', 'kn',
  ]
  return validCodes.includes(code)
}

/**
 * 规范化语言代码
 */
export function normalizeLanguageCode(code: string): string {
  const normalized = code.toLowerCase().trim()

  // 处理常见变体
  const mapping: Record<string, string> = {
    'zh-cn': 'zh-CN',
    'zh-tw': 'zh-TW',
    'zh-hans': 'zh-CN',
    'zh-hant': 'zh-TW',
    'chinese': 'zh-CN',
    'english': 'en',
    'japanese': 'ja',
    'korean': 'ko',
  }

  return mapping[normalized] || normalized
}

/**
 * 清理文本（移除多余空格和换行）
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // 多个空格替换为单个
    .replace(/\n+/g, ' ') // 换行替换为空格
    .trim()
}

/**
 * 转义正则表达式特殊字符
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')
}

/**
 * 占位符正则表达式
 */
export const PLACEHOLDER_PATTERNS = {
  // {name}, {0}, {count}
  curly: /\{([^}]+)\}/g,
  // %s, %d, %1$s
  percent: /%(?:(\d+)\$)?[sdf]/g,
  // $name, ${name}
  dollar: /\$\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?/g,
  // {{name}}, [[name]]
  angular: /\{\{([^}]+)\}\}|\[\[([^\]]+)\]\]/g,
  // :name
  colon: /:([a-zA-Z_][a-zA-Z0-9_]*)/g,
}

/**
 * 提取文本中的占位符
 */
export function extractPlaceholders(text: string): {
  type: string
  placeholders: string[]
} {
  const found: Set<string> = new Set()
  let detectedType = 'none'

  // 检测花括号形式
  const curlyMatches = text.match(PLACEHOLDER_PATTERNS.curly)
  if (curlyMatches) {
    curlyMatches.forEach((m) => found.add(m))
    detectedType = 'curly'
  }

  // 检测百分号形式
  const percentMatches = text.match(PLACEHOLDER_PATTERNS.percent)
  if (percentMatches) {
    percentMatches.forEach((m) => found.add(m))
    if (detectedType === 'none') detectedType = 'percent'
  }

  // 检测美元符形式
  const dollarMatches = text.match(PLACEHOLDER_PATTERNS.dollar)
  if (dollarMatches) {
    dollarMatches.forEach((m) => found.add(m))
    if (detectedType === 'none') detectedType = 'dollar'
  }

  // 检测 Angular 形式
  const angularMatches = text.match(PLACEHOLDER_PATTERNS.angular)
  if (angularMatches) {
    angularMatches.forEach((m) => found.add(m))
    if (detectedType === 'none') detectedType = 'angular'
  }

  // 检测冒号形式
  const colonMatches = text.match(PLACEHOLDER_PATTERNS.colon)
  if (colonMatches) {
    colonMatches.forEach((m) => found.add(m))
    if (detectedType === 'none') detectedType = 'colon'
  }

  return {
    type: detectedType,
    placeholders: Array.from(found),
  }
}

/**
 * 验证翻译中的占位符是否完整
 */
export function validatePlaceholders(
  source: string,
  translation: string
): {
  valid: boolean
  missing: string[]
  extra: string[]
} {
  const sourcePlaceholders = extractPlaceholders(source)
  const translationPlaceholders = extractPlaceholders(translation)

  const sourceSet = new Set(sourcePlaceholders.placeholders)
  const translationSet = new Set(translationPlaceholders.placeholders)

  const missing = sourcePlaceholders.placeholders.filter(
    (p) => !translationSet.has(p)
  )
  const extra = translationPlaceholders.placeholders.filter(
    (p) => !sourceSet.has(p)
  )

  return {
    valid: missing.length === 0 && extra.length === 0,
    missing,
    extra,
  }
}

/**
 * 提取 HTML 标签
 */
export function extractHtmlTags(text: string): string[] {
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g
  const matches = text.match(tagRegex)
  return matches || []
}

/**
 * 验证 HTML 标签是否匹配
 */
export function validateHtmlTags(
  source: string,
  translation: string
): {
  valid: boolean
  missing: string[]
  extra: string[]
} {
  const sourceTags = extractHtmlTags(source)
  const translationTags = extractHtmlTags(translation)

  // 统计标签出现次数
  const countTags = (tags: string[]) => {
    const count: Record<string, number> = {}
    tags.forEach((tag) => {
      count[tag] = (count[tag] || 0) + 1
    })
    return count
  }

  const sourceCount = countTags(sourceTags)
  const translationCount = countTags(translationTags)

  const missing: string[] = []
  const extra: string[] = []

  // 检查缺失的标签
  Object.keys(sourceCount).forEach((tag) => {
    const srcCount = sourceCount[tag]
    const transCount = translationCount[tag] || 0
    if (transCount < srcCount) {
      for (let i = 0; i < srcCount - transCount; i++) {
        missing.push(tag)
      }
    }
  })

  // 棅查额外的标签
  Object.keys(translationCount).forEach((tag) => {
    const transCount = translationCount[tag]
    const srcCount = sourceCount[tag] || 0
    if (transCount > srcCount) {
      for (let i = 0; i < transCount - srcCount; i++) {
        extra.push(tag)
      }
    }
  })

  return {
    valid: missing.length === 0 && extra.length === 0,
    missing,
    extra,
  }
}

/**
 * 保护占位符（在翻译前替换为特殊标记）
 */
export function protectPlaceholders(text: string): {
  protected: string
  placeholders: Map<string, string>
} {
  const placeholders = new Map<string, string>()
  let protected_text = text
  let index = 0

  const { placeholders: foundPlaceholders } = extractPlaceholders(text)

  foundPlaceholders.forEach((placeholder) => {
    const marker = `__PLACEHOLDER_${index}__`
    placeholders.set(marker, placeholder)
    protected_text = protected_text.replace(placeholder, marker)
    index++
  })

  return { protected: protected_text, placeholders }
}

/**
 * 恢复占位符（翻译后恢复原始占位符）
 */
export function restorePlaceholders(
  text: string,
  placeholders: Map<string, string>
): string {
  let restored = text
  placeholders.forEach((original, marker) => {
    restored = restored.replace(new RegExp(escapeRegExp(marker), 'g'), original)
  })
  return restored
}

