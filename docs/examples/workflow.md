# 完整工作流

本文档展示从零开始完成一个项目国际化的完整工作流程。

## 场景说明

假设我们有一个 Vue 3 项目，需要支持中文、英文、日文三种语言。

## 项目结构

```
my-app/
├── src/
│   ├── components/
│   │   ├── Header.vue
│   │   └── Footer.vue
│   ├── views/
│   │   ├── Home.vue
│   │   └── About.vue
│   ├── App.vue
│   └── main.js
└── package.json
```

## 步骤 1: 安装工具

```bash
npm install @ldesign/translator --save-dev
npm install vue-i18n
```

## 步骤 2: 初始化配置

```bash
npx ldesign-translator init
```

交互式选择：

```
? 源语言: zh-CN
? 目标语言 (逗号分隔): en,ja
? 翻译服务提供商: Google Translate
? API 密钥: [输入你的 API 密钥]
? 输出目录: src/locales
? 输出格式: JSON
```

生成的 `translator.config.js`:

```javascript
module.exports = {
  sourceLanguage: 'zh-CN',
  targetLanguages: ['en', 'ja'],
  
  api: {
    provider: 'google',
    key: process.env.TRANSLATE_API_KEY,
    rateLimit: 10,
    batchSize: 50,
    retries: 3
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
  
  replace: {
    i18nFunction: 't',
    importPath: '@/i18n',
    addImports: true
  },
  
  validation: {
    enabled: true,
    checkPlaceholders: true,
    checkHtmlTags: true
  }
}
```

## 步骤 3: 配置术语库

创建 `.translator/glossary.json`:

```json
[
  {
    "term": "Vue",
    "translations": {
      "en": "Vue",
      "ja": "Vue"
    },
    "doNotTranslate": true,
    "caseSensitive": true
  },
  {
    "term": "API",
    "translations": {},
    "doNotTranslate": true
  }
]
```

## 步骤 4: 提取文本

```bash
npx ldesign-translator extract
```

输出：

```
✔ 扫描文件...
✔ 找到 8 个文件
✔ 提取文本...
✔ 提取完成! 共提取 45 个文本

提取结果:
  文件: src/App.vue
    - 欢迎使用 Vue 应用
    - 关于我们
  
  文件: src/components/Header.vue
    - 首页
    - 产品
    - 联系我们
  
  ...
  
  总计: 45 个文本
```

## 步骤 5: 查看提取结果

生成的源语言文件 `src/locales/zh-CN.json`:

```json
{
  "app.welcome": "欢迎使用 Vue 应用",
  "app.about": "关于我们",
  "header.home": "首页",
  "header.products": "产品",
  "header.contact": "联系我们",
  "footer.copyright": "版权所有 © 2024",
  "home.title": "欢迎来到我们的网站",
  "home.description": "这是一个现代化的 Web 应用",
  "home.getStarted": "开始使用",
  "about.title": "关于我们",
  "about.content": "我们是一家专业的技术公司..."
}
```

## 步骤 6: 翻译文本

```bash
npx ldesign-translator translate --to en,ja
```

输出：

```
✔ 翻译到 en...
✔ 需要翻译 45 条新文本
✔ 翻译完成!

✔ 翻译到 ja...
✔ 需要翻译 45 条新文本
✔ 翻译完成!

翻译统计:
  en: 45/45 (100%)
  ja: 45/45 (100%)
```

生成的翻译文件 `src/locales/en.json`:

```json
{
  "app.welcome": "Welcome to Vue App",
  "app.about": "About Us",
  "header.home": "Home",
  "header.products": "Products",
  "header.contact": "Contact Us",
  "footer.copyright": "Copyright © 2024",
  "home.title": "Welcome to Our Website",
  "home.description": "This is a modern web application",
  "home.getStarted": "Get Started",
  "about.title": "About Us",
  "about.content": "We are a professional technology company..."
}
```

## 步骤 7: 验证翻译质量

```bash
npx ldesign-translator validate
```

输出：

```
✔ 验证 en 翻译...
✔ 验证 ja 翻译...

=== 翻译质量验证报告 ===

总问题数: 0
  错误: 0
  警告: 0
  提示: 0

✨ 验证通过: 所有翻译质量良好!
```

## 步骤 8: 设置 i18n

创建 `src/i18n/index.js`:

