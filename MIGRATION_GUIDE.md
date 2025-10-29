# HTTP 包迁移指南

## 📋 概述

本指南帮助你从旧版本的 `@ldesign/http` 迁移到重构后的新版本。

**重构版本**: v0.2.0  
**重构日期**: 2025-10-29

---

## 🎯 主要变更

### 1. 包结构重组

#### 旧结构 (v0.1.x)
```
@ldesign/http
├── @ldesign/http-core
├── @ldesign/http-adapters
├── @ldesign/http-interceptors
├── @ldesign/http-features
├── @ldesign/http-utils
├── @ldesign/http-vue
└── ... (8+ 个重复包)
```

#### 新结构 (v0.2.0)
```
@ldesign/http
├── @ldesign/http-core      # 核心包 (框架无关)
├── @ldesign/http-react     # React 适配器
├── @ldesign/http-vue       # Vue 适配器
├── @ldesign/http-solid     # Solid 适配器
└── @ldesign/http-svelte    # Svelte 适配器
```

---

## 📦 安装变更

### 旧版本安装

```bash
# 旧版本需要安装多个包
pnpm add @ldesign/http-core
pnpm add @ldesign/http-adapters
pnpm add @ldesign/http-interceptors
pnpm add @ldesign/http-vue  # 如果使用 Vue
```

### 新版本安装

```bash
# 新版本只需安装核心包
pnpm add @ldesign/http-core

# 如果使用框架适配器
pnpm add @ldesign/http-vue    # Vue
pnpm add @ldesign/http-react  # React
pnpm add @ldesign/http-solid  # Solid
pnpm add @ldesign/http-svelte # Svelte
```

---

## 🔄 导入路径变更

### 1. 核心功能导入

#### ❌ 旧版本
```typescript
// 从多个包导入
import { HttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-adapters'
import { InterceptorManager } from '@ldesign/http-interceptors'
import { CacheManager } from '@ldesign/http-features'
```

#### ✅ 新版本
```typescript
// 从单一核心包导入
import { 
  HttpClient,
  FetchAdapter,
  InterceptorManager,
  CacheManager
} from '@ldesign/http-core'
```

### 2. 适配器导入

#### ❌ 旧版本
```typescript
import { FetchAdapter } from '@ldesign/http-adapters'
import { AxiosAdapter } from '@ldesign/http-adapters'
```

#### ✅ 新版本
```typescript
// 方式 1: 从核心包导入
import { FetchAdapter, AxiosAdapter } from '@ldesign/http-core'

// 方式 2: 从子模块导入 (更好的 tree-shaking)
import { FetchAdapter } from '@ldesign/http-core/adapters'
import { AxiosAdapter } from '@ldesign/http-core/adapters'
```

### 3. Vue 适配器导入

#### ❌ 旧版本
```typescript
import { useHttp } from '@ldesign/http-vue'
import type { RequestState } from '@ldesign/http-core/types/vue'
```

#### ✅ 新版本
```typescript
import { useHttp } from '@ldesign/http-vue'
import type { RequestState } from '@ldesign/http-vue'
```

---

## 🛠️ API 变更

### 1. 创建 HTTP 客户端

#### ❌ 旧版本
```typescript
import { HttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-adapters'

const client = new HttpClient({
  adapter: new FetchAdapter()
})
```

#### ✅ 新版本
```typescript
import { createHttpClient } from '@ldesign/http-core'

// 方式 1: 使用工厂函数 (推荐)
const client = createHttpClient({
  adapter: 'fetch'  // 自动创建适配器
})

// 方式 2: 手动创建适配器
import { FetchAdapter } from '@ldesign/http-core'
const client = createHttpClient({
  adapter: new FetchAdapter()
})
```

### 2. 使用拦截器

#### ❌ 旧版本
```typescript
import { InterceptorManager } from '@ldesign/http-interceptors'

const interceptors = new InterceptorManager()
client.interceptors.request.use(config => config)
```

#### ✅ 新版本
```typescript
// 拦截器已内置在核心包中
client.interceptors.request.use(config => config)

// 或使用便捷方法
client.addRequestInterceptor(config => config)
```

### 3. Vue Composables

#### ❌ 旧版本
```typescript
import { useHttp } from '@ldesign/http-vue'
import type { UseRequestOptions } from '@ldesign/http-core/types/vue'

const { data, loading, error } = useHttp<User>('/api/user', {
  immediate: true
})
```

#### ✅ 新版本
```typescript
import { useHttp } from '@ldesign/http-vue'
import type { UseRequestOptions } from '@ldesign/http-vue'

// API 保持不变
const { data, loading, error } = useHttp<User>('/api/user', {
  immediate: true
})
```

---

## 📝 类型定义变更

### 1. 核心类型

#### ❌ 旧版本
```typescript
import type { RequestConfig } from '@ldesign/http-core'
import type { HttpAdapter } from '@ldesign/http-adapters'
import type { CacheConfig } from '@ldesign/http-features'
```

#### ✅ 新版本
```typescript
// 所有类型从核心包导入
import type { 
  RequestConfig,
  HttpAdapter,
  CacheConfig
} from '@ldesign/http-core'
```

### 2. Vue 类型

#### ❌ 旧版本
```typescript
import type { RequestState } from '@ldesign/http-core/types/vue'
import type { UseRequestOptions } from '@ldesign/http-vue'
```

