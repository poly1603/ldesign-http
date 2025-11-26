# 文件下载示例

文件下载的完整示例。

## 基础下载

```typescript
const response = await client.download('/files/document.pdf')

// 保存文件
const url = URL.createObjectURL(response.data)
const a = document.createElement('a')
a.href = url
a.download = response.filename || 'download'
a.click()
URL.revokeObjectURL(url)
```

## 带进度

```typescript
const response = await client.download('/files/large.zip', {
  onDownloadProgress: (progress) => {
    console.log(`下载进度: ${progress.percentage}%`)
  }
})
```

## Vue 示例

```vue
<script setup>
import { ref } from 'vue'
import { useHttpClient } from '@ldesign/http-vue'

const client = useHttpClient()
const progress = ref(0)

const handleDownload = async () => {
  const response = await client.download('/files/document.pdf', {
    onDownloadProgress: (p) => {
      progress.value = p.percentage
    }
  })
  
  const url = URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = response.filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
    <button @click="handleDownload">下载文件</button>
    <progress :value="progress" max="100">{{ progress }}%</progress>
  </div>
</template>
```

## 下一步

- [文件上传](/examples/upload) - 上传示例
- [进度跟踪](/guide/progress) - 进度功能