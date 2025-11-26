import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@ldesign/http',
  description: '功能强大的跨框架 HTTP 请求库',
  lang: 'zh-CN',
  ignoreDeadLinks: true,
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: 'API 参考', link: '/api/core' },
      { text: '示例', link: '/examples/basic' },
      {
        text: '生态系统',
        items: [
          { text: 'Core', link: '/packages/core' },
          { text: 'Vue', link: '/packages/vue' },
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
          ]
        },
        {
          text: '核心概念',
          items: [
            { text: 'HTTP 客户端', link: '/guide/http-client' },
            { text: '适配器系统', link: '/guide/adapters' },
            { text: '拦截器', link: '/guide/interceptors' },
            { text: '缓存管理', link: '/guide/caching' },
            { text: '重试机制', link: '/guide/retry' },
            { text: '错误处理', link: '/guide/error-handling' },
          ]
        },
        {
          text: '高级功能',
          items: [
            { text: '并发控制', link: '/guide/concurrency' },
            { text: '请求去重', link: '/guide/deduplication' },
            { text: '文件上传下载', link: '/guide/file-operations' },
            { text: '进度跟踪', link: '/guide/progress' },
            { text: '请求取消', link: '/guide/cancellation' },
            { text: '性能监控', link: '/guide/monitoring' },
          ]
        },
        {
          text: 'TypeScript',
          items: [
            { text: '类型系统', link: '/guide/typescript' },
            { text: '类型工具', link: '/guide/type-utilities' },
          ]
        }
      ],
      '/packages/': [
        {
          text: '核心包',
          items: [
            { text: '@ldesign/http-core', link: '/packages/core' },
          ]
        },
        {
          text: '框架适配器',
          items: [
            { text: '@ldesign/http-vue', link: '/packages/vue' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '核心 API', link: '/api/core' },
            { text: 'HTTP 客户端', link: '/api/http-client' },
            { text: '适配器', link: '/api/adapters' },
            { text: '拦截器', link: '/api/interceptors' },
            { text: '缓存', link: '/api/cache' },
            { text: '重试', link: '/api/retry' },
            { text: '工具函数', link: '/api/utils' },
          ]
        },
        {
          text: 'Vue API',
          items: [
            { text: 'Composables', link: '/api/vue-composables' },
            { text: '组件', link: '/api/vue-components' },
            { text: '指令', link: '/api/vue-directives' },
            { text: '插件', link: '/api/vue-plugin' },
          ]
        }
      ],
      '/examples/': [
        {
          text: '基础示例',
          items: [
            { text: '基本用法', link: '/examples/basic' },
            { text: 'GET 请求', link: '/examples/get' },
            { text: 'POST 请求', link: '/examples/post' },
            { text: '文件上传', link: '/examples/upload' },
            { text: '文件下载', link: '/examples/download' },
          ]
        },
        {
          text: 'Vue 示例',
          items: [
            { text: 'useHttp', link: '/examples/vue-use-http' },
            { text: 'useRequest', link: '/examples/vue-use-request' },
            { text: 'useResource', link: '/examples/vue-use-resource' },
            { text: 'useForm', link: '/examples/vue-use-form' },
            { text: 'usePagination', link: '/examples/vue-use-pagination' },
          ]
        },
        {
          text: '高级示例',
          items: [
            { text: '自定义适配器', link: '/examples/custom-adapter' },
            { text: '自定义拦截器', link: '/examples/custom-interceptor' },
            { text: '缓存策略', link: '/examples/cache-strategies' },
            { text: '错误恢复', link: '/examples/error-recovery' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ldesign/ldesign' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present LDesign Team'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/ldesign/ldesign/edit/main/packages/http/docs/:path',
      text: '在 GitHub 上编辑此页'
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  }
})