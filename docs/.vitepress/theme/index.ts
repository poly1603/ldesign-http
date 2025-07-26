import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'

// 导入自定义组件
import ApiTester from '../components/ApiTester.vue'
import FileUploader from '../components/FileUploader.vue'
import ResponseViewer from '../components/ResponseViewer.vue'
import RequestHistory from '../components/RequestHistory.vue'
import ErrorToast from '../components/ErrorToast.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app, router, siteData }) {
    // 注册全局组件
    app.component('ApiTester', ApiTester)
    app.component('FileUploader', FileUploader)
    app.component('ResponseViewer', ResponseViewer)
    app.component('RequestHistory', RequestHistory)
    app.component('ErrorToast', ErrorToast)

    // 全局错误处理
    app.config.errorHandler = (err, vm, info) => {
      console.error('Vue Error:', err, info)
    }

    // 路由守卫
    router.beforeEach((to, from, next) => {
      // 可以在这里添加路由级别的逻辑
      next()
    })
  }
} satisfies Theme
