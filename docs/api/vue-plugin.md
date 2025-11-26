# Vue 插件 API

Vue 3 插件的 API 参考。

## createHttpPlugin

创建 HTTP 插件。

```typescript
function createHttpPlugin(config?: HttpConfig): Plugin
```

### 使用方法

```typescript
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http-vue'

const app = createApp(App)

app.use(createHttpPlugin({
  baseURL: '/api',
  timeout: 10000
}))
```

### 配置选项

```typescript
interface HttpPluginConfig extends HttpConfig {
  // 全局错误处理
  onError?: (error: any) => void
  
  // 全局成功处理
  onSuccess?: (response: Response) => void
  
  // 注入键名
  injectKey?: string
}
```

## useHttpClient

获取 HTTP 客户端实例。

```typescript
function useHttpClient(): HttpClient
```

### 使用方法

```vue
<script setup>
import { useHttpClient } from '@ldesign/http-vue'

const client = useHttpClient()

const fetchData = async () => {
  const response = await client.get('/users')
}
</script>
```

## 下一步

- [Vue 集成](/packages/vue) - 使用指南
- [Vue Composables](/api/vue-composables) - Composables API