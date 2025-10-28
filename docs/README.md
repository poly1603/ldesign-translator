# LDesign Translator 文档

这是 LDesign Translator 的 VitePress 文档源码。

## 安装依赖

```bash
cd docs
npm install
# 或
pnpm install
```

## 本地开发

```bash
npm run docs:dev
```

访问 http://localhost:5173

## 构建文档

```bash
npm run docs:build
```

构建产物在 `docs/.vitepress/dist` 目录。

## 预览构建

```bash
npm run docs:preview
```

## 文档结构

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress 配置
├── guide/                 # 指南
│   ├── getting-started.md
│   ├── installation.md
│   └── ...
├── api/                   # API 参考
│   ├── config.md
│   └── ...
├── cli/                   # CLI 命令
│   ├── commands.md
│   └── ...
├── examples/              # 示例
│   └── ...
└── index.md               # 首页
```

## 贡献

欢迎提交 PR 改进文档！
