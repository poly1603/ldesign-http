# Vue 指令 API

Vue 3 指令的 API 参考。

## v-loading

加载状态指令。

```vue
<template>
  <div v-loading="loading">
    内容
  </div>
</template>
```

### 参数

- `loading`: boolean - 加载状态

### 修饰符

- `.fullscreen`: 全屏加载
- `.lock`: 锁定滚动

### 示例

```vue
<div v-loading.fullscreen="loading">内容</div>
```

## v-http

自动发送请求指令。

```vue
<template>
  <div 
    v-http:get="'/api/users'" 
    @http:success="handleSuccess"
    @http:error="handleError"
  >
    内容
  </div>
</template>
```

### 参数

- `method`: 'get' | 'post' | 'put' | 'delete'
- `url`: string

### 事件

- `http:success`: 请求成功
- `http:error`: 请求失败
- `http:loading`: 加载状态变化

## v-retry

重试指令。

```vue
<template>
  <button 
    v-retry="{ maxAttempts: 3, delay: 1000 }" 
    @click="fetchData"
  >
    加载数据
  </button>
</template>
```

### 参数

- `maxAttempts`: number - 最大重试次数
- `delay`: number - 重试延迟

## v-debounce

防抖指令。

```vue
<template>
  <input v-debounce:500="handleInput" />
</template>
```

### 参数

- `delay`: number - 防抖延迟（毫秒）

## v-throttle

节流指令。

```vue
<template>
  <button v-throttle:1000="handleClick">
    点击
  </button>
</template>
```

### 参数

- `delay`: number - 节流间隔（毫秒）

## 下一步

- [Vue 集成](/packages/vue) - 使用指南
- [Vue Composables](/api/vue-composables) - Composables API