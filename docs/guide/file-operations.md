# 文件上传下载

@ldesign/http 提供了完善的文件上传下载功能，支持进度跟踪。

## 文件上传

### 基础上传

```typescript
const formData = new FormData()
formData.append('file', file)
formData.append('name', 'avatar')

const response = await client.upload('/upload', formData)
```

### 带进度上传

```typescript
const response = await client.upload('/upload', formData, {
  onUploadProgress: (progress) => {
    console.log(`上传进度: ${progress.percentage}%`)
    console.log(`已上传: ${progress.loaded} / ${progress.total} 字节`)
  }
})
```

### 多文件上传

```typescript
const formData = new FormData()
files.forEach(file => {
  formData.append('files', file)
})

await client.upload('/upload/multiple', formData)
```

## 文件下载

### 基础下载

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

### 带进度下载

```typescript
const response = await client.download('/files/large.zip', {
  onDownloadProgress: (progress) => {
    console.log(`下载进度: ${progress.percentage}%`)
  }
})
```

## 下一步

- [进度跟踪](/guide/progress) - 详细进度功能
- [示例](/examples/upload) - 上传示例
- [示例](/examples/download) - 下载示例