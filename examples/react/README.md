# React 示例

这个示例展示了如何在 React 应用中使用 @ldesign/http。

## 安装依赖

```bash
pnpm install
```

## 运行示例

```bash
pnpm dev
```

## 功能特性

- ✅ React Hooks 集成
- ✅ useHttp 自定义 Hook
- ✅ 请求状态管理
- ✅ 错误处理
- ✅ 加载状态
- ✅ 缓存和重试
- ✅ 表单提交
- ✅ 文件上传

## 目录结构

```
react/
├── src/
│   ├── App.tsx              # 主应用组件
│   ├── hooks/
│   │   ├── useHttp.ts      # HTTP 客户端 Hook
│   │   ├── useRequest.ts   # 请求管理 Hook
│   │   └── useMutation.ts  # 数据变更 Hook
│   ├── components/
│   │   ├── UserList.tsx    # 用户列表组件
│   │   ├── UserForm.tsx    # 用户表单组件
│   │   └── FileUpload.tsx  # 文件上传组件
│   └── main.tsx            # 入口文件
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 使用示例

### 基础请求

```typescript
import { useRequest } from './hooks/useRequest'

function UserList() {
  const { data, loading, error } = useRequest<User[]>('/users')

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>

  return (
    <ul>
      {data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### 数据变更

```typescript
import { useMutation } from './hooks/useMutation'

function UserForm() {
  const { mutate, loading, error } = useMutation<User>('/users', {
    method: 'POST',
    onSuccess: (data) => {
      console.log('创建成功:', data)
    }
  })

  const handleSubmit = (formData) => {
    mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段 */}
      <button type="submit" disabled={loading}>
        {loading ? '提交中...' : '提交'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  )
}
```

## 相关链接

- [React 官方文档](https://react.dev/)
- [@ldesign/http 文档](/README.md)

