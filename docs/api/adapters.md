# 适配器 API

适配器系统的 API 参考。

## BaseAdapter

所有适配器的基类。

```typescript
abstract class BaseAdapter {
  abstract name: string
  abstract isSupported(): boolean
  abstract request<T>(config: RequestConfig): Promise<Response<T>>
}
```

## FetchAdapter

基于 Fetch API 的适配器。

```typescript
class FetchAdapter extends BaseAdapter {
  name = 'fetch'
  isSupported(): boolean
  request<T>(config: RequestConfig): Promise<Response<T>>
}
```

## AxiosAdapter

基于 Axios 的适配器。

```typescript
class AxiosAdapter extends BaseAdapter {
  name = 'axios'
  isSupported(): boolean
  request<T>(config: RequestConfig): Promise<Response<T>>
}
```

## AlovaAdapter

基于 Alova 的适配器。

```typescript
class AlovaAdapter extends BaseAdapter {
  name = 'alova'
  isSupported(): boolean
  request<T>(config: RequestConfig): Promise<Response<T>>
}
```

## 注册适配器

```typescript
function registerAdapter(name: string, adapter: typeof BaseAdapter): void
```

## 下一步

- [适配器指南](/guide/adapters) - 使用指南
- [自定义适配器](/examples/custom-adapter) - 示例