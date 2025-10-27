# 🚀 快速开始指南

## 5 分钟上手

### 1. 安装（30 秒）

```bash
cd tools/translator
pnpm install
```

### 2. 构建（1 分钟）

```bash
pnpm run build
```

### 3. 测试 CLI（30 秒）

```bash
# 查看帮助
node bin/cli.js --help

# 初始化配置
node bin/cli.js init --skip-prompts
```

### 4. 在项目中使用（3 分钟）

#### 步骤 1: 初始化

```bash
cd /path/to/your/project
npx ldesign-translator init
```

按提示选择：
- 源语言: `zh-CN`
- 目标语言: `en`
- 提供商: `google`
- API 密钥: 留空（稍后配置）

#### 步骤 2: 配置 API

编辑生成的 `translator.config.js`，添加你的 API 密钥：

```javascript
module.exports = {
  api: {
    provider: 'google',
    key: 'YOUR_API_KEY', // 替换为你的密钥
  },
  // ... 其他配置
}
```

#### 步骤 3: 提取文本

```bash
npx ldesign-translator extract src/
```

这将扫描 `src/` 目录，提取所有中文文本。

#### 步骤 4: 翻译

```bash
npx ldesign-translator translate --to en
```

自动翻译提取的文本到英文。

#### 步骤 5: 查看结果

翻译文件将保存在 `src/locales/` 目录：
- `src/locales/zh-CN.json` - 中文原文
- `src/locales/en.json` - 英文翻译

## 📺 Web UI 演示

启动 Web 界面：

```bash
npx ldesign-translator serve
```

访问 `http://localhost:3000` 查看：
- 翻译管理
- 导入导出
- 统计仪表板

## 🎯 常用命令

```bash
# 提取文本
npx ldesign-translator extract

# 翻译到多个语言
npx ldesign-translator translate --to en,ja,ko

# 导出到 Excel
npx ldesign-translator export -o translations.xlsx

# 从 Excel 导入
npx ldesign-translator import -f translations.xlsx

# 启动 Web UI
npx ldesign-translator serve
```

## 🔑 获取 API 密钥

### Google Translate

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目
3. 启用 Cloud Translation API
4. 创建 API 密钥

### 百度翻译

1. 访问 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册并认证
3. 创建应用
4. 获取 APP ID 和密钥

### DeepL

1. 访问 [DeepL API](https://www.deepl.com/pro-api)
2. 注册账号
3. 选择套餐
4. 获取 Auth Key

## 💡 提示

1. **环境变量** - 建议使用环境变量存储 API 密钥
   ```bash
   export TRANSLATE_API_KEY=your_key
   ```

2. **增量翻译** - 默认启用，只翻译新增文本

3. **翻译记忆** - 自动保存翻译历史，提高效率

4. **Excel 协作** - 导出给专业翻译人员审核

## 📚 更多资源

- [完整使用指南](./HOW_TO_USE.md)
- [实现报告](./IMPLEMENTATION_COMPLETE.md)
- [项目总结](./PROJECT_SUMMARY.md)

---

**准备好了吗？** 开始你的国际化之旅！🌍

