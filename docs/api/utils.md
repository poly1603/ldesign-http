# 工具函数 API

工具函数的 API 参考。

## 类型守卫

### isHttpError

```typescript
function isHttpError(error: any): error is HttpError
```

### isNetworkError

```typescript
function isNetworkError(error: any): boolean
```

### isTimeoutError

```typescript
function isTimeoutError(error: any): boolean
```

### isCancelError

```typescript
function isCancelError(error: any): boolean
```

## 工具函数

### safeJsonParse

```typescript
function safeJsonParse<T>(json: string): T | null
```

### typedKeys

```typescript
function typedKeys<T extends object>(obj: T): (keyof T)[]
```

### createTypedError

```typescript
function createTypedError(type: string, message: string): TypedError
```

## 下一步

- [类型工具](/guide/type-utilities) - 使用指南