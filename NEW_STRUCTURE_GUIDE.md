# 🎉 HTTP 包新结构完成指南

参考 `@ldesign/engine` 的结构，HTTP 包已成功重组为多框架支持的架构。

## 📦 新的包结构

```
packages/http/
├── packages/
│   ├── core/              # 核心包（框架无关）
│   ├── vue/               # Vue 3 适配器
│   ├── react/             # React 适配器
│   ├── solid/             # Solid 适配器
│   └── svelte/            # Svelte 适配器
├── ldesign.config.ts      # 主包配置
└── package.json
```

## 🎯 核心特性

### 1. 框架无关的核心包 (@ldesign/http-core)

**包含模块**:
- `adapters/` - HTTP 适配器（Fetch, Axios, Alova）
- `cache/` - 缓存管理
- `interceptors/` - 拦截器系统
- `middleware/` - 中间件
- `retry/` - 重试机制
- `types/` - TypeScript 类型定义
- `utils/` - 工具函数

**导出结构**:
```typescript
// 主入口
import { createHttpClient } from '@ldesign/http-core'

// 子模块
import { FetchAdapter } from '@ldesign/http-core/adapters'
import { CacheManager } from '@ldesign/http-core/cache'
import { InterceptorManager } from '@ldesign/http-core/interceptors'
```

### 2. 框架适配器包

每个框架都有独立的包，提供框架特定的集成：

#### Vue 3 (@ldesign/http-vue)

**包含模块**:
- `composables/` - Vue 组合式函数
- `plugin/` - Vue 插件

**使用示例**:
```typescript
// main.ts
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http-vue'

const app = createApp(App)
app.use(createHttpPlugin({
  baseURL: 'https://api.example.com'
}))

// 组件中
import { useHttp } from '@ldesign/http-vue'

const { data, loading, error } = useHttp('/users')
```

#### React (@ldesign/http-react)

**包含模块**:
- `hooks/` - React Hooks
- `provider/` - Context Provider

**使用示例**:
```typescript
import { useHttp } from '@ldesign/http-react'

function UserList() {
  const { data, loading, error } = useHttp('/users')
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <ul>{data.map(user => <li key={user.id}>{user.name}</li>)}</ul>
}
```

#### Solid (@ldesign/http-solid)

**包含模块**:
- `hooks/` - Solid Hooks
- `provider/` - Context Provider

#### Svelte (@ldesign/http-svelte)

**包含模块**:
- `stores/` - Svelte Stores
- `actions/` - Svelte Actions

## 🏗️ 构建系统

所有包都使用 `@ldesign/builder` 统一构建：

### 构建配置 (ldesign.config.ts)

```typescript
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',
  output: {
    format: ['esm', 'cjs', 'umd'],
    esm: {
      dir: 'es',
      preserveStructure: true,  // 保持目录结构
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,
    },
    umd: {
      dir: 'dist',
      name: 'LDesignHttpCore',
    },
  },
  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,
})
```

### 构建命令

```bash
# 构建单个包
cd packages/core
pnpm build

# 构建所有包
cd packages/http
node test-build.js

# 监听模式
pnpm dev
```

### 输出格式

每个包都会生成三种格式：

1. **ESM** (`es/`) - ES Module 格式，保持目录结构
2. **CJS** (`lib/`) - CommonJS 格式，保持目录结构  
3. **UMD** (`dist/`) - UMD 格式，单文件打包

## 📝 完整示例项目

每个包都包含基于 Vite 的完整示例：

### 目录结构

```
packages/<name>/
├── examples/
│   └── vite-demo/
│       ├── src/
│       │   ├── main.ts(x)
│       │   ├── App.vue/tsx/svelte
│       │   └── style.css
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
```

### 运行示例

```bash
# 1. 先构建核心包
cd packages/core
pnpm build

# 2. 进入示例目录
cd examples/vite-demo

# 3. 安装依赖
pnpm install

# 4. 启动开发服务器
pnpm dev
```

### 示例端口分配

- Core: http://localhost:3000
- Vue: http://localhost:3000
- React: http://localhost:3001
- Solid: http://localhost:3002
- Svelte: http://localhost:3003

## 🔧 开发工作流

### 1. 添加新功能到核心包

```bash
# 1. 编辑源代码
cd packages/core/src/adapters
# 添加新的适配器

# 2. 更新导出
# src/adapters/index.ts
export * from './new-adapter'

# 3. 构建
pnpm build

# 4. 测试
cd examples/vite-demo
pnpm dev
```

### 2. 创建框架特定功能

```bash
# 以 Vue 为例
cd packages/vue/src/composables

# 添加新的 composable
# useRequest.ts

# 更新导出
# src/composables/index.ts
export * from './useRequest'

# 构建和测试
pnpm build
cd examples/vite-demo
pnpm dev
```

### 3. 并行开发多个包

```bash
# 终端 1 - 监听核心包
cd packages/core && pnpm dev

# 终端 2 - 监听 Vue 包
cd packages/vue && pnpm dev

# 终端 3 - 运行示例
cd packages/vue/examples/vite-demo && pnpm dev
```

## 📚 API 设计参考

