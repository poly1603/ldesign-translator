# 配置选项

完整的配置选项参考。

## 配置文件

在项目根目录创建 `translator.config.js` 或 `translator.config.ts`：

```javascript
module.exports = {
  sourceLanguage: 'zh-CN',
  targetLanguages: ['en', 'ja', 'ko'],
  api: { /* ... */ },
  extract: { /* ... */ },
  output: { /* ... */ },
  memory: { /* ... */ },
  glossary: { /* ... */ },
  replace: { /* ... */ },
  validation: { /* ... */ }
}
```

## 基础配置

### sourceLanguage

- **类型**: `string`
- **默认值**: `'zh-CN'`
- **说明**: 源语言代码

```javascript
sourceLanguage: 'zh-CN'
```

### targetLanguages

- **类型**: `string[]`
- **默认值**: `['en']`
- **说明**: 目标语言列表

```javascript
targetLanguages: ['en', 'ja', 'ko', 'fr', 'de']
```

支持的语言代码：`en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `fr`, `de`, `es`, `it`, `pt`, `ru` 等。

## API 配置

### api.provider

- **类型**: `'google' | 'baidu' | 'deepl' | 'openai' | 'anthropic'`
- **默认值**: `'google'`
- **说明**: 翻译服务提供商

```javascript
api: {
  provider: 'google'
}
```

### api.key

- **类型**: `string`
- **必需**: 是
- **说明**: API 密钥

```javascript
api: {
  key: process.env.TRANSLATE_API_KEY
}
```

### api.baidu

百度翻译专用配置：

- **类型**: `{ appid: string, secret: string }`
- **说明**: 百度翻译 App ID 和密钥

```javascript
api: {
  provider: 'baidu',
  baidu: {
    appid: process.env.BAIDU_APPID,
    secret: process.env.BAIDU_SECRET
  }
}
```

### api.rateLimit

- **类型**: `number`
- **默认值**: `10`
- **说明**: 每秒请求数限制

```javascript
api: {
  rateLimit: 10
}
```

### api.batchSize

- **类型**: `number`
- **默认值**: `50`
- **说明**: 批量翻译大小

```javascript
api: {
  batchSize: 50
}
```

### api.retries

- **类型**: `number`
- **默认值**: `3`
- **说明**: 失败重试次数

```javascript
api: {
  retries: 3
}
```

## 提取配置

### extract.include

- **类型**: `string[]`
- **必需**: 是
- **说明**: 要扫描的文件模式

```javascript
extract: {
  include: [
    'src/**/*.{js,jsx,ts,tsx,vue}',
    'pages/**/*.{js,jsx,ts,tsx}'
  ]
}
```

### extract.exclude

- **类型**: `string[]`
- **默认值**: `[]`
- **说明**: 要排除的文件模式

```javascript
extract: {
  exclude: [
    'node_modules',
    'dist',
    '**/*.test.js',
    '**/*.spec.js'
  ]
}
```

### extract.patterns

- **类型**: `RegExp[]`
- **默认值**: `[/[\u4e00-\u9fa5]+/g]`
- **说明**: 自定义文本匹配正则

```javascript
extract: {
  patterns: [
    /[\u4e00-\u9fa5]+/g,  // 中文
    /[\u0400-\u04FF]+/g   // 俄文
  ]
}
```

### extract.includeComments

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否提取注释中的文本

```javascript
extract: {
  includeComments: false
}
```

## 输出配置

### output.dir

- **类型**: `string`
- **默认值**: `'src/locales'`
- **说明**: 翻译文件输出目录

```javascript
output: {
  dir: 'src/locales'
}
```

### output.format

- **类型**: `'json' | 'yaml' | 'js' | 'ts'`
- **默认值**: `'json'`
- **说明**: 输出文件格式

```javascript
output: {
  format: 'json'
}
```

### output.minify

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否压缩输出文件

```javascript
output: {
  minify: true
}
```

### output.splitByNamespace

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否按命名空间分割文件

```javascript
output: {
  splitByNamespace: true
}
```

## 翻译记忆配置

### memory.enabled

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否启用翻译记忆

```javascript
memory: {
  enabled: true
}
```

### memory.dbPath

- **类型**: `string`
- **默认值**: `'.translator/memory.db'`
- **说明**: SQLite 数据库路径

```javascript
memory: {
  dbPath: '.translator/memory.db'
}
```

### memory.similarityThreshold

- **类型**: `number`
- **默认值**: `0.7`
- **说明**: 相似度阈值 (0-1)

```javascript
memory: {
  similarityThreshold: 0.7
}
```

## 术语库配置

### glossary.enabled

- **类型**: `boolean`
- **默认值**: `false`
- **说明**: 是否启用术语库

```javascript
glossary: {
  enabled: true
}
```

### glossary.filePath

- **类型**: `string`
- **默认值**: `'.translator/glossary.json'`
- **说明**: 术语库文件路径

```javascript
glossary: {
  filePath: '.translator/glossary.json'
}
```

### glossary.entries

- **类型**: `GlossaryEntry[]`
- **默认值**: `[]`
- **说明**: 术语条目列表

```javascript
glossary: {
  entries: [
    {
      term: 'API',
      translations: {
        en: 'API',
        ja: 'API'
      },
      doNotTranslate: true,
      caseSensitive: true,
      description: 'Application Programming Interface'
    },
    {
      term: '用户',
      translations: {
        en: 'user',
        ja: 'ユーザー'
      }
    }
  ]
}
```

## 代码替换配置

### replace.i18nFunction

- **类型**: `string`
- **默认值**: `'t'`
- **说明**: i18n 函数名

```javascript
replace: {
  i18nFunction: 't'
}
```

### replace.importPath

- **类型**: `string`
- **默认值**: `'i18n'`
- **说明**: i18n 模块导入路径

```javascript
replace: {
  importPath: '@/i18n'
}
```

### replace.addImports

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否自动添加导入语句

```javascript
replace: {
  addImports: true
}
```

## 验证配置

### validation.enabled

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否启用验证

```javascript
validation: {
  enabled: true
}
```

### validation.checkPlaceholders

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 检查占位符完整性

```javascript
validation: {
  checkPlaceholders: true
}
```

### validation.checkHtmlTags

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 检查 HTML 标签

```javascript
validation: {
  checkHtmlTags: true
}
```

### validation.checkLength

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 检查文本长度

```javascript
validation: {
  checkLength: true
}
```

### validation.maxLength

- **类型**: `number`
- **默认值**: `1000`
- **说明**: 最大文本长度

```javascript
validation: {
  maxLength: 1000
}
```

## 其他配置

### incremental

- **类型**: `boolean`
- **默认值**: `true`
- **说明**: 是否启用增量翻译

```javascript
incremental: true
```

## 完整示例

```javascript
module.exports = {
  // 基础配置
  sourceLanguage: 'zh-CN',
  targetLanguages: ['en', 'ja', 'ko'],
  incremental: true,

  // API 配置
  api: {
    provider: 'google',
    key: process.env.TRANSLATE_API_KEY,
    rateLimit: 10,
    batchSize: 50,
    retries: 3
  },

  // 提取配置
  extract: {
    include: ['src/**/*.{js,jsx,ts,tsx,vue}'],
    exclude: ['node_modules', 'dist'],
    patterns: [/[\u4e00-\u9fa5]+/g],
    includeComments: false
  },

  // 输出配置
  output: {
    dir: 'src/locales',
    format: 'json',
    minify: false,
    splitByNamespace: false
  },

  // 翻译记忆
  memory: {
    enabled: true,
    dbPath: '.translator/memory.db',
    similarityThreshold: 0.7
  },

  // 术语库
  glossary: {
    enabled: true,
    filePath: '.translator/glossary.json',
    entries: [
      {
        term: 'API',
        translations: {},
        doNotTranslate: true,
        caseSensitive: true
      }
    ]
  },

  // 代码替换
  replace: {
    i18nFunction: 't',
    importPath: '@/i18n',
    addImports: true
  },

  // 验证
  validation: {
    enabled: true,
    checkPlaceholders: true,
    checkHtmlTags: true,
    checkLength: true,
    maxLength: 1000
  }
}
```

## 环境变量

推荐使用环境变量存储敏感信息：

```javascript
// translator.config.js
module.exports = {
  api: {
    key: process.env.TRANSLATE_API_KEY,
    baidu: {
      appid: process.env.BAIDU_APPID,
      secret: process.env.BAIDU_SECRET
    }
  }
}
```

`.env` 文件：

```bash
TRANSLATE_API_KEY=your_api_key
BAIDU_APPID=your_appid
BAIDU_SECRET=your_secret
```

## TypeScript 支持

使用 TypeScript 配置文件：

```typescript
// translator.config.ts
import type { TranslatorConfig } from '@ldesign/translator'

const config: TranslatorConfig = {
  sourceLanguage: 'zh-CN',
  targetLanguages: ['en', 'ja', 'ko'],
  // ...
}

export default config
```
