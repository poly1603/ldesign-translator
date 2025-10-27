# @ldesign/translator

> 🌐 智能的国际化翻译管理工具，让多语言支持变得简单

## ✨ 特性

- 🔍 **文本提取** - 自动扫描代码中的中文文本
- 🌐 **翻译管理** - 批量翻译、翻译审核、版本控制
- 🔗 **多平台对接** - 支持百度/谷歌/DeepL 等翻译 API
- 📊 **Excel 导入导出** - 方便非技术人员参与翻译
- 👁️ **实时预览** - 翻译结果实时预览
- 🔄 **增量翻译** - 只翻译新增和修改的文本
- 📝 **翻译记忆** - 自动复用已有翻译，保持一致性

## 📦 安装

```bash
npm install @ldesign/translator --save-dev
```

## 🚀 快速开始

### 初始化

```bash
npx ldesign-translator init
```

### 提取文本

```bash
# 扫描并提取所有中文文本
npx ldesign-translator extract

# 指定目录
npx ldesign-translator extract src/
```

### 翻译文本

```bash
# 自动翻译到英文
npx ldesign-translator translate --to en

# 翻译到多个语言
npx ldesign-translator translate --to en,ja,ko
```

## ⚙️ 配置

创建 `translator.config.js`：

```javascript
module.exports = {
  // 源语言
  sourceLanguage: 'zh-CN',
  
  // 目标语言
  targetLanguages: ['en', 'ja', 'ko'],
  
  // 翻译API配置
  api: {
    provider: 'google', // 'google', 'baidu', 'deepl'
    key: process.env.TRANSLATE_API_KEY,
  },
  
  // 扫描配置
  extract: {
    include: ['src/**/*.{js,jsx,ts,tsx,vue}'],
    exclude: ['node_modules', 'dist'],
    // 正则匹配中文
    patterns: [/[\u4e00-\u9fa5]+/g],
  },
  
  // 输出配置
  output: {
    dir: 'src/locales',
    format: 'json', // 'json', 'yaml', 'js'
  },
};
```

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 📄 许可证

MIT © LDesign Team
@ldesign/translator - Translation management tool