#### ✅ 新版本
```typescript
// 所有 Vue 类型从 Vue 包导入
import type { 
  RequestState,
  UseRequestOptions
} from '@ldesign/http-vue'
```

---

## 🔧 配置变更

### package.json 依赖更新

#### ❌ 旧版本
```json
{
  "dependencies": {
    "@ldesign/http-core": "^0.1.0",
    "@ldesign/http-adapters": "^0.1.0",
    "@ldesign/http-interceptors": "^0.1.0",
    "@ldesign/http-features": "^0.1.0",
    "@ldesign/http-vue": "^0.1.0"
  }
}
```

#### ✅ 新版本
```json
{
  "dependencies": {
    "@ldesign/http-core": "^0.2.0",
    "@ldesign/http-vue": "^0.2.0"
  }
}
```

---

## 🚀 迁移步骤

### 步骤 1: 更新依赖

```bash
# 1. 卸载旧包
pnpm remove @ldesign/http-adapters
pnpm remove @ldesign/http-interceptors
pnpm remove @ldesign/http-features
pnpm remove @ldesign/http-utils

# 2. 更新核心包
pnpm update @ldesign/http-core@latest

# 3. 更新框架适配器 (如果使用)
pnpm update @ldesign/http-vue@latest
```

### 步骤 2: 更新导入语句

使用查找替换功能批量更新:

```bash
# 替换适配器导入
@ldesign/http-adapters → @ldesign/http-core

# 替换拦截器导入
@ldesign/http-interceptors → @ldesign/http-core

# 替换特性导入
@ldesign/http-features → @ldesign/http-core

# 替换工具导入
@ldesign/http-utils → @ldesign/http-core

# 替换 Vue 类型导入
@ldesign/http-core/types/vue → @ldesign/http-vue
```

### 步骤 3: 更新类型导入

```typescript
// 查找所有这样的导入
import type { ... } from '@ldesign/http-core/types/vue'

// 替换为
import type { ... } from '@ldesign/http-vue'
```

### 步骤 4: 测试应用

```bash
# 运行类型检查
pnpm type-check

# 运行测试
pnpm test

# 运行应用
pnpm dev
```

---

## ⚠️ 破坏性变更

### 1. 删除的包

以下包已被删除,功能已合并到核心包:

- ❌ `@ldesign/http-adapters` → ✅ `@ldesign/http-core`
- ❌ `@ldesign/http-interceptors` → ✅ `@ldesign/http-core`
- ❌ `@ldesign/http-features` → ✅ `@ldesign/http-core`
- ❌ `@ldesign/http-utils` → ✅ `@ldesign/http-core`
- ❌ `@ldesign/http-devtools` → ✅ `@ldesign/http-core`
- ❌ `@ldesign/http-presets` → ✅ `@ldesign/http-core`

### 2. 移除的导出

- ❌ `@ldesign/http-core/types/vue` - Vue 类型已移到 `@ldesign/http-vue`

### 3. API 保持兼容

✅ 所有公共 API 保持向后兼容,只是导入路径发生变化

---

## 💡 最佳实践

### 1. 使用子模块导入优化包体积

```typescript
// ❌ 不推荐: 导入整个核心包
import { FetchAdapter } from '@ldesign/http-core'

// ✅ 推荐: 从子模块导入
import { FetchAdapter } from '@ldesign/http-core/adapters'
import { CacheManager } from '@ldesign/http-core/cache'
import { RetryManager } from '@ldesign/http-core/retry'
```

### 2. 使用工厂函数

```typescript
// ✅ 推荐: 使用工厂函数
import { createHttpClient } from '@ldesign/http-core'

const client = createHttpClient({
  adapter: 'fetch',
  baseURL: 'https://api.example.com',
  timeout: 5000
})
```

### 3. 类型安全

```typescript
// ✅ 使用类型定义
import type { RequestConfig, ResponseData } from '@ldesign/http-core'

interface User {
  id: number
  name: string
}

const config: RequestConfig = {
  url: '/api/user',
  method: 'GET'
}

const response: ResponseData<User> = await client.request(config)
```

---

## 🆘 常见问题

### Q1: 为什么要重构包结构?

**A**: 旧版本存在严重的包重复问题,导致:
- 维护困难
- 包体积大
- 依赖混乱
- 用户困惑

新版本通过合并核心功能到单一包,解决了这些问题。

### Q2: 迁移会影响现有功能吗?

**A**: 不会。所有公共 API 保持向后兼容,只是导入路径发生变化。

### Q3: 需要修改多少代码?

**A**: 大部分情况下只需要批量替换导入路径,实际业务逻辑无需修改。

### Q4: 如何验证迁移成功?

**A**: 
1. 运行 `pnpm type-check` 检查类型错误
2. 运行 `pnpm test` 运行测试
3. 运行 `pnpm build` 构建应用
4. 手动测试关键功能

---

## 📚 相关文档

- [重构计划](./REFACTORING_PLAN.md)
- [重构完成报告](./REFACTORING_COMPLETED.md)
- [API 文档](./docs/API.md)
- [示例代码](./examples/)

---

## 🤝 获取帮助

如果在迁移过程中遇到问题:

1. 查看 [常见问题](#常见问题)
2. 查看 [GitHub Issues](https://github.com/ldesign/http/issues)
3. 提交新的 Issue

---

**祝迁移顺利!** 🎉

