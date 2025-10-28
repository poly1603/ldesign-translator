---
layout: home

hero:
  name: LDesign Translator
  text: 智能的国际化翻译管理工具
  tagline: 让多语言支持变得简单、高效、专业
  image:
    src: /logo.svg
    alt: LDesign Translator
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看 GitHub
      link: https://github.com/ldesign/translator

features:
  - icon: 🔍
    title: 智能文本提取
    details: 自动扫描代码中的中文文本，支持 JS/TS/JSX/TSX/Vue 文件，使用 AST 语法解析精准提取

  - icon: 🔧
    title: 代码自动替换
    details: 自动将硬编码文本替换为 i18n 调用，支持预览模式和自动备份，安全可靠

  - icon: ✅
    title: 翻译质量检查
    details: 占位符完整性检查、HTML 标签验证、长度限制检查，确保翻译质量和一致性

  - icon: 📚
    title: 术语库管理
    details: 统一管理专业术语翻译，品牌名称保护，确保术语使用的一致性

  - icon: 🌐
    title: 多平台翻译
    details: 支持 Google Translate、百度翻译、DeepL，批量翻译、翻译审核、版本控制

  - icon: 💾
    title: 翻译记忆
    details: 自动复用已有翻译，SQLite 数据库存储，相似度智能匹配，节省 API 成本

  - icon: 📊
    title: Excel 导入导出
    details: 方便非技术人员参与翻译，一键导出到 Excel，批量编辑和审核，导入自动合并

  - icon: 👁️
    title: Web UI 管理
    details: 可视化翻译管理，批量操作，统计仪表板，实时预览翻译结果

  - icon: 🎯
    title: 占位符处理
    details: 支持多种占位符格式，自动识别和保护变量，翻译前后保持完整性

  - icon: ⚡
    title: 性能优化
    details: 批量 API 调用、速率限制、错误重试、并发控制，高效稳定
---

## 快速开始

### 安装

::: code-group

```bash [npm]
npm install @ldesign/translator --save-dev
```

```bash [yarn]
yarn add -D @ldesign/translator
```

```bash [pnpm]
pnpm add -D @ldesign/translator
```

:::

### 基本使用

```bash
# 1. 初始化配置
npx ldesign-translator init

# 2. 提取文本
npx ldesign-translator extract

# 3. 翻译文本
npx ldesign-translator translate --to en,ja,ko

# 4. 验证翻译质量
npx ldesign-translator validate

# 5. 替换代码
npx ldesign-translator replace
```

### 配置示例

```javascript
// translator.config.js
module.exports = {
  sourceLanguage: 'zh-CN',
  targetLanguages: ['en', 'ja', 'ko'],
  
  api: {
    provider: 'google',
    key: process.env.TRANSLATE_API_KEY,
    rateLimit: 10,
    batchSize: 50
  },
  
  extract: {
    include: ['src/**/*.{js,jsx,ts,tsx,vue}'],
    exclude: ['node_modules', 'dist']
  },
  
  output: {
    dir: 'src/locales',
    format: 'json'
  },
  
  memory: {
    enabled: true,
    dbPath: '.translator/memory.db'
  },
  
  glossary: {
    enabled: true,
    filePath: '.translator/glossary.json'
  },
  
  validation: {
    enabled: true,
    checkPlaceholders: true,
    checkHtmlTags: true
  }
}
```

## 核心特性

### 🔍 智能提取

自动扫描代码中的中文文本，精准提取，自动生成唯一键。

### 🔧 自动替换

一键将硬编码文本替换为 i18n 调用，支持预览和备份。

### ✅ 质量保证

多维度翻译质量检查，确保占位符、标签、长度的一致性。

### 📚 术语管理

统一管理专业术语，保证翻译的专业性和一致性。

## 为什么选择 LDesign Translator？

- **🚀 快速上手** - 简单的 CLI 命令，5 分钟完成国际化
- **🛡️ 安全可靠** - 自动备份、预览模式、质量验证
- **💪 功能强大** - 从提取到替换的完整工作流
- **🎨 灵活定制** - 丰富的配置选项，适应各种场景
- **📈 持续优化** - 翻译记忆、增量翻译，节省成本
- **👥 团队协作** - Excel 导入导出，Web UI 管理

## 社区

- [GitHub](https://github.com/ldesign/translator)
- [问题反馈](https://github.com/ldesign/translator/issues)
- [更新日志](/changelog)

## 许可证

[MIT License](https://github.com/ldesign/translator/blob/main/LICENSE)
