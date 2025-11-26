# Vue Composables API

Vue 3 组合式函数的 API 参考。

## useHttp

基础 HTTP 请求 hook。

```typescript
function useHttp<T>(
  url: MaybeRef<string>,
  options?: UseHttpOptions
): UseHttpReturn<T>
```

## useRequest

高级请求管理。

```typescript
function useRequest<T>(
  options: UseRequestOptions
): UseRequestReturn<T>
```

## useResource

RESTful 资源管理。

```typescript
function useResource<T>(
  baseUrl: string,
  options?: UseResourceOptions
): UseResourceReturn<T>
```

## useForm

表单管理。

```typescript
function useForm<T>(
  options: UseFormOptions<T>
): UseFormReturn<T>
```

## usePagination

分页管理。

```typescript
function usePagination<T>(
  url: string,
  options?: UsePaginationOptions
): UsePaginationReturn<T>
```

## useInfiniteScroll

无限滚动。

```typescript
function useInfiniteScroll<T>(
  url: string,
  options?: UseInfiniteScrollOptions
): UseInfiniteScrollReturn<T>
```

## usePolling

轮询。

```typescript
function usePolling<T>(
  url: string,
  options?: UsePollingOptions
): UsePollingReturn<T>
```

## useMutation

数据变更。

```typescript
function useMutation<T, D>(
  url: string,
  options?: UseMutationOptions<T, D>
): UseMutationReturn<T, D>
```

## useWebSocket

WebSocket 连接。

```typescript
function useWebSocket(
  url: string,
  options?: UseWebSocketOptions
): UseWebSocketReturn
```

## useSSE

Server-Sent Events。

```typescript
function useSSE(
  url: string,
  options?: UseSSEOptions
): UseSSEReturn
```

## 下一步

- [Vue 集成](/packages/vue) - 使用指南
- [Vue 示例](/examples/vue-use-http) - 完整示例