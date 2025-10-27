# 使用指南

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

这将创建一个 `translator.config.js` 配置文件，并引导你完成配置：

- 选择源语言（默认: zh-CN）
- 选择目标语言（默认: en）
- 选择翻译服务提供商（Google/百度/DeepL）
- 设置输出目录和格式

### 2. 配置 API 密钥

编辑 `translator.config.js`，设置你的 API 密钥：

```javascript
module.exports = {
  api: {
    provider: 'google',
    key: process.env.TRANSLATE_API_KEY, // 建议使用环境变量
    // 或直接设置
    // key: 'YOUR_API_KEY',
  },
}
```

**获取 API 密钥：**

- **Google Translate**: [Google Cloud Console](https://console.cloud.google.com/)
- **百度翻译**: [百度翻译开放平台](https://fanyi-api.baidu.com/)
- **DeepL**: [DeepL API](https://www.deepl.com/pro-api)

### 3. 提取文本

```bash
npx ldesign-translator extract
```

这将扫描你的项目文件，提取所有中文文本，并生成源语言文件。

**指定目录：**

```bash
npx ldesign-translator extract src/components/
```

### 4. 翻译文本

```bash
# 翻译到单个语言
npx ldesign-translator translate --to en

# 翻译到多个语言
npx ldesign-translator translate --to en,ja,ko
```

**强制重新翻译：**

```bash
npx ldesign-translator translate --to en --force
```

### 5. 导入导出

**导出到 Excel：**

```bash
npx ldesign-translator export -o translations.xlsx
```

**从 Excel 导入：**

```bash
npx ldesign-translator import -f translations.xlsx
```

### 6. 启动 Web UI

```bash
npx ldesign-translator serve
```

然后访问 `http://localhost:3000` 使用 Web 界面管理翻译。

## 📖 CLI 命令详解

### init

初始化翻译配置文件。

```bash
npx ldesign-translator init [options]

选项:
  -s, --source-language <lang>   源语言 (默认: zh-CN)
  -t, --target-languages <langs> 目标语言，逗号分隔 (默认: en)
  -p, --provider <provider>      翻译服务提供商 (默认: google)
  -f, --force                    强制覆盖已存在的配置
  --skip-prompts                 跳过交互式提示
```

### extract

提取代码中的中文文本。

```bash
npx ldesign-translator extract [paths...] [options]

参数:
  paths                   要扫描的路径（可选）

选项:
  -v, --verbose          显示详细信息
  -o, --overwrite        覆盖已有的键
```

### translate

翻译提取的文本。

```bash
npx ldesign-translator translate [options]

选项:
  --to <languages>       目标语言，逗号分隔（必需）
  -f, --force           强制重新翻译所有文本
  -v, --verbose         显示详细信息
  --no-use-memory       不使用翻译记忆
```

### export

导出翻译到 Excel 文件。

```bash
npx ldesign-translator export [options]

选项:
  -o, --output <file>         Excel 输出文件路径（必需）
  -l, --languages <langs>     要导出的语言，逗号分隔
  --include-metadata          包含元数据（文件路径等）
```

### import

从 Excel 文件导入翻译。

```bash
npx ldesign-translator import [options]

选项:
  -f, --file <file>      Excel 文件路径（必需）
  --overwrite            覆盖已有翻译
  --no-validate          跳过验证
```

### serve

启动 Web UI 服务器。

```bash
npx ldesign-translator serve [options]

选项:
  -p, --port <port>      服务器端口 (默认: 3000)
```

## ⚙️ 配置文件

`translator.config.js` 完整配置示例：

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
    exclude: ['node_modules', 'dist', 'build'],
    patterns: [/[\u4e00-\u9fa5]+/g], // 中文匹配正则
    includeComments: false,          // 是否提取注释
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
    similarityThreshold: 0.7, // 相似度阈值
  },
  
  // 增量翻译
  incremental: true,
}
```

## 💡 最佳实践

### 1. 使用环境变量存储 API 密钥

创建 `.env` 文件：

```env
TRANSLATE_API_KEY=your_api_key_here
BAIDU_APPID=your_appid_here
BAIDU_SECRET=your_secret_here
```

### 2. 使用翻译记忆

启用翻译记忆可以：
- 复用已有翻译
- 保持翻译一致性
- 减少 API 调用

### 3. 增量翻译

默认启用增量翻译，只翻译新增和修改的文本，节省成本。

### 4. Excel 协作

导出到 Excel 后，可以：
- 发送给翻译人员审核
- 批量编辑翻译
- 再导入回系统

### 5. Web UI 管理

使用 Web UI 可以：
- 可视化管理翻译
- 实时编辑
- 查看统计信息
- 批量操作

## 🔧 集成到项目

### 与 vue-i18n 集成

```javascript
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'

const i18n = createI18n({
  locale: 'en',
  messages: {
    en,
    ja,
    ko,
  },
})

export default i18n
```

### 与 react-i18next 集成

```javascript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ja: { translation: ja },
    ko: { translation: ko },
  },
  lng: 'en',
  fallbackLng: 'en',
})

export default i18n
```

## 📝 工作流示例

### 日常开发流程

```bash
# 1. 开发新功能，添加中文文本
# 2. 提取新增文本
npx ldesign-translator extract

# 3. 翻译新增文本
npx ldesign-translator translate --to en,ja,ko

# 4. 提交翻译文件
git add src/locales/
git commit -m "feat: 添加新功能的翻译"
```

### 翻译审核流程

```bash
# 1. 导出到 Excel
npx ldesign-translator export -o review.xlsx

# 2. 发送给翻译人员审核
# 3. 收到审核后的 Excel

# 4. 导入翻译
npx ldesign-translator import -f review.xlsx --overwrite

# 5. 提交更新
git add src/locales/
git commit -m "chore: 更新翻译审核结果"
```

## 🐛 故障排查

### API 密钥错误

确保你的 API 密钥正确且有效：

```bash
# 测试 API 密钥
export TRANSLATE_API_KEY=your_key
npx ldesign-translator translate --to en -v
```

### 提取不到文本

检查配置文件的 `extract.include` 和 `extract.patterns`。

### 翻译失败

- 检查网络连接
- 确认 API 配额
- 查看详细日志：使用 `-v` 选项

## 📚 更多资源

- [API 文档](./API_REFERENCE.md)
- [贡献指南](./CONTRIBUTING.md)
- [更新日志](./CHANGELOG.md)


