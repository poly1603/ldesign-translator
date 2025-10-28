# @ldesign/translator

> 🌐 智能的国际化翻译管理工具，让多语言支持变得简单

## ✨ 特性

- 🔍 **智能文本提取** - 自动扫描代码中的中文文本
  - 支持 JS/TS/JSX/TSX/Vue 文件
  - AST 语法解析，精准提取
  - 自动生成唯一键
- 🌐 **多平台翻译** - 批量翻译、翻译审核、版本控制
  - Google Translate - 质量好，覆盖广
  - 百度翻译 - 国内快，价格低
  - DeepL - 质量最高
- 📊 **Excel 导入导出** - 方便非技术人员参与翻译
  - 一键导出到 Excel
  - 批量编辑和审核
  - 导入自动合并
- 💾 **翻译记忆** - 自动复用已有翻译，保持一致性
  - SQLite 数据库存储
  - 相似度智能匹配
  - 使用统计分析
- 🔄 **增量翻译** - 只翻译新增和修改的文本
  - 智能对比已有翻译
  - 保留手动修改
  - 节省 API 成本
- 👁️ **Web UI 管理** - 翻译结果实时预览
  - 可视化翻译管理
  - 批量操作
  - 统计仪表板
  - 主题切换
- 🔧 **代码自动替换** - 自动将硬编码替换为 i18n 调用
  - 支持 JS/TS/JSX/TSX/Vue
  - 自动添加导入语句
  - 备份原文件
  - 预览模式
- ✅ **翻译质量检查** - 确保翻译质量和一致性
  - 占位符完整性检查
  - HTML 标签匹配验证
  - 长度限制检查
  - 详细错误报告
- 📚 **术语库管理** - 统一专业术语翻译
  - 术语一致性保证
  - 品牌名称保护
  - Excel 导入导出
  - 智能术语匹配
- 🎯 **智能占位符处理** - 自动识别和保护变量
  - 支持多种占位符格式
  - 翻译前保护占位符
  - 翻译后恢复占位符
  - 占位符完整性验证
- ⚡ **性能优化**
  - 批量 API 调用
  - 速率限制
  - 错误重试
  - 并发控制

## 📦 安装

```bash
npm install @ldesign/translator --save-dev
# 或
pnpm add -D @ldesign/translator
```

## 🚀 快速开始

### 1. 初始化配置

```bash
npx ldesign-translator init
```

交互式向导将引导你完成配置。

### 2. 提取文本

```bash
# 扫描并提取所有中文文本
npx ldesign-translator extract

# 指定目录
npx ldesign-translator extract src/components/
```

### 3. 翻译文本

```bash
# 翻译到英文
npx ldesign-translator translate --to en

# 翻译到多个语言
npx ldesign-translator translate --to en,ja,ko

# 强制重新翻译
npx ldesign-translator translate --to en --force
```

### 4. 导入导出

```bash
# 导出到 Excel
npx ldesign-translator export -o translations.xlsx

# 从 Excel 导入
npx ldesign-translator import -f translations.xlsx
```

### 5. 启动 Web UI

```bash
npx ldesign-translator serve
```

访问 `http://localhost:3000` 使用 Web 界面。

## ⚙️ 配置

创建 `translator.config.js`：

```javascript
module.exports = {
  // 源语言
  sourceLanguage: 'zh-CN',
  
  // 目标语言
  targetLanguages: ['en', 'ja', 'ko'],
  
  // 翻译 API 配置
  api: {
    provider: 'google', // 'google', 'baidu', 'deepl'
    key: process.env.TRANSLATE_API_KEY,
    
    // 百度翻译配置（当 provider 为 'baidu' 时）
    baidu: {
      appid: process.env.BAIDU_APPID,
      secret: process.env.BAIDU_SECRET,
    },
    
    rateLimit: 10,  // 每秒请求数
    batchSize: 50,  // 批量大小
    retries: 3,     // 重试次数
  },
  
  // 扫描配置
  extract: {
    include: ['src/**/*.{js,jsx,ts,tsx,vue}'],
    exclude: ['node_modules', 'dist'],
    patterns: [/[\u4e00-\u9fa5]+/g],
    includeComments: false,
  },
  
  // 输出配置
  output: {
    dir: 'src/locales',
    format: 'json', // 'json', 'yaml', 'js', 'ts'
    minify: false,
    splitByNamespace: false,
  },
  
  // 翻译记忆配置
  memory: {
    enabled: true,
    dbPath: '.translator/memory.db',
    similarityThreshold: 0.7,
  },
  
  // 增量翻译
  incremental: true,
  
  // 术语库配置
  glossary: {
    enabled: true,
    filePath: '.translator/glossary.json',
    entries: [
      {
        term: 'API',
        translations: {},
        doNotTranslate: true,
        caseSensitive: true,
      },
    ],
  },
  
  // 代码替换配置
  replace: {
    i18nFunction: 't',
    importPath: '@/i18n',
    addImports: true,
  },
  
  // 翻译验证配置
  validation: {
    enabled: true,
    checkPlaceholders: true,
    checkHtmlTags: true,
    checkLength: true,
    maxLength: 1000,
  },
}
```