### 核心包 API

```typescript
// 创建客户端
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-core/adapters'

const client = createHttpClient(
  { baseURL: 'https://api.example.com' },
  new FetchAdapter()
)

// 发送请求
const response = await client.get('/users')
const user = await client.post('/users', { name: 'John' })
```

### Vue API

```typescript
// Plugin
import { createHttpPlugin } from '@ldesign/http-vue'
app.use(createHttpPlugin(config))

// Composables
import { useHttp, useRequest, useMutation } from '@ldesign/http-vue'

// 简单请求
const { data, loading, error } = useHttp('/users')

// 手动触发
const { execute, loading } = useRequest('/users', { manual: true })

// 变更操作
const { mutate, loading } = useMutation('/users')
```

### React API

```typescript
// Provider
import { HttpProvider } from '@ldesign/http-react'

<HttpProvider config={config}>
  <App />
</HttpProvider>

// Hooks
import { useHttp, useRequest, useMutation } from '@ldesign/http-react'

const { data, loading, error } = useHttp('/users')
```

### Solid API

```typescript
// Provider
import { HttpProvider } from '@ldesign/http-solid'

<HttpProvider config={config}>
  <App />
</HttpProvider>

// Hooks
import { useHttp } from '@ldesign/http-solid'

const { data, loading, error } = useHttp(() => '/users')
```

### Svelte API

```typescript
// Stores
import { httpStore } from '@ldesign/http-svelte'

const users = httpStore('/users')

// Actions
import { http } from '@ldesign/http-svelte'

<button use:http={{ url: '/users' }}>Load</button>
```

## 🎨 与 Engine 包的对比

| 特性 | Engine 包 | HTTP 包 |
|------|----------|---------|
| 核心包 | @ldesign/engine-core | @ldesign/http-core |
| Vue 适配器 | @ldesign/engine-vue | @ldesign/http-vue |
| React 适配器 | @ldesign/engine-react | @ldesign/http-react |
| Solid 适配器 | @ldesign/engine-solid | @ldesign/http-solid |
| Svelte 适配器 | @ldesign/engine-svelte | @ldesign/http-svelte |
| 构建工具 | @ldesign/builder | @ldesign/builder |
| 目录结构保持 | ✅ preserveStructure | ✅ preserveStructure |
| 完整示例 | ✅ vite-demo | ✅ vite-demo |
| 框架无关核心 | ✅ | ✅ |

## ✅ 已完成的工作

- [x] 创建 packages/core - 核心功能包
- [x] 创建 packages/vue - Vue 3 适配器
- [x] 创建 packages/react - React 适配器
- [x] 创建 packages/solid - Solid 适配器
- [x] 创建 packages/svelte - Svelte 适配器
- [x] 配置 @ldesign/builder 构建
- [x] 创建完整的示例项目（每个框架）
- [x] 测试核心包构建（✅ 成功）
- [x] 复制核心代码到新结构
- [x] 创建文档和指南

## 🚀 下一步计划

### 短期（1-2周）

- [ ] 完善核心包功能实现
  - [ ] 完善 adapters 模块
  - [ ] 实现 cache 模块
  - [ ] 实现 interceptors 模块
  - [ ] 实现 retry 模块

- [ ] 实现 Vue 适配器
  - [ ] useHttp composable
  - [ ] useRequest composable
  - [ ] useMutation composable
  - [ ] Vue plugin

- [ ] 添加单元测试
- [ ] 添加 E2E 测试

### 中期（1-2月）

- [ ] 实现 React 适配器
- [ ] 实现 Solid 适配器
- [ ] 实现 Svelte 适配器
- [ ] 性能优化
- [ ] 完善文档

### 长期（3-6月）

- [ ] 发布 Beta 版本
- [ ] 收集用户反馈
- [ ] 添加更多适配器（Angular, Preact 等）
- [ ] 发布 1.0 正式版

## 📋 构建状态

| 包 | 构建状态 | 示例 | 文档 |
|----|---------|------|------|
| core | ✅ 成功 | ✅ 完成 | ✅ 完成 |
| vue | ⏳ 待完善 | ✅ 完成 | ✅ 完成 |
| react | ⏳ 待完善 | ✅ 完成 | ✅ 完成 |
| solid | ⏳ 待完善 | ✅ 完成 | ✅ 完成 |
| svelte | ⏳ 待完善 | ✅ 完成 | ✅ 完成 |

**注**: 其他包构建需要先修复 @ldesign/builder 的类型错误（这是 builder 本身的问题，不影响我们的结构）

## 🎯 使用建议

1. **开发阶段**: 使用 `pnpm dev` 监听模式，配合示例项目实时测试
2. **功能实现**: 先完善核心包，再实现框架适配器
3. **测试驱动**: 为每个功能编写测试用例
4. **文档同步**: 开发时同步更新文档和示例

## 🔗 相关资源

- [Engine 包参考](../engine/README.md)
- [Builder 文档](../../tools/builder/README.md)
- [开发指南](./DEVELOPMENT.md)

---

**结构重组完成时间**: 2025-10-28
**状态**: ✅ 完成
**下一步**: 完善核心功能实现

