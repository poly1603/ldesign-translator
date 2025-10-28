# CLI 命令

LDesign Translator 提供了一套完整的 CLI 命令来管理国际化翻译工作流。

## 命令概览

| 命令 | 说明 | 常用选项 |
|------|------|----------|
| [init](/cli/init) | 初始化配置文件 | `--force`, `--skip-prompts` |
| [extract](/cli/extract) | 提取代码中的文本 | `--verbose`, `--overwrite` |
| [translate](/cli/translate) | 翻译提取的文本 | `--to`, `--force`, `--no-use-memory` |
| [replace](/cli/replace) | 替换硬编码文本 | `--dry-run`, `--backup`, `-i` |
| [validate](/cli/validate) | 验证翻译质量 | `-l`, `--no-check-placeholders` |
| [export](/cli/export) | 导出到 Excel | `-o`, `-l`, `--include-metadata` |
| [import](/cli/import) | 从 Excel 导入 | `-f`, `--overwrite`, `--no-validate` |
| [serve](/cli/serve) | 启动 Web UI | `-p` |

## 通用选项

所有命令都支持以下选项：

```bash
-h, --help     # 显示帮助信息
-v, --version  # 显示版本号
--verbose      # 显示详细日志
```

## 快速参考

### 基础工作流

```bash
# 1. 初始化
npx ldesign-translator init

# 2. 提取
npx ldesign-translator extract

# 3. 翻译
npx ldesign-translator translate --to en,ja,ko

# 4. 验证
npx ldesign-translator validate

# 5. 替换
npx ldesign-translator replace
```

### 高级用法

```bash
# 提取指定目录
npx ldesign-translator extract src/components/

# 强制重新翻译
npx ldesign-translator translate --to en --force

# 预览替换结果
npx ldesign-translator replace --dry-run

# 导出特定语言
npx ldesign-translator export -o translations.xlsx -l en,ja

# 启动 Web UI 在指定端口
npx ldesign-translator serve -p 8080
```

## 命令详解

### init - 初始化配置

创建 `translator.config.js` 配置文件。

```bash
npx ldesign-translator init [options]
```

**选项：**

- `-s, --source-language <lang>` - 源语言 (默认: zh-CN)
- `-t, --target-languages <langs>` - 目标语言，逗号分隔 (默认: en)
- `-p, --provider <provider>` - 翻译提供商 (google/baidu/deepl)
- `-f, --force` - 强制覆盖已存在的配置
- `--skip-prompts` - 跳过交互式提示

**示例：**

```bash
# 交互式初始化
npx ldesign-translator init

# 使用默认配置
npx ldesign-translator init --skip-prompts

# 指定翻译提供商
npx ldesign-translator init -p deepl
```

### extract - 提取文本

扫描代码并提取需要翻译的文本。

```bash
npx ldesign-translator extract [paths...] [options]
```

**选项：**

- `-v, --verbose` - 显示详细信息
- `-o, --overwrite` - 覆盖已有的键

**示例：**

```bash
# 提取所有文件
npx ldesign-translator extract

# 提取指定目录
npx ldesign-translator extract src/components/ src/views/

# 显示详细信息
npx ldesign-translator extract --verbose
```

### translate - 翻译文本

将提取的文本翻译为目标语言。

```bash
npx ldesign-translator translate --to <languages> [options]
```

**选项：**

- `--to <languages>` - 目标语言，逗号分隔 (必需)
- `-f, --force` - 强制重新翻译所有文本
- `-v, --verbose` - 显示详细信息
- `--no-use-memory` - 不使用翻译记忆

**示例：**

```bash
# 翻译到英文
npx ldesign-translator translate --to en

# 翻译到多个语言
npx ldesign-translator translate --to en,ja,ko

# 强制重新翻译
npx ldesign-translator translate --to en --force
```

### replace - 代码替换

将硬编码文本替换为 i18n 调用。

```bash
npx ldesign-translator replace [paths...] [options]
```

**选项：**

- `-i, --i18n-function <name>` - i18n 函数名 (默认: t)
- `--no-add-imports` - 不自动添加导入语句
- `--no-backup` - 不备份原文件
- `-d, --dry-run` - 预览模式，不实际修改文件
- `-v, --verbose` - 显示详细信息