## 📖 CLI 命令

### init
初始化翻译配置文件
```bash
npx ldesign-translator init [options]
```

### extract
提取代码中的中文文本
```bash
npx ldesign-translator extract [paths...] [options]
```

### translate
翻译提取的文本
```bash
npx ldesign-translator translate --to <languages> [options]
```

### export
导出翻译到 Excel 文件
```bash
npx ldesign-translator export -o <file> [options]
```

### import
从 Excel 文件导入翻译
```bash
npx ldesign-translator import -f <file> [options]
```

### serve
启动 Web UI 服务器
```bash
npx ldesign-translator serve [options]
```

### validate
验证翻译质量
```bash
npx ldesign-translator validate [options]
```

### replace
替换代码中的硬编码文本为 i18n 调用
```bash
npx ldesign-translator replace [paths...] [options]
```

详细使用说明请查看 [HOW_TO_USE.md](./HOW_TO_USE.md)。

## 🎯 使用场景

### 1. 新项目国际化
```bash
# 初始化
npx ldesign-translator init

# 提取文本
npx ldesign-translator extract

# 翻译
npx ldesign-translator translate --to en,ja,ko
```

### 2. 翻译审核协作
```bash
# 导出给翻译人员
npx ldesign-translator export -o review.xlsx

# 收到审核后导入
npx ldesign-translator import -f review.xlsx
```

### 3. 持续维护
```bash
# 增量提取新文本
npx ldesign-translator extract

# 只翻译新增的
npx ldesign-translator translate --to en
```

### 4. 代码自动替换
```bash
# 预览替换结果
npx ldesign-translator replace --dry-run

# 执行替换（自动备份）
npx ldesign-translator replace

# 指定 i18n 函数名
npx ldesign-translator replace -i useTranslation
```

### 5. 翻译质量验证
```bash
# 验证所有语言
npx ldesign-translator validate

# 验证特定语言
npx ldesign-translator validate -l en,ja

# 自定义检查项
npx ldesign-translator validate --no-check-length
```

## 🔧 与 i18n 框架集成

### Vue + vue-i18n

```javascript
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ja from './locales/ja.json'

const i18n = createI18n({
  locale: 'en',
  messages: { en, ja },
})
```

### React + react-i18next

```javascript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ja from './locales/ja.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ja: { translation: ja },
  },
  lng: 'en',
})
```

## 📊 翻译提供商对比

| 提供商 | 质量 | 速度 | 价格 | 语言支持 | 推荐场景 |
|--------|------|------|------|----------|----------|
| Google Translate | ⭐⭐⭐⭐ | 快 | 中等 | 100+ | 通用场景 |
| 百度翻译 | ⭐⭐⭐ | 很快 | 便宜 | 28 | 中文项目 |
| DeepL | ⭐⭐⭐⭐⭐ | 快 | 较贵 | 30+ | 高质量要求 |

## 📚 文档

- [使用指南](./HOW_TO_USE.md) - 详细使用说明
- [更新日志](./CHANGELOG.md) - 版本更新记录
- [实现报告](./IMPLEMENTATION_COMPLETE.md) - 完整功能说明

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 📄 许可证

MIT © LDesign Team

---

**特别感谢**：感谢所有翻译服务提供商的 API 支持。
