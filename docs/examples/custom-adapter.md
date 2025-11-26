# 自定义适配器示例

自定义适配器的完整示例。

## 基础适配器

```typescript
import { BaseAdapter, RequestConfig, Response } from '@ldesign/http-core'

class CustomAdapter extends BaseAdapter {
  name = 'custom'
  
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'fetch' in window
  }
  
  async request<T>(config: RequestConfig): Promise<Response<T>> {
    const { url, method, headers, data } = config
    
    const response = await fetch(url!, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    })
    
    return {
      data: await response.json(),
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config
    }
  }
}

// 使用自定义适配器
const client = createHttpClient({
  baseURL: '/api',
  adapter: new CustomAdapter()
})
```

## 下一步

- [自定义拦截器](/examples/custom-interceptor) - 拦截器示例
- [适配器指南](/guide/adapters) - 适配器文档