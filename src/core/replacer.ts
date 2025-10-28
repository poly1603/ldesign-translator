import { parse as babelParse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'
import { parse as vueParse } from '@vue/compiler-sfc'
import type { TranslatorConfig, ReplaceResult, ExtractedText } from '../types/index.js'
import { logger } from '../utils/logger.js'
import { readFile, writeFile, getFileExtension } from '../utils/file-utils.js'
import { hasChinese, extractChineseFromString } from '../utils/pattern-matcher.js'
import path from 'path'
import fs from 'fs-extra'

/**
 * 代码替换器
 */
export class CodeReplacer {
  private config: TranslatorConfig
  private i18nFunction: string
  private importPath: string
  private extractedKeys: Map<string, string> = new Map() // text -> key 映射

  constructor(
    config: TranslatorConfig,
    options?: {
      i18nFunction?: string
      importPath?: string
    }
  ) {
    this.config = config
    this.i18nFunction = options?.i18nFunction || this.config.replace?.i18nFunction || 't'
    this.importPath = options?.importPath || this.config.replace?.importPath || 'i18n'
  }

  /**
   * 加载已提取的键值映射
   */
  async loadExtractedKeys(texts: ExtractedText[]): void {
    this.extractedKeys.clear()
    texts.forEach((extracted) => {
      this.extractedKeys.set(extracted.text, extracted.key)
    })
    logger.debug(`加载了 ${this.extractedKeys.size} 个键值映射`)
  }

  /**
   * 替换文件中的中文
   */
  async replaceFile(
    filePath: string,
    options?: {
      backup?: boolean
      dryRun?: boolean
    }
  ): Promise<ReplaceResult> {
    const { backup = false, dryRun = false } = options || {}

    try {
      const ext = getFileExtension(filePath)
      const content = await readFile(filePath)

      let result: ReplaceResult

      switch (ext) {
        case '.js':
        case '.jsx':
        case '.ts':
        case '.tsx':
          result = await this.replaceJavaScript(filePath, content, dryRun)
          break
        case '.vue':
          result = await this.replaceVue(filePath, content, dryRun)
          break
        default:
          return {
            filePath,
            count: 0,
            success: false,
            error: `不支持的文件类型: ${ext}`,
          }
      }

      // 如果不是预览模式，写入文件
      if (!dryRun && result.success && result.count > 0) {
        // 备份原文件
        if (backup) {
          const backupPath = `${filePath}.backup`
          await fs.copy(filePath, backupPath)
          logger.debug(`备份文件: ${backupPath}`)
        }

        // 写入修改后的内容
        // 注意: result 中应该包含新的内容
        logger.success(`替换完成: ${filePath} (${result.count} 处)`)
      }

      return result
    } catch (error) {
      logger.error(`替换文件失败: ${filePath}`, error)
      return {
        filePath,
        count: 0,
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * 替换 JavaScript/TypeScript 文件
   */
  private async replaceJavaScript(
    filePath: string,
    content: string,
    dryRun: boolean
  ): Promise<ReplaceResult> {
    const replacements: Array<{
      line: number
      column: number
      original: string
      replaced: string
      key: string
    }> = []

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

      let needsImport = false
      let hasImport = false

      // 检查是否已经有导入
      traverse(ast, {
        ImportDeclaration(path) {
          const source = path.node.source.value
          if (source === this.importPath || source.includes('i18n')) {
            hasImport = true
          }
        },
      })

      // 替换字符串
      traverse(ast, {
        StringLiteral: (path) => {
          const value = path.node.value
          const chinese = extractChineseFromString(value)

          if (chinese && this.extractedKeys.has(chinese)) {
            const key = this.extractedKeys.get(chinese)!
            const loc = path.node.loc

            // 替换为 t('key') 调用
            const callExpression = t.callExpression(
              t.identifier(this.i18nFunction),
              [t.stringLiteral(key)]
            )

            path.replaceWith(callExpression)
            needsImport = true

            replacements.push({
              line: loc?.start.line || 0,
              column: loc?.start.column || 0,
              original: value,
              replaced: `${this.i18nFunction}('${key}')`,
              key,
            })
          }
        },

        // JSX 文本
        JSXText: (path) => {
          const value = path.node.value.trim()
          if (hasChinese(value) && this.extractedKeys.has(value)) {
            const key = this.extractedKeys.get(value)!
            const loc = path.node.loc

            // 替换为 {t('key')}
            const callExpression = t.callExpression(
              t.identifier(this.i18nFunction),
              [t.stringLiteral(key)]
            )

            path.replaceWith(
              t.jsxExpressionContainer(callExpression)
            )
            needsImport = true

            replacements.push({
              line: loc?.start.line || 0,
              column: loc?.start.column || 0,
              original: value,
              replaced: `{${this.i18nFunction}('${key}')}`,
              key,
            })
          }
        },

        // JSX 属性
        JSXAttribute: (path) => {
          if (path.node.value?.type === 'StringLiteral') {
            const value = path.node.value.value
            const chinese = extractChineseFromString(value)

            if (chinese && this.extractedKeys.has(chinese)) {
              const key = this.extractedKeys.get(chinese)!
              const loc = path.node.loc

              // 替换为 prop={t('key')}
              const callExpression = t.callExpression(
                t.identifier(this.i18nFunction),
                [t.stringLiteral(key)]
              )

              path.node.value = t.jsxExpressionContainer(callExpression)
              needsImport = true

              replacements.push({
                line: loc?.start.line || 0,
                column: loc?.start.column || 0,
                original: value,
                replaced: `{${this.i18nFunction}('${key}')}`,
                key,
              })
            }
          }
        },
      })

      // 添加导入语句（如果需要且不存在）
      if (needsImport && !hasImport && this.config.replace?.addImports !== false) {
        const importDeclaration = t.importDeclaration(
          [
            t.importSpecifier(
              t.identifier(this.i18nFunction),
              t.identifier(this.i18nFunction)
            ),
          ],
          t.stringLiteral(this.importPath)
        )

        ast.program.body.unshift(importDeclaration)
      }

      // 生成新代码
      if (!dryRun && replacements.length > 0) {
        const output = generate(ast, {
          retainLines: true,
          comments: true,
        })

        await writeFile(filePath, output.code)
      }

      return {
        filePath,
        count: replacements.length,
        success: true,
        replacements,
      }
    } catch (error) {
      logger.error(`解析 JavaScript 失败: ${filePath}`, error)
      return {
        filePath,
        count: 0,
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * 替换 Vue 文件
   */
  private async replaceVue(
    filePath: string,
    content: string,
    dryRun: boolean
  ): Promise<ReplaceResult> {
    const replacements: Array<{
      line: number
      column: number
      original: string
      replaced: string
      key: string
    }> = []

    try {
      const { descriptor } = vueParse(content, { filename: filePath })
      let modifiedContent = content

      // 替换模板中的文本
      if (descriptor.template) {
        const templateContent = descriptor.template.content
        let modifiedTemplate = templateContent

        // 简单替换模板中的文本（可以使用更复杂的 Vue 模板解析）
        this.extractedKeys.forEach((key, text) => {
          if (modifiedTemplate.includes(text)) {
            const regex = new RegExp(`>${escapeRegex(text)}<`, 'g')
            modifiedTemplate = modifiedTemplate.replace(
              regex,
              `>{{ ${this.i18nFunction}('${key}') }}<`
            )

            replacements.push({
              line: 0, // 需要更准确的行号计算
              column: 0,
              original: text,
              replaced: `{{ ${this.i18nFunction}('${key}') }}`,
              key,
            })
          }

          // 替换属性中的文本
          const attrRegex = new RegExp(`="${escapeRegex(text)}"`, 'g')
          if (attrRegex.test(modifiedTemplate)) {
            modifiedTemplate = modifiedTemplate.replace(
              attrRegex,
              `=":${this.i18nFunction}('${key}')"`
            )
          }
        })

        // 替换原始内容中的模板部分
        modifiedContent = modifiedContent.replace(
          templateContent,
          modifiedTemplate
        )
      }

      // 替换 script 中的文本
      if (descriptor.script || descriptor.scriptSetup) {
        const scriptDescriptor = descriptor.scriptSetup || descriptor.script!
        const scriptContent = scriptDescriptor.content
        const scriptLang = scriptDescriptor.lang || 'js'

        // 使用 JavaScript 替换逻辑
        const tempFilePath = `${filePath}.temp.${scriptLang}`
        await writeFile(tempFilePath, scriptContent)

        const scriptResult = await this.replaceJavaScript(
          tempFilePath,
          scriptContent,
          true // 总是预览模式
        )

        if (scriptResult.success && scriptResult.replacements) {
          replacements.push(...scriptResult.replacements)

          // 读取修改后的脚本内容
          const modifiedScript = await readFile(tempFilePath)

          // 替换原始内容中的脚本部分
          modifiedContent = modifiedContent.replace(
            scriptContent,
            modifiedScript
          )
        }

        // 清理临时文件
        await fs.remove(tempFilePath)
      }

      // 写入修改后的内容
      if (!dryRun && replacements.length > 0) {
        await writeFile(filePath, modifiedContent)
      }

      return {
        filePath,
        count: replacements.length,
        success: true,
        replacements,
      }
    } catch (error) {
      logger.error(`解析 Vue 文件失败: ${filePath}`, error)
      return {
        filePath,
        count: 0,
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * 批量替换文件
   */
  async replaceFiles(
    filePaths: string[],
    options?: {
      backup?: boolean
      dryRun?: boolean
    }
  ): Promise<ReplaceResult[]> {
    const results: ReplaceResult[] = []

    for (const filePath of filePaths) {
      const result = await this.replaceFile(filePath, options)
      results.push(result)

      if (result.success && result.count > 0) {
        logger.info(`✓ ${filePath}: ${result.count} 处替换`)
      } else if (!result.success) {
        logger.error(`✗ ${filePath}: ${result.error}`)
      }
    }

    return results
  }

  /**
   * 生成替换报告
   */
  generateReport(results: ReplaceResult[]): {
    total: number
    success: number
    failed: number
    totalReplacements: number
    files: string[]
  } {
    const report = {
      total: results.length,
      success: 0,
      failed: 0,
      totalReplacements: 0,
      files: [] as string[],
    }

    results.forEach((result) => {
      if (result.success) {
        report.success++
        if (result.count > 0) {
          report.files.push(result.filePath)
          report.totalReplacements += result.count
        }
      } else {
        report.failed++
      }
    })

    return report
  }

  /**
   * 打印替换报告
   */
  printReport(results: ReplaceResult[], dryRun: boolean = false): void {
    const report = this.generateReport(results)

    logger.info(`\n=== ${dryRun ? '预览' : '替换'}报告 ===\n`)
    logger.info(`处理文件: ${report.total}`)
    logger.success(`成功: ${report.success}`)
    if (report.failed > 0) {
      logger.error(`失败: ${report.failed}`)
    }
    logger.info(`总替换数: ${report.totalReplacements}`)

    if (report.files.length > 0) {
      logger.info('\n修改的文件:')
      report.files.forEach((file) => {
        logger.info(`  - ${file}`)
      })
    }

    if (dryRun) {
      logger.warn('\n⚠️  这是预览模式，未实际修改文件')
    }
  }
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 替换文件中的中文（辅助函数）
 */
export async function replaceInFiles(
  config: TranslatorConfig,
  filePaths: string[],
  extractedTexts: ExtractedText[],
  options?: {
    i18nFunction?: string
    importPath?: string
    backup?: boolean
    dryRun?: boolean
  }
): Promise<ReplaceResult[]> {
  const replacer = new CodeReplacer(config, {
    i18nFunction: options?.i18nFunction,
    importPath: options?.importPath,
  })

  await replacer.loadExtractedKeys(extractedTexts)

  return replacer.replaceFiles(filePaths, {
    backup: options?.backup,
    dryRun: options?.dryRun,
  })
}
