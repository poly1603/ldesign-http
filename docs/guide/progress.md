# 进度跟踪

进度跟踪功能可以实时显示上传和下载的进度。

## 上传进度

```typescript
await client.upload('/upload', formData, {
  onUploadProgress: (progress) => {
    console.log(`进度: ${progress.percentage}%`)
    console.log(`已上传: ${progress.loaded}`)
    console.log(`总大小: ${progress.total}`)
    console.log(`速度: ${progress.rate} B/s`)
    console.log(`剩余时间: ${progress.estimated}s`)
  }
})
```

## 下载进度

```typescript
await client.download('/file.zip', {
  onDownloadProgress: (progress) => {
    console.log(`下载进度: ${progress.percentage}%`)
  }
})
```

## Vue 集成

```vue
<script setup>
import { ref } from 'vue'
import { useHttp } from '@ldesign/http-vue'

const progress = ref(0)

const upload = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  await client.upload('/upload', formData, {
    onUploadProgress: (p) => {
      progress.value = p.percentage
    }
  })
}
</script>

<template>
  <div>
    <input type="file" @change="upload($event.target.files[0])" />
    <progress :value="progress" max="100">{{ progress }}%</progress>
  </div>
</template>
```

## 下一步

- [文件操作](/guide/file-operations) - 文件上传下载
- [上传示例](/examples/upload) - 完整示例