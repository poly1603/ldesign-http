# 错误恢复示例

错误恢复策略的完整示例。

## 自动恢复策略

```typescript
import { 
  createHttpClient,
  ErrorHandler,
  builtinRecoveryStrategies 
} from '@ldesign/http-core'

// 添加内置恢复策略
ErrorHandler.addRecoveryStrategy(builtinRecoveryStrategies.networkReconnect)
ErrorHandler.addRecoveryStrategy(builtinRecoveryStrategies.authRefresh)

const client = createHttpClient({ baseURL: '/api' })
```

## 自定义恢复策略

```typescript
ErrorHandler.addRecoveryStrategy({
  name: 'rate-limit-retry',
  priority: 10,
  canHandle: (error) => {
    return error.response?.status === 429
  },
  recover: async (error) => {
    const retryAfter = error.response.headers['retry-after']
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000
    
    await new Promise(resolve => setTimeout(resolve, delay))
    return await client.request(error.config)
  }
})
```

## 使用示例

```typescript
try {
  const response = await client.get('/users')
} catch (error) {
  // 尝试错误恢复
  const recovered = await ErrorHandler.tryRecover(error)
  
  if (!recovered) {
    console.error('无法恢复:', error)
  }
}
```

## 下一步

- [自定义适配器](/examples/custom-adapter) - 适配器示例
- [错误处理指南](/guide/error-handling) - 错误处理文档