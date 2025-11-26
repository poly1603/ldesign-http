# 性能监控

性能监控帮助你了解应用的HTTP请求性能，及时发现和解决问题。

## 获取统计信息

```typescript
const stats = client.getStats()

console.log('总请求数:', stats.totalRequests)
console.log('成功请求:', stats.successfulRequests)
console.log('失败请求:', stats.failedRequests)
console.log('成功率:', stats.successRate)
console.log('平均响应时间:', stats.averageResponseTime)
console.log('缓存命中率:', stats.cacheHitRate)
```

## 性能监控拦截器

```typescript
client.addRequestInterceptor((config) => {
  config._startTime = Date.now()
  return config
})

client.addResponseInterceptor(
  (response) => {
    const duration = Date.now() - response.config._startTime
    console.log(`${response.config.url} - ${duration}ms`)
    return response
  }
)
```

## 实时监控

```typescript
setInterval(() => {
  const stats = client.getStats()
  
  // 报警
  if (stats.successRate < 0.9) {
    console.warn('成功率过低:', stats.successRate)
  }
  
  if (stats.averageResponseTime > 3000) {
    console.warn('响应时间过长:', stats.averageResponseTime)
  }
}, 60000) // 每分钟检查
```

## 性能日志

```typescript
client.addResponseInterceptor((response) => {
  const metrics = {
    url: response.config.url,
    method: response.config.method,
    status: response.status,
    duration: Date.now() - response.config._startTime,
    cacheHit: response.config._cacheHit,
    timestamp: Date.now()
  }
  
  // 发送到监控服务
  sendMetrics(metrics)
  
  return response
})
```

## 下一步

- [错误处理](/guide/error-handling) - 错误监控
- [缓存管理](/guide/caching) - 缓存统计