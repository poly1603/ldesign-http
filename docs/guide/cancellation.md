# 请求取消

请求取消功能允许你中止正在进行的请求。

## 使用 AbortController

```typescript
const controller = new AbortController()

const request = client.get('/users', {
  signal: controller.signal
})

// 取消请求
controller.abort()

try {
  await request
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('请求已取消')
  }
}
```

## 超时自动取消

```typescript
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 5000)

try {
  const response = await client.get('/users', {
    signal: controller.signal
  })
  clearTimeout(timeout)
} catch (error) {
  clearTimeout(timeout)
}
```

## 批量取消

```typescript
const controllers = new Map()

function makeRequest(id, url) {
  const controller = new AbortController()
  controllers.set(id, controller)
  
  return client.get(url, {
    signal: controller.signal
  }).finally(() => {
    controllers.delete(id)
  })
}

function cancelRequest(id) {
  const controller = controllers.get(id)
  if (controller) {
    controller.abort()
  }
}

function cancelAll() {
  controllers.forEach(controller => controller.abort())
  controllers.clear()
}
```

## Vue 集成

```vue
<script setup>
import { ref, onUnmounted } from 'vue'

const controller = ref(new AbortController())

const fetchData = () => {
  return client.get('/data', {
    signal: controller.value.signal
  })
}

const cancel = () => {
  controller.value.abort()
  controller.value = new AbortController()
}

onUnmounted(() => {
  controller.value.abort()
})
</script>
```

## 下一步

- [超时控制](/guide/http-client#超时控制) - 配置超时
- [错误处理](/guide/error-handling) - 处理取消错误