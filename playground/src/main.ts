import { createVueEngine } from '@ldesign/engine-vue3'
import { createHttpEnginePlugin } from '@ldesign/http-vue'
import { installMock } from './mock/setup'
import App from './App.vue'
import './styles/main.css'

// 安装 Mock API
installMock()

// 使用 VueEngine 启动应用
const engine = createVueEngine({
  name: 'HTTP Playground',
  debug: true,
  app: {
    rootComponent: App,
  },
  plugins: [
    createHttpEnginePlugin({
      baseURL: '',
      timeout: 15000,
      enableRetry: true,
      retryCount: 2,
      adapter: 'fetch',
    }),
  ],
})

engine.mount('#app')
