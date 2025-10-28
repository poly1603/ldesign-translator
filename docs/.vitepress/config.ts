import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'LDesign Translator',
  description: '智能的国际化翻译管理工具',
  lang: 'zh-CN',
  base: '/translator/',
  
  head: [
    ['link', { rel: 'icon', href: '/translator/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API', link: '/api/config' },
      { text: 'CLI', link: '/cli/commands' },
      { text: '示例', link: '/examples/basic' },
      {
        text: '相关链接',
        items: [
          { text: 'GitHub', link: 'https://github.com/ldesign/translator' },
          { text: '更新日志', link: '/changelog' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '简介', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
            { text: '基础概念', link: '/guide/concepts' }
          ]
        },
        {
          text: '核心功能',
          items: [
            { text: '文本提取', link: '/guide/extraction' },
            { text: '翻译管理', link: '/guide/translation' },
            { text: '代码替换', link: '/guide/replacement' },
            { text: '质量验证', link: '/guide/validation' },
            { text: '术语库', link: '/guide/glossary' }
          ]
        },
        {
          text: '高级功能',
          items: [
            { text: '翻译记忆', link: '/guide/memory' },
            { text: 'Excel 导入导出', link: '/guide/excel' },
            { text: 'Web UI', link: '/guide/web-ui' },
            { text: '占位符处理', link: '/guide/placeholders' },
            { text: '上下文增强', link: '/guide/context' }
          ]
        },
        {
          text: '集成',
          items: [
            { text: 'Vue.js', link: '/guide/integration/vue' },
            { text: 'React', link: '/guide/integration/react' },
            { text: 'CI/CD', link: '/guide/integration/ci-cd' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '配置选项', link: '/api/config' },
            { text: 'API 接口', link: '/api/interfaces' },
            { text: '类型定义', link: '/api/types' }
          ]
        }
      ],
      '/cli/': [
        {
          text: 'CLI 命令',
          items: [
            { text: '命令概览', link: '/cli/commands' },
            { text: 'init', link: '/cli/init' },
            { text: 'extract', link: '/cli/extract' },
            { text: 'translate', link: '/cli/translate' },
            { text: 'replace', link: '/cli/replace' },
            { text: 'validate', link: '/cli/validate' },
            { text: 'export', link: '/cli/export' },
            { text: 'import', link: '/cli/import' },
            { text: 'serve', link: '/cli/serve' }
          ]
        }
      ],
      '/examples/': [
        {
          text: '使用示例',
          items: [
            { text: '基础示例', link: '/examples/basic' },
            { text: '完整工作流', link: '/examples/workflow' },
            { text: '最佳实践', link: '/examples/best-practices' },
            { text: '常见问题', link: '/examples/faq' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ldesign/translator' }
    ],

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/ldesign/translator/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2024-present LDesign Team'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    }
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
