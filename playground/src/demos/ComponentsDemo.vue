<script setup lang="ts">
import { ref } from 'vue'
import { Component, Loader, AlertTriangle, RotateCcw, BarChart3 } from 'lucide-vue-next'
import {
  HttpError as HttpErrorComponent,
  HttpRetry,
  HttpProgress,
} from '@ldesign/http-vue'

// === HttpError Demo ===
const errorTypes = [
  { label: '网络错误', error: Object.assign(new Error('无法连接到服务器'), { isNetworkError: true }) },
  { label: '超时错误', error: Object.assign(new Error('请求超时，请重试'), { isTimeoutError: true }) },
  { label: '401 未授权', error: Object.assign(new Error('用户未登录'), { status: 401 }) },
  { label: '403 禁止', error: Object.assign(new Error('无权访问此资源'), { status: 403 }) },
  { label: '404 未找到', error: Object.assign(new Error('资源不存在'), { status: 404 }) },
  { label: '500 服务器错误', error: Object.assign(new Error('服务器内部错误'), { status: 500 }) },
  { label: '取消错误', error: Object.assign(new Error('用户取消请求'), { isCancelError: true }) },
]
const selectedError = ref(errorTypes[0])

// === HttpRetry Demo ===
const retryCount = ref(0)
const retryError = ref<Error | null>(new Error('请求失败，请重试'))
function handleRetry() {
  retryCount.value++
  if (retryCount.value >= 3) {
    retryError.value = null
  }
}

// === HttpProgress Demo ===
const progressPercent = ref(0)
const progressType = ref<'line' | 'circle' | 'dashboard'>('line')
const progressStatus = ref<'normal' | 'active' | 'success' | 'error'>('active')
let progressTimer: any = null

function simulateProgress() {
  progressPercent.value = 0
  progressStatus.value = 'active'
  clearInterval(progressTimer)
  progressTimer = setInterval(() => {
    progressPercent.value += Math.random() * 15
    if (progressPercent.value >= 100) {
      progressPercent.value = 100
      progressStatus.value = 'success'
      clearInterval(progressTimer)
    }
  }, 300)
}
</script>

<template>
  <div class="demo-page">
    <h2>Vue 组件</h2>
    <p class="page-desc">
      @ldesign/http-vue 提供 5 个声明式 Vue 组件，开箱即用地处理 HTTP 相关 UI 场景。
    </p>

    <!-- HttpProvider -->
    <div class="card">
      <h3><Component :size="18" /> HttpProvider — 全局配置提供者</h3>
      <p class="text-sm text-secondary mb-2">
        通过 Vue 的 provide/inject 机制，向子组件树提供 HttpClient 实例。
        包裹在 HttpProvider 内的 HttpLoader 等组件可自动获取客户端。
      </p>
      <pre class="code-block">&lt;script setup&gt;
import { HttpProvider } from '@ldesign/http-vue'
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({ baseURL: '/api' })
&lt;/script&gt;

&lt;template&gt;
  &lt;HttpProvider :client="client" :devtools="true"&gt;
    &lt;!-- 所有子组件都可以使用 inject 获取 client --&gt;
    &lt;RouterView /&gt;
  &lt;/HttpProvider&gt;
&lt;/template&gt;</pre>
      <p class="text-sm text-secondary mt-1">
        Props: <code>client</code>（HttpClient 实例）、<code>config</code>（配置对象）、
        <code>devtools</code>（是否启用 DevTools）、<code>inherit</code>（是否继承父级配置）。
      </p>
    </div>

    <!-- HttpLoader -->
    <div class="card">
      <h3><Loader :size="18" /> HttpLoader — 声明式数据加载器</h3>
      <p class="text-sm text-secondary mb-2">
        声明式地加载远程数据，自动处理 loading/error/empty 状态。
        需要在 HttpProvider 内部使用。
      </p>
      <pre class="code-block">&lt;!-- 基础用法 --&gt;
&lt;HttpLoader url="/api/users"&gt;
  &lt;template #default="{ data, refresh }"&gt;
    &lt;ul&gt;
      &lt;li v-for="user in data" :key="user.id"&gt;{{ user.name }}&lt;/li&gt;
    &lt;/ul&gt;
    &lt;button @click="refresh"&gt;刷新&lt;/button&gt;
  &lt;/template&gt;
  &lt;template #loading&gt;加载中...&lt;/template&gt;
  &lt;template #error="{ error, retry }"&gt;
    {{ error.message }}
    &lt;button @click="retry"&gt;重试&lt;/button&gt;
  &lt;/template&gt;
  &lt;template #empty&gt;暂无数据&lt;/template&gt;
