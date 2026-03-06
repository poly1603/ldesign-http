<script setup lang="ts">
import { inject } from 'vue'
import { Plug, Check, Info } from 'lucide-vue-next'
import { HTTP_CLIENT_KEY } from '@ldesign/http-vue'
import type { HttpClient } from '@ldesign/http-core'

const client = inject<HttpClient>(HTTP_CLIENT_KEY)
const hasClient = !!client
</script>

<template>
  <div class="demo-page">
    <h2>插件系统</h2>
    <p class="page-desc">
      两种插件模式：原生 Vue 插件用于标准应用，Engine 插件用于 @ldesign/engine-vue3 集成。
    </p>

    <div class="card">
      <h3><Check :size="18" /> 当前状态</h3>
      <div class="flex items-center gap-2 mb-4">
        <span :class="['badge', hasClient ? 'badge-success' : 'badge-error']">
          {{ hasClient ? 'HTTP 客户端已通过 Engine 插件注入' : '未找到客户端' }}
        </span>
      </div>
      <p class="text-sm text-secondary">
        本演练场在 <code>main.ts</code> 中使用 <code>createHttpEnginePlugin</code>。
        HTTP 客户端通过 Engine 生命周期自动注入到 Vue 应用中。
      </p>
    </div>

    <div class="card">
      <h3><Plug :size="18" /> 模式一：Engine 插件（本演练场使用）</h3>
      <p class="text-sm text-secondary mb-2">
        配合 <code>@ldesign/engine-vue3</code> 使用。插件集成到 Engine 生命周期，
        自动注册客户端到服务容器，并注入到 Vue 应用。
      </p>
      <pre class="code-block">// main.ts
import { createVueEngine } from '@ldesign/engine-vue3'
import { createHttpEnginePlugin } from '@ldesign/http-vue'

const engine = createVueEngine({
  name: 'My App',
  app: { rootComponent: App },
  plugins: [
    createHttpEnginePlugin({
      baseURL: 'https://api.example.com',
      timeout: 15000,
      enableRetry: true,
      retryCount: 2,
    }),
  ],
})

await engine.mount('#app')

// 在组件中使用：
import { inject } from 'vue'
import { HTTP_CLIENT_KEY } from '@ldesign/http-vue'
const client = inject(HTTP_CLIENT_KEY)!</pre>
    </div>

    <div class="card">
      <h3><Plug :size="18" /> 模式二：原生 Vue 插件</h3>
      <p class="text-sm text-secondary mb-2">
        配合标准 <code>createApp()</code> 使用。简单的 <code>app.use()</code> 安装。
        无需 Engine 依赖。
      </p>
      <pre class="code-block">// main.ts
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http-vue'

const app = createApp(App)

app.use(createHttpPlugin({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  enableCache: true,
  enableRetry: true,
  retryCount: 3,
  adapter: 'fetch',
}))

app.mount('#app')

// 在组件中使用（相同 API）：
import { inject } from 'vue'
import { HTTP_CLIENT_KEY } from '@ldesign/http-vue'
const client = inject(HTTP_CLIENT_KEY)!

// 或使用全局属性：
// this.$http.get('/api/users')</pre>
    </div>

    <div class="card">
      <h3><Info :size="18" /> 对比</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>特性</th>
            <th>createHttpPlugin</th>
            <th>createHttpEnginePlugin</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>适用场景</td>
            <td>标准 Vue 3 应用</td>
            <td>@ldesign/engine-vue3</td>
          </tr>
          <tr>
            <td>安装方式</td>
            <td><code>app.use()</code></td>
            <td>Engine plugins 数组</td>
          </tr>
          <tr>
            <td>生命周期</td>
            <td>同步安装</td>
            <td>异步，遵循 Engine 生命周期</td>
          </tr>
          <tr>
            <td>服务容器</td>
            <td>无</td>
            <td>注册到 Engine 容器</td>
          </tr>
          <tr>
            <td>Vue 注入</td>
            <td>立即注入</td>
            <td>app:created 事件后注入</td>
          </tr>
          <tr>
            <td>$http 全局属性</td>
            <td>支持</td>
            <td>支持</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
