#!/usr/bin/env node

// 入口文件
import('../dist/cli/index.js').catch((err) => {
  console.error('Failed to load CLI:', err)
  process.exit(1)
})


