import { parse as babelParse } from '@babel/parser'
import traverse from '@babel/traverse'
import type { Node } from '@babel/types'
import { parse as vueParse, compileTemplate } from '@vue/compiler-sfc'
import type { ExtractedText, TranslatorConfig } from '../types/index.js'
import { logger } from '../utils/logger.js'
import { readFile, getFileExtension } from '../utils/file-utils.js'
import {
  hasChinese,
  extractChineseFromString,
  generateKey,
  generateHashKey,
} from '../utils/pattern-matcher.js'

/**
 * 文本提取器
 */
export class TextExtractor {
  private config: TranslatorConfig
  private extractedTexts: Map<string, ExtractedText> = new Map()

  constructor(config: TranslatorConfig) {
    this.config = config
  }

  /**
   * 提取文件中的文本
   */
  async extractFromFile(filePath: string): Promise<ExtractedText[]> {
    const ext = getFileExtension(filePath)
    const content = await readFile(filePath)

    logger.debug(`提取文件: ${filePath}`)

    switch (ext) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        return this.extractFromJavaScript(filePath, content, ext)
      case '.vue':
        return this.extractFromVue(filePath, content)
      case '.json':
        return this.extractFromJSON(filePath, content)
      default:
        logger.warn(`不支持的文件类型: ${ext}`)
        return []
    }
  }

  /**
   * 从 JavaScript/TypeScript 文件中提取
   */
  private extractFromJavaScript(
    filePath: string,
    content: string,
    ext: string
  ): ExtractedText[] {
    const results: ExtractedText[] = []

    try {
      const ast = babelParse(content, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'dynamicImport',
          'objectRestSpread',
        ],
      })

      traverse(ast, {
        // 字符串字面量
        StringLiteral: (path: any) => {
          const value = path.node.value
          const chinese = extractChineseFromString(value)

          if (chinese) {
            const loc = path.node.loc
            results.push({
              key: this.generateUniqueKey(chinese, filePath),
              text: chinese,
              file: filePath,
              line: loc?.start.line,
              column: loc?.start.column,
            })
          }
        },

        // 模板字符串
        TemplateLiteral: (path: any) => {
          for (const quasi of path.node.quasis) {
            const value = quasi.value.raw
            const chinese = extractChineseFromString(value)

            if (chinese) {
              const loc = quasi.loc
              results.push({
                key: this.generateUniqueKey(chinese, filePath),
                text: chinese,
                file: filePath,
                line: loc?.start.line,
                column: loc?.start.column,
              })
            }
          }
        },

        // JSX 文本
        JSXText: (path: any) => {
          const value = path.node.value.trim()
          if (hasChinese(value)) {
            const loc = path.node.loc
            results.push({
              key: this.generateUniqueKey(value, filePath),
              text: value,
              file: filePath,
              line: loc?.start.line,
              column: loc?.start.column,
            })
          }
        },

        // JSX 属性
        JSXAttribute: (path: any) => {
          if (path.node.value?.type === 'StringLiteral') {
            const value = path.node.value.value
            const chinese = extractChineseFromString(value)

            if (chinese) {
              const loc = path.node.loc
              results.push({
                key: this.generateUniqueKey(chinese, filePath),
                text: chinese,
                file: filePath,
                line: loc?.start.line,
                column: loc?.start.column,
              })
            }
          }
        },
      })
    } catch (error) {
      logger.error(`解析文件失败: ${filePath}`, error)
    }

    return results
  }

  /**
   * 从 Vue 文件中提取
   */
  private extractFromVue(filePath: string, content: string): ExtractedText[] {
    const results: ExtractedText[] = []

    try {
      const { descriptor } = vueParse(content, { filename: filePath })

      // 提取模板中的文本
      if (descriptor.template) {
        const templateResults = this.extractFromVueTemplate(
          filePath,
          descriptor.template.content,
          descriptor.template.loc.start.line
        )
        results.push(...templateResults)
      }

      // 提取 script 中的文本
      if (descriptor.script) {
        const scriptResults = this.extractFromJavaScript(
          filePath,
          descriptor.script.content,
          descriptor.script.lang === 'ts' ? '.ts' : '.js'
        )
        results.push(...scriptResults)
      }

      if (descriptor.scriptSetup) {
        const scriptResults = this.extractFromJavaScript(
          filePath,
          descriptor.scriptSetup.content,
          descriptor.scriptSetup.lang === 'ts' ? '.ts' : '.js'
        )
        results.push(...scriptResults)
      }
    } catch (error) {
      logger.error(`解析 Vue 文件失败: ${filePath}`, error)
    }

    return results
  }

  /**
   * 从 Vue 模板中提取
   */
  private extractFromVueTemplate(
    filePath: string,
    content: string,
    lineOffset: number
  ): ExtractedText[] {
    const results: ExtractedText[] = []

    try {
      // 简单的正则匹配（更复杂的可以使用 AST）
      const textRegex = />([^<]+)</g
      let match

      while ((match = textRegex.exec(content)) !== null) {
        const text = match[1].trim()
        if (hasChinese(text)) {
          // 计算行号
          const beforeText = content.substring(0, match.index)
          const line = lineOffset + (beforeText.match(/\n/g) || []).length

          results.push({
            key: this.generateUniqueKey(text, filePath),
            text,
            file: filePath,
            line,
          })
        }
      }

      // 提取属性中的文本
      const attrRegex = /="([^"]+)"|='([^']+)'/g
      while ((match = attrRegex.exec(content)) !== null) {
        const text = (match[1] || match[2]).trim()
        const chinese = extractChineseFromString(text)

        if (chinese) {
          const beforeText = content.substring(0, match.index)
          const line = lineOffset + (beforeText.match(/\n/g) || []).length

          results.push({
            key: this.generateUniqueKey(chinese, filePath),
            text: chinese,
            file: filePath,
            line,
          })
        }
      }
    } catch (error) {
      logger.error(`解析 Vue 模板失败: ${filePath}`, error)
    }

    return results
  }

  /**
   * 从 JSON 文件中提取
   */
  private extractFromJSON(filePath: string, content: string): ExtractedText[] {
    const results: ExtractedText[] = []

    try {
      const data = JSON.parse(content)
      this.traverseJSON(data, filePath, results)
    } catch (error) {
      logger.error(`解析 JSON 文件失败: ${filePath}`, error)
    }

    return results
  }

  /**
   * 遍历 JSON 对象
   */
  private traverseJSON(
    obj: any,
    filePath: string,
    results: ExtractedText[],
    path: string[] = []
  ): void {
    if (typeof obj === 'string') {
      const chinese = extractChineseFromString(obj)
      if (chinese) {
        results.push({
          key: this.generateUniqueKey(chinese, filePath),
          text: chinese,
          file: filePath,
          context: path.join('.'),
        })
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.traverseJSON(item, filePath, results, [...path, `[${index}]`])
      })
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach((key) => {
        this.traverseJSON(obj[key], filePath, results, [...path, key])
      })
    }
  }

  /**
   * 生成唯一键
   */
  private generateUniqueKey(text: string, filePath: string): string {
    // 从文件路径提取命名空间
    const namespace = this.extractNamespace(filePath)

    // 使用哈希生成键
    let key = generateHashKey(text, namespace)

    // 确保键的唯一性
    let counter = 1
    const originalKey = key
    while (this.extractedTexts.has(key)) {
      const existingText = this.extractedTexts.get(key)
      // 如果文本相同，使用相同的键
      if (existingText?.text === text) {
        break
      }
      // 否则添加后缀
      key = `${originalKey}_${counter}`
      counter++
    }

    return key
  }

  /**
   * 从文件路径提取命名空间
   */
  private extractNamespace(filePath: string): string | undefined {
    if (!this.config.output.splitByNamespace) {
      return undefined
    }

    // 从路径中提取模块名
    const parts = filePath.split(/[/\\]/)
    const srcIndex = parts.indexOf('src')

    if (srcIndex >= 0 && srcIndex < parts.length - 1) {
      return parts[srcIndex + 1]
    }

    return undefined
  }

  /**
   * 添加提取的文本
   */
  addExtractedText(text: ExtractedText): void {
    this.extractedTexts.set(text.key, text)
  }

  /**
   * 获取所有提取的文本
   */
  getAllTexts(): ExtractedText[] {
    return Array.from(this.extractedTexts.values())
  }

  /**
   * 清空提取的文本
   */
  clear(): void {
    this.extractedTexts.clear()
  }
}

/**
 * 提取文件中的文本（辅助函数）
 */
export async function extractTexts(
  filePaths: string[],
  config: TranslatorConfig
): Promise<ExtractedText[]> {
  const extractor = new TextExtractor(config)

  for (const filePath of filePaths) {
    try {
      const texts = await extractor.extractFromFile(filePath)
      texts.forEach((text) => extractor.addExtractedText(text))
    } catch (error) {
      logger.error(`提取文件失败: ${filePath}`, error)
    }
  }

  return extractor.getAllTexts()
}


