import { resolve } from 'node:path'
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@ldesign/http',
  description: '功能强大的HTTP请求库，支持多种适配器和Vue3深度集成',

  vite: {
    resolve: {
      alias: {
        '@': resolve(__dirname, '../'),
        '@components': resolve(__dirname, './components'),
        '@composables': resolve(__dirname, './composables'),
      },
    },
    define: {
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: false,
    },
  },

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '指南', link: '/guide/' },
      { text: 'API参考', link: '/api/' },
      { text: '示例', link: '/examples/' },
      { text: '插件', link: '/plugins/' },
      { text: 'Vue集成', link: '/vue/' },
      {
        text: '更多',
        items: [
          { text: '更新日志', link: '/changelog' },
          { text: '迁移指南', link: '/migration' },
          { text: '贡献指南', link: '/contributing' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
          ],
        },
        {
          text: '基础',
          items: [
            { text: '基本用法', link: '/guide/basic-usage' },
            { text: '配置选项', link: '/guide/configuration' },
            { text: '适配器', link: '/guide/adapters' },
          ],
        },
        {
          text: '高级',
          items: [
            { text: '拦截器', link: '/guide/interceptors' },
            { text: '错误处理', link: '/guide/error-handling' },
            { text: '请求取消', link: '/guide/cancellation' },
            { text: '进度监控', link: '/guide/progress' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API参考',
          items: [
            { text: '概览', link: '/api/' },
            { text: 'HttpClient', link: '/api/http-client' },
            { text: '类型定义', link: '/api/types' },
            { text: '工具函数', link: '/api/utils' },
          ],
        },
      ],
      '/examples/': [
        {
          text: '示例',
          items: [
            { text: '概览', link: '/examples/' },
            { text: '基础示例', link: '/examples/basic' },
            { text: '真实API示例', link: '/examples/real-api' },
            { text: '在线演示', link: '/examples/live-demo' },
            { text: 'API测试工具', link: '/examples/api-tester' },
            { text: '完整项目', link: '/examples/complete-demo' },
            { text: '文件上传', link: '/examples/upload' },
            { text: '认证示例', link: '/examples/auth' },
          ],
        },
      ],
      '/plugins/': [
        {
          text: '插件',
          items: [
            { text: '概览', link: '/plugins/' },
            { text: '缓存插件', link: '/plugins/cache' },
            { text: '重试插件', link: '/plugins/retry' },
            { text: '拦截器插件', link: '/plugins/interceptors' },
          ],
        },
      ],
      '/vue/': [
        {
          text: 'Vue集成',
          items: [
            { text: '概览', link: '/vue/' },
            { text: '组合式函数', link: '/vue/composables' },
            { text: '插件安装', link: '/vue/plugin' },
            { text: '最佳实践', link: '/vue/best-practices' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-org/ldesign' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 LDesign Team',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/your-org/ldesign/edit/main/packages/http/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    lineNumbers: true,
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'zh-CN' }],
    ['meta', { name: 'og:site_name', content: '@ldesign/http' }],
  ],
})
