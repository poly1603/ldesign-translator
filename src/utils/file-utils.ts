import fs from 'fs-extra'
import path from 'path'
import fg from 'fast-glob'
import ignore from 'ignore'

/**
 * 确保目录存在
 */
export async function ensureDir(dir: string): Promise<void> {
  await fs.ensureDir(dir)
}

/**
 * 读取文件内容
 */
export async function readFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8')
}

/**
 * 写入文件内容
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, content, 'utf-8')
}

/**
 * 检查文件是否存在
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * 读取 JSON 文件
 */
export async function readJSON<T = any>(filePath: string): Promise<T> {
  const content = await readFile(filePath)
  return JSON.parse(content)
}

/**
 * 写入 JSON 文件
 */
export async function writeJSON(
  filePath: string,
  data: any,
  minify = false
): Promise<void> {
  const content = minify
    ? JSON.stringify(data)
    : JSON.stringify(data, null, 2)
  await writeFile(filePath, content)
}

/**
 * 根据模式查找文件
 */
export async function findFiles(
  patterns: string[],
  options?: {
    cwd?: string
    ignore?: string[]
    absolute?: boolean
  }
): Promise<string[]> {
  const { cwd = process.cwd(), ignore: ignorePatterns = [], absolute = true } = options || {}

  // 读取 .gitignore
  const gitignorePath = path.join(cwd, '.gitignore')
  let ig = ignore()

  if (await fileExists(gitignorePath)) {
    const gitignoreContent = await readFile(gitignorePath)
    ig = ignore().add(gitignoreContent)
  }

  // 添加自定义忽略模式
  if (ignorePatterns.length > 0) {
    ig.add(ignorePatterns)
  }

  // 查找文件
  const files = await fg(patterns, {
    cwd,
    absolute,
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      ...ignorePatterns,
    ],
  })

  // 应用 gitignore 过滤
  return files.filter((file) => {
    const relativePath = path.relative(cwd, file)
    return !ig.ignores(relativePath)
  })
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase()
}

/**
 * 判断是否为支持的文件类型
 */
export function isSupportedFile(filePath: string): boolean {
  const ext = getFileExtension(filePath)
  const supportedExts = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.json']
  return supportedExts.includes(ext)
}

/**
 * 复制文件
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  await ensureDir(path.dirname(dest))
  await fs.copy(src, dest)
}

/**
 * 删除文件或目录
 */
export async function remove(target: string): Promise<void> {
  await fs.remove(target)
}

/**
 * 获取文件统计信息
 */
export async function getFileStats(filePath: string): Promise<fs.Stats> {
  return await fs.stat(filePath)
}

/**
 * 读取目录内容
 */
export async function readDir(dirPath: string): Promise<string[]> {
  return await fs.readdir(dirPath)
}

/**
 * 规范化路径
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/')
}

/**
 * 解析相对路径
 */
export function resolvePath(...paths: string[]): string {
  return path.resolve(...paths)
}

/**
 * 获取相对路径
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to)
}


