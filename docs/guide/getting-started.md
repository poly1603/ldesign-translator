# 快速开始

本指南将帮助你在 5 分钟内开始使用 LDesign Translator。

## 安装

首先，在你的项目中安装 LDesign Translator：

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

## 初始化

运行初始化命令创建配置文件：

```bash
npx ldesign-translator init
```

这将启动交互式向导，引导你完成配置：

```
? 源语言: zh-CN
? 目标语言 (逗号分隔): en,ja,ko
? 翻译服务提供商: Google Translate
? API 密钥: ****
? 输出目录: src/locales
? 输出格式: JSON
```

完成后会在项目根目录生成 `translator.config.js` 文件。

## 基础工作流

### 1. 提取文本

扫描项目中的中文文本：

```bash
npx ldesign-translator extract
```

输出示例：

```
✔ 扫描文件...
✔ 找到 156 个文件
✔ 提取文本...
✔ 提取完成! 共提取 342 个文本

提取结果:
  - 总数: 342
  - 新增: 28
  - 更新: 3
  - 跳过: 311
```

### 2. 翻译文本

将提取的文本翻译为目标语言：

```bash
npx ldesign-translator translate --to en
```

输出示例：

```
✔ 加载配置...
✔ 初始化翻译器...
✔ 翻译 342 条文本到 en...
✔ 需要翻译 28 条新文本
✔ 翻译完成!

翻译统计:
  - 总数: 342
  - 已翻译: 342 (100%)
  - 未翻译: 0
  - 来源:
    - API: 28
    - 记忆: 314
```

### 3. 验证翻译质量

检查翻译质量：

```bash
npx ldesign-translator validate
```

输出示例：

```
✔ 验证 en 翻译...
✔ 验证 ja 翻译...
✔ 验证 ko 翻译...

=== 翻译质量验证报告 ===

总问题数: 3
  错误: 1
  警告: 2
  提示: 0

按类型统计:
  placeholder: 1
  html: 2

问题详情:
1. ❌ [en] welcome.message: 缺失占位符: {name}
   源文本: 欢迎{name}！
   译文: Welcome!
```

### 4. 替换代码

将硬编码文本替换为 i18n 调用：

```bash
# 先预览
npx ldesign-translator replace --dry-run

# 确认后执行
npx ldesign-translator replace
```

输出示例：

```
✔ 扫描文件...
✔ 找到 156 个文件
✔ 加载已提取的文本...
✔ 加载了 342 个文本键值对
✔ 替换中...

=== 替换报告 ===

处理文件: 156
成功: 156
失败: 0
总替换数: 342

修改的文件:
  - src/App.vue
  - src/components/Header.vue
  - src/views/Home.vue
  ...

✨ 替换完成! 共替换了 342 处文本
```

## 查看结果

完成后，你的项目结构类似：

```
project/
├── src/
│   ├── locales/           # 翻译文件
│   │   ├── zh-CN.json     # 源语言
│   │   ├── en.json        # 英文翻译
│   │   ├── ja.json        # 日文翻译
│   │   └── ko.json        # 韩文翻译
│   └── ...
├── .translator/           # 翻译记忆和缓存
│   ├── memory.db
│   └── glossary.json
└── translator.config.js   # 配置文件
```

翻译文件示例 (`src/locales/en.json`):

```json
{
  "welcome.title": "Welcome",
  "welcome.message": "Hello, {name}!",
  "button.submit": "Submit",
  "button.cancel": "Cancel"
}
```

替换后的代码示例：

::: code-group

```javascript [替换前]
// src/App.vue
export default {
  data() {
    return {
      title: '欢迎使用',
      message: '你好，{name}！'
    }
  }
}
```

```javascript [替换后]
// src/App.vue
import { t } from '@/i18n'

export default {
  data() {
    return {
      title: t('welcome.title'),
      message: t('welcome.message')
    }
  }
}
```

:::

## 下一步

现在你已经完成了基本的国际化流程，接下来可以：

- 📖 阅读[核心功能](/guide/extraction)了解更多细节
- 🔧 查看[配置选项](/api/config)自定义工作流
- 💡 学习[最佳实践](/examples/best-practices)
- 🌐 启动 [Web UI](/guide/web-ui) 可视化管理翻译

## 常见问题

### 如何只翻译新增的文本？

工具默认使用增量翻译，只翻译新增和修改的文本。如需强制重新翻译所有文本：

```bash
npx ldesign-translator translate --to en --force
```

### 如何备份原文件？

替换命令默认会备份原文件为 `.backup`：

```bash
npx ldesign-translator replace --backup
```

### 翻译出错怎么办？

1. 检查 API 密钥是否正确
2. 确认网络连接正常
3. 查看错误日志 `.translator/logs`
4. 使用 `--verbose` 选项查看详细信息

更多问题请查看 [FAQ](/examples/faq)。