**示例：**

```bash
# 预览替换
npx ldesign-translator replace --dry-run

# 执行替换
npx ldesign-translator replace

# 指定 i18n 函数名
npx ldesign-translator replace -i useTranslation

# 不备份原文件
npx ldesign-translator replace --no-backup
```

### validate - 质量验证

验证翻译的质量和完整性。

```bash
npx ldesign-translator validate [options]
```

**选项：**

- `-l, --languages <langs>` - 要验证的语言，逗号分隔
- `--no-check-placeholders` - 禁用占位符检查
- `--no-check-html-tags` - 禁用 HTML 标签检查
- `--no-check-length` - 禁用长度检查
- `--max-length <length>` - 最大长度限制
- `-v, --verbose` - 显示详细信息

**示例：**

```bash
# 验证所有语言
npx ldesign-translator validate

# 验证特定语言
npx ldesign-translator validate -l en,ja

# 只检查占位符
npx ldesign-translator validate --no-check-html-tags --no-check-length
```

### export - 导出翻译

导出翻译到 Excel 文件。

```bash
npx ldesign-translator export -o <file> [options]
```

**选项：**

- `-o, --output <file>` - Excel 输出文件路径 (必需)
- `-l, --languages <langs>` - 要导出的语言，逗号分隔
- `--include-metadata` - 包含元数据

**示例：**

```bash
# 导出所有翻译
npx ldesign-translator export -o translations.xlsx

# 导出特定语言
npx ldesign-translator export -o review.xlsx -l en,ja

# 包含元数据
npx ldesign-translator export -o full.xlsx --include-metadata
```

### import - 导入翻译

从 Excel 文件导入翻译。

```bash
npx ldesign-translator import -f <file> [options]
```

**选项：**

- `-f, --file <file>` - Excel 文件路径 (必需)
- `--overwrite` - 覆盖已有翻译
- `--no-validate` - 跳过验证

**示例：**

```bash
# 导入翻译
npx ldesign-translator import -f translations.xlsx

# 覆盖已有翻译
npx ldesign-translator import -f translations.xlsx --overwrite

# 跳过验证
npx ldesign-translator import -f translations.xlsx --no-validate
```

### serve - Web UI

启动 Web UI 服务器。

```bash
npx ldesign-translator serve [options]
```

**选项：**

- `-p, --port <port>` - 服务器端口 (默认: 3000)

**示例：**

```bash
# 启动 Web UI
npx ldesign-translator serve

# 指定端口
npx ldesign-translator serve -p 8080
```

访问 `http://localhost:3000` 使用 Web 界面。

## 环境变量

可以通过环境变量配置某些选项：

```bash
# 翻译 API 密钥
export TRANSLATE_API_KEY=your_api_key

# 百度翻译配置
export BAIDU_APPID=your_appid
export BAIDU_SECRET=your_secret

# DeepL API 密钥
export DEEPL_API_KEY=your_api_key

# 日志级别
export LOG_LEVEL=debug
```

## 退出码

命令的退出码含义：

- `0` - 成功
- `1` - 一般错误
- `2` - 配置错误
- `3` - API 错误
- `4` - 文件操作错误

## 脚本集成

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "i18n:extract": "ldesign-translator extract",
    "i18n:translate": "ldesign-translator translate --to en,ja,ko",
    "i18n:validate": "ldesign-translator validate",
    "i18n:replace": "ldesign-translator replace",
    "i18n:export": "ldesign-translator export -o translations.xlsx",
    "i18n:serve": "ldesign-translator serve"
  }
}
```

然后使用：

```bash
npm run i18n:extract
npm run i18n:translate
npm run i18n:validate
```

## 调试

启用详细日志：

```bash
# 显示详细信息
npx ldesign-translator extract --verbose

# 设置日志级别
LOG_LEVEL=debug npx ldesign-translator translate --to en
```

查看日志文件：

```bash
# 日志存储位置
.translator/logs/translator.log
```

## 更多信息

- 查看 [配置选项](/api/config) 了解更多配置
- 查看 [使用示例](/examples/workflow) 学习完整工作流
- 查看 [FAQ](/examples/faq) 解决常见问题