&lt;/HttpLoader&gt;

&lt;!-- 高级用法 --&gt;
&lt;HttpLoader
  url="/api/posts"
  method="GET"
  :params="{ page: 1 }"
  :cache="true"
  :cache-ttl="60000"
  :retry="{ retries: 3, retryDelay: 1000 }"
  :polling-interval="5000"
  :transform="(data) =&gt; data.items"
  :is-empty="(data) =&gt; data.length === 0"
/&gt;</pre>
      <p class="text-sm text-secondary mt-1">
        内置 4 个插槽: <code>default</code>（数据展示，提供 data/loading/refresh/retry/cancel）、
        <code>loading</code>、<code>error</code>（提供 error/retry）、<code>empty</code>。
        支持缓存、重试、轮询、数据转换。
      </p>
    </div>

    <!-- HttpError -->
    <div class="card">
      <h3><AlertTriangle :size="18" /> HttpError — 智能错误展示</h3>
      <p class="text-sm text-secondary mb-2">
        根据错误类型（网络/超时/401/403/404/500/取消）自动展示不同的图标、标题和消息。
      </p>
      <div class="flex gap-2 mb-2" style="flex-wrap:wrap">
        <button
          v-for="et in errorTypes" :key="et.label"
          class="btn btn-sm"
          :class="selectedError.label === et.label ? 'btn-primary' : ''"
          @click="selectedError = et"
        >{{ et.label }}</button>
      </div>
      <div style="background:#fff;border-radius:8px;overflow:hidden">
        <HttpErrorComponent
          :error="selectedError.error"
          :show-details="true"
          :show-code="true"
          retry-text="重试"
          @retry="() => {}"
        />
      </div>
    </div>

    <!-- HttpRetry -->
    <div class="card">
      <h3><RotateCcw :size="18" /> HttpRetry — 可视化重试控制器</h3>
      <p class="text-sm text-secondary mb-2">
        展示重试状态（等待/重试中/成功/失败），带进度条和倒计时。
        支持指数退避、自动重试、历史记录。
      </p>
      <div style="background:#fff;border-radius:8px;overflow:hidden">
        <HttpRetry
          :error="retryError"
          :retry-count="retryCount"
          :max-retries="3"
          :retry-delay="2000"
          :exponential-backoff="true"
          :show-progress="true"
          :show-countdown="true"
          :show-history="true"
          @retry="handleRetry"
        />
      </div>
      <div class="text-sm text-secondary mt-1">
        当前重试: {{ retryCount }} / 3
        <span v-if="!retryError" style="color:var(--color-success)">（已成功！）</span>
        <button v-if="!retryError" class="btn btn-sm ml-2" @click="retryCount = 0; retryError = new Error('再次失败')">重置演示</button>
      </div>
    </div>

    <!-- HttpProgress -->
    <div class="card">
      <h3><BarChart3 :size="18" /> HttpProgress — 上传下载进度条</h3>
      <p class="text-sm text-secondary mb-2">
        支持线形（line）、圆形（circle）、仪表盘（dashboard）三种样式，
        可显示速度、剩余时间、文件大小。支持暂停/取消。
      </p>
      <div class="flex gap-2 mb-2" style="flex-wrap:wrap">
        <button class="btn btn-primary" @click="simulateProgress">模拟上传</button>
        <button
          v-for="t in (['line', 'circle', 'dashboard'] as const)" :key="t"
          class="btn btn-sm" :class="progressType === t ? 'btn-primary' : ''"
          @click="progressType = t"
        >{{ t }}</button>
      </div>

      <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <HttpProgress
            :percent="progressPercent"
            :type="progressType"
            :status="progressStatus"
            :stroke-width="8"
            :show-text="true"
            :animated="true"
            :striped="true"
            file-name="document.pdf"
            :loaded="Math.round(progressPercent * 1024 * 50)"
            :total="5120000"
            :show-speed="true"
            :speed="1024 * 512"
            :show-remaining="true"
            :remaining="(100 - progressPercent) * 100"
          />
        </div>
      </div>
    </div>

    <div class="card">
      <h3>组件总览</h3>
      <pre class="code-block">import {
  HttpProvider,   // 全局配置提供者
  HttpLoader,     // 声明式数据加载器
  HttpError,      // 智能错误展示
  HttpRetry,      // 可视化重试控制器
  HttpProgress,   // 上传下载进度条
} from '@ldesign/http-vue'</pre>
    </div>
  </div>
</template>
