import type { TranslatorConfig } from '../../types/index.js'
import { logger } from '../../utils/logger.js'
import { spawn } from 'child_process'
import path from 'path'

/**
 * 启动 Web UI 服务器
 */
export async function serveCommand(
  config: TranslatorConfig,
  options: { port?: number }
): Promise<void> {
  try {
    const port = options.port || 3000

    logger.info('正在启动 Web UI 服务器...')
    logger.info(`端口: ${port}`)
    logger.newLine()

    // 启动服务器
    const serverPath = path.join(
      new URL('..', import.meta.url).pathname,
      '../../server/app.js'
    )

    const serverProcess = spawn('node', [serverPath], {
      env: {
        ...process.env,
        PORT: port.toString(),
        CONFIG_PATH: process.cwd(),
      },
      stdio: 'inherit',
    })

    serverProcess.on('error', (error) => {
      logger.error('服务器启动失败', error)
    })

    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        logger.error(`服务器异常退出，代码: ${code}`)
      }
    })

    // 监听 Ctrl+C
    process.on('SIGINT', () => {
      logger.info('\n正在关闭服务器...')
      serverProcess.kill('SIGINT')
      process.exit(0)
    })

    logger.success(`Web UI 已启动: http://localhost:${port}`)
    logger.info('\n按 Ctrl+C 停止服务器')
  } catch (error) {
    logger.error('启动服务器失败', error)
    throw error
  }
}


