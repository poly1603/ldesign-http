# 类型工具

@ldesign/http 提供了一系列实用的类型工具函数。

## 类型守卫

### isHttpError

检查是否为 HTTP 错误：

```typescript
import { isHttpError } from '@ldesign/http-core'

try {
  await client.get('/users')
} catch (error) {
  if (isHttpError(error)) {
    console.log('HTTP 错误:', error.response?.status)
  }
}
```

### isNetworkError

检查是否为网络错误：

```typescript
import { isNetworkError } from '@ldesign/http-core'

if (isNetworkError(error)) {
  console.log('网络连接失败')
}
```

### isTimeoutError

检查是否为超时错误：

```typescript
import { isTimeoutError } from '@ldesign/http-core'

if (isTimeoutError(error)) {
  console.log('请求超时')
}
```

### isCancelError

检查是否为取消错误：

```typescript
import { isCancelError } from '@ldesign/http-core'

if (isCancelError(error)) {
  console.log('请求已取消')
}
```

## 工具函数

### safeJsonParse

安全的 JSON 解析：

```typescript
import { safeJsonParse } from '@ldesign/http-core'

const data = safeJsonParse<User>('{"id":1,"name":"John"}')
if (data) {
  console.log(data.name)
}
```

### typedKeys

类型安全的对象键：

```typescript
import { typedKeys } from '@ldesign/http-core'

const obj = { a: 1, b: 2, c: 3 }
const keys = typedKeys(obj) // 类型为 ('a' | 'b' | 'c')[]
```

### createTypedError

创建类型化错误：

```typescript
import { createTypedError } from '@ldesign/http-core'

const error = createTypedError('VALIDATION_ERROR', '数据验证失败')
```

## 下一步

- [TypeScript](/guide/typescript) - TypeScript 类型系统
- [API 参考](/api/core) - 完整 API