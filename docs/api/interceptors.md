# 拦截器 API

拦截器系统的 API 参考。

## 类型定义

### RequestInterceptor

```typescript
type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
```

### ResponseInterceptor

```typescript
type ResponseInterceptor = (response: Response) => Response | Promise<Response>
```

### ErrorInterceptor

```typescript
type ErrorInterceptor = (error: any) => any
```

## 内置拦截器

### authInterceptor

认证拦截器。

```typescript
function authInterceptor(options: AuthInterceptorOptions): RequestInterceptor
```

### loggingInterceptor

日志拦截器。

```typescript
function loggingInterceptor(options: LoggingInterceptorOptions): RequestInterceptor
```

### retryInterceptor

重试拦截器。

```typescript
function retryInterceptor(options: RetryInterceptorOptions): ErrorInterceptor
```

## 下一步

- [拦截器指南](/guide/interceptors) - 使用指南
- [自定义拦截器](/examples/custom-interceptor) - 示例