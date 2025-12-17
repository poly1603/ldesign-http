# LEAP RPC 适配层

兼容老系统 `LEAP.request` / `leapclient.request` 的 RPC 客户端。

## 快速开始

```typescript
import { createLeapClient, createLeap } from '@ldesign/http'

// 创建客户端
const leapClient = await createLeapClient({
  serverUrl: 'https://api.example.com',
  getSid: () => sessionStorage.getItem('sid') || ''
})

// 方式1：直接使用
const result = await leapClient.request('app_getUserInfo', { userId: '123' })

// 方式2：创建兼容对象
const LEAP = createLeap(leapClient)
const result2 = await LEAP.request('app_getUserInfo', { userId: '123' })
```

## Vue 组合式 API

```vue
<script setup lang="ts">
import { useLeap } from '@ldesign/http-vue'
import { inject } from 'vue'

const leapClient = inject('leapClient')!
const { data, loading, error, execute } = useLeap(leapClient)

const fetchUser = async () => {
  await execute('app_getUserInfo', { userId: '123' })
}
</script>
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `serverUrl` | `string` | - | 服务器地址（必需） |
| `rpcPath` | `string` | `/LEAP/Service/RPC/RPC.DO` | RPC 端点路径 |
| `getSid` | `() => string` | - | 会话 ID 获取函数 |
| `timeout` | `number` | `30000` | 请求超时时间 |
| `onRequest` | `Function` | - | 请求拦截器 |
| `onResponse` | `Function` | - | 响应拦截器 |
| `onError` | `Function` | - | 错误拦截器 |

## 从老系统迁移

```typescript
// 老系统代码
var result = LEAP.request('app_getUserInfo', { userId: '123' })

// 新系统代码 - 完全兼容
const LEAP = createLeap(leapClient)
const result = await LEAP.request('app_getUserInfo', { userId: '123' })

// 或挂载到 window 保持完全兼容
window.leapclient = await createGlobalLeapClient({ serverUrl: '...' })
```

## API

### createLeapClient(config)

创建 LEAP 客户端（异步）

### createLeapClientSync(config, httpClient)

创建 LEAP 客户端（同步）

### createGlobalLeapClient(config)

创建全局 LEAP 客户端，可挂载到 `window.leapclient`

### createLeap(client)

创建 LEAP 兼容对象，提供 `LEAP.request` / `LEAP.request2` API
