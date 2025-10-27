import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { loadConfig } from '../core/config-loader.js'
import { Translator } from '../core/translator.js'
import { TextExtractor } from '../core/extractor.js'
import { ExcelHandler } from '../core/excel-handler.js'
import { logger } from '../utils/logger.js'
import type { TranslatorConfig } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 创建 Express 应用
 */
export function createApp(config: TranslatorConfig) {
  const app = express()

  // 中间件
  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // API 路由
  app.get('/api/config', (req, res) => {
    res.json({
      sourceLanguage: config.sourceLanguage,
      targetLanguages: config.targetLanguages,
      provider: config.api.provider,
    })
  })

  app.get('/api/translations', async (req, res) => {
    try {
      // 实现获取翻译列表
      res.json({ translations: [] })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  app.post('/api/translate', async (req, res) => {
    try {
      const { texts, targetLang } = req.body

      const translator = new Translator(config)
      const results = await translator.translateTexts(texts, targetLang)

      res.json({ results })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  app.put('/api/translations/:key', async (req, res) => {
    try {
      const { key } = req.params
      const { lang, value } = req.body

      // 实现更新翻译
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  app.post('/api/export', async (req, res) => {
    try {
      const { languages } = req.body

      // 实现导出
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  app.post('/api/import', async (req, res) => {
    try {
      const { file } = req.body

      // 实现导入
      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  // 静态文件服务（Web UI）
  const webDistPath = path.join(__dirname, '../web/dist')
  app.use(express.static(webDistPath))

  // SPA 回退
  app.get('*', (req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'))
  })

  return app
}

/**
 * 启动服务器
 */
export async function startServer(port = 3000) {
  try {
    // 加载配置
    const config = await loadConfig()

    // 创建应用
    const app = createApp(config)

    // 创建 HTTP 服务器
    const server = createServer(app)

    // 创建 WebSocket 服务器
    const wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
      logger.info('WebSocket 客户端已连接')

      ws.on('message', (message) => {
        logger.debug(`收到消息: ${message}`)
      })

      ws.on('close', () => {
        logger.info('WebSocket 客户端已断开')
      })
    })

    // 启动服务器
    server.listen(port, () => {
      logger.success(`服务器已启动: http://localhost:${port}`)
    })
  } catch (error) {
    logger.error('服务器启动失败', error)
    process.exit(1)
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '3000', 10)
  startServer(port)
}