```javascript
import { createI18n } from 'vue-i18n'
import zhCN from '../locales/zh-CN.json'
import en from '../locales/en.json'
import ja from '../locales/ja.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    en,
    ja
  }
})

export default i18n
export const t = i18n.global.t
```

更新 `src/main.js`:

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n'

createApp(App)
  .use(i18n)
  .mount('#app')
```

## 步骤 9: 替换代码

```bash
# 先预览
npx ldesign-translator replace --dry-run

# 确认后执行
npx ldesign-translator replace
```

**替换前** (`src/components/Header.vue`):

```vue
<template>
  <header>
    <nav>
      <a href="/">首页</a>
      <a href="/products">产品</a>
      <a href="/contact">联系我们</a>
    </nav>
  </header>
</template>
```

**替换后**:

```vue
<template>
  <header>
    <nav>
      <a href="/">{{ t('header.home') }}</a>
      <a href="/products">{{ t('header.products') }}</a>
      <a href="/contact">{{ t('header.contact') }}</a>
    </nav>
  </header>
</template>

<script setup>
import { t } from '@/i18n'
</script>
```

## 步骤 10: 添加语言切换

创建语言切换组件 `src/components/LanguageSwitcher.vue`:

```vue
<template>
  <select v-model="currentLocale" @change="changeLocale">
    <option value="zh-CN">中文</option>
    <option value="en">English</option>
    <option value="ja">日本語</option>
  </select>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const currentLocale = ref(locale.value)

function changeLocale() {
  locale.value = currentLocale.value
  localStorage.setItem('locale', currentLocale.value)
}
</script>
```

## 步骤 11: 测试

启动开发服务器：

```bash
npm run dev
```

测试各项功能：

1. ✅ 页面显示正确
2. ✅ 切换语言工作正常
3. ✅ 占位符显示正确
4. ✅ 刷新后语言保持

## 步骤 12: 导出给翻译人员审核

```bash
npx ldesign-translator export -o translations-review.xlsx
```

翻译人员修改后，重新导入：

```bash
npx ldesign-translator import -f translations-review.xlsx
```

## 步骤 13: 持续维护

新增功能后，重新提取和翻译：

```bash
# 提取新文本
npx ldesign-translator extract

# 只翻译新增的
npx ldesign-translator translate --to en,ja

# 验证
npx ldesign-translator validate

# 替换新代码
npx ldesign-translator replace
```

## 步骤 14: 启动 Web UI 管理

```bash
npx ldesign-translator serve
```

访问 http://localhost:3000 使用可视化界面管理翻译。

## 自动化脚本

在 `package.json` 添加脚本：

```json
{
  "scripts": {
    "i18n:extract": "ldesign-translator extract",
    "i18n:translate": "ldesign-translator translate --to en,ja",
    "i18n:validate": "ldesign-translator validate",
    "i18n:replace": "ldesign-translator replace",
    "i18n:full": "npm run i18n:extract && npm run i18n:translate && npm run i18n:validate && npm run i18n:replace",
    "i18n:serve": "ldesign-translator serve"
  }
}
```

一键完成所有步骤：

```bash
npm run i18n:full
```

## CI/CD 集成

在 `.github/workflows/i18n.yml`:

```yaml
name: i18n Check

on:
  pull_request:
    paths:
      - 'src/**'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Extract texts
        run: npm run i18n:extract
      
      - name: Translate
        run: npm run i18n:translate
        env:
          TRANSLATE_API_KEY: ${{ secrets.TRANSLATE_API_KEY }}
      
      - name: Validate
        run: npm run i18n:validate
      
      - name: Check for changes
        run: |
          if [[ -n $(git status -s) ]]; then
            echo "⚠️ Translation files need to be updated"
            exit 1
          fi
```

## 总结

通过以上步骤，我们完成了：

1. ✅ 配置翻译工具
2. ✅ 提取所有中文文本
3. ✅ 自动翻译为英文和日文
4. ✅ 验证翻译质量
5. ✅ 自动替换代码
6. ✅ 设置 i18n 框架
7. ✅ 添加语言切换
8. ✅ 设置持续维护流程
9. ✅ CI/CD 自动化检查

整个过程高效、自动化，大大减少了手动工作量！

## 下一步

- 学习[最佳实践](/examples/best-practices)
- 查看[配置选项](/api/config)自定义工作流
- 阅读 [FAQ](/examples/faq) 解决常见问题
