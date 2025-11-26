# Vue 组件 API

Vue 3 组件的 API 参考。

## HttpProvider

提供 HTTP 客户端给子组件。

```vue
<template>
  <HttpProvider
    :baseURL="baseURL"
    :timeout="timeout"
    :cache="cacheConfig"
  >
    <slot />
  </HttpProvider>
</template>
```

### Props

- `baseURL`: string
- `timeout`: number
- `cache`: CacheConfig
- `retry`: RetryConfig

## HttpLoader

显示加载状态。

```vue
<template>
  <HttpLoader
    :loading="loading"
    :error="error"
    loading-text="加载中..."
    error-text="加载失败"
  >
    <template #default>
      <!-- 内容 -->
    </template>
  </HttpLoader>
</template>
```

### Props

- `loading`: boolean
- `error`: Error | null
- `loadingText`: string
- `errorText`: string

### Slots

- `default`: 默认内容
- `loading`: 自定义加载
- `error`: 自定义错误

## HttpProgress

显示进度条。

```vue
<template>
  <HttpProgress
    :progress="progress"
    :color="color"
    :height="height"
  />
</template>
```

### Props

- `progress`: number (0-100)
- `color`: string
- `height`: number

## HttpError

错误展示组件。

```vue
<template>
  <HttpError
    :error="error"
    :retry="handleRetry"
    show-details
  />
</template>
```

### Props

- `error`: Error | null
- `retry`: () => void
- `showDetails`: boolean

## HttpRetry

重试按钮组件。

```vue
<template>
  <HttpRetry
    :loading="loading"
    :max-attempts="maxAttempts"
    :current-attempt="currentAttempt"
    @retry="handleRetry"
  />
</template>
```

### Props

- `loading`: boolean
- `maxAttempts`: number
- `currentAttempt`: number

### Events

- `retry`: 重试事件

## 下一步

- [Vue 集成](/packages/vue) - 使用指南
- [Vue Composables](/api/vue-composables) - Composables API