# @ldesign/http 架构文档

## 概述

`@ldesign/http` 是一个功能强大的跨框架HTTP请求库系统，采用单核心多适配器的架构设计。

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                  Framework Adapters                         │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│   Vue    │  React   │  Svelte  │  Solid   │  ... (12+)     │
└──────────┴──────────┴──────────┴──────────┴─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              @ldesign/http-core (核心库)                     │
├─────────────────────────────────────────────────────────────┤
│  • HttpClient (核心客户端)                                   │
│  • Interceptors (拦截器系统)                                 │
│  • Cache Manager (缓存管理)                                  │
│  • Retry Manager (重试机制)                                  │
│  • Adapters (Axios/Fetch/Alova)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              HTTP Transport Layer                           │
│           (Axios / Fetch / XMLHttpRequest)                  │
└─────────────────────────────────────────────────────────────┘
```

## 包结构

### 核心包 (@ldesign/http-core)

框架无关的核心HTTP客户端实现

**主要功能:**
- `HttpClient` - 主客户端类
- `AxiosAdapter` - Axios适配器
- `CacheManager` - 缓存管理器
- `RetryManager` - 重试管理器
- 拦截器系统
- 类型定义

**目录结构:**
```
core/
├── src/
│   ├── HttpClient.ts       # 核心客户端
│   ├── types.ts            # 类型定义
│   ├── adapters/           # 适配器
│   │   └── AxiosAdapter.ts
│   ├── cache/              # 缓存系统
│   │   ├── CacheManager.ts
│   │   └── MemoryCacheStorage.ts
│   └── retry/              # 重试机制
│       └── RetryManager.ts
├── package.json
├── tsconfig.json
└── builder.config.ts
```

### 框架适配包

为各个框架提供专用API

#### Vue (@ldesign/http-vue)

**特性:**
- `useHttp` / `useGet` / `usePost` 等 composables
- `HttpPlugin` Vue插件
- 依赖注入支持
- 响应式状态管理

**使用示例:**
```vue
<script setup>
import { useGet } from '@ldesign/http-vue'

const { data, loading, error } = useGet('/api/users', { immediate: true })
</script>
```

#### React (@ldesign/http-react)

**特性:**
- `useHttp` / `useGet` / `usePost` 等 hooks
- `HttpProvider` Context Provider
- 状态管理

**使用示例:**
```tsx
import { useGet } from '@ldesign/http-react'

function UserList() {
  const { data, loading, error } = useGet('/api/users', { immediate: true })
  
  if (loading) return <div>Loading...</div>
  return <div>{JSON.stringify(data)}</div>
}
```

#### 其他框架适配包

- `@ldesign/http-svelte` - Svelte stores
- `@ldesign/http-solid` - Solid signals
- `@ldesign/http-preact` - Preact hooks
- `@ldesign/http-angular` - Angular services
- `@ldesign/http-lit` - Lit reactive controllers
- `@ldesign/http-qwik` - Qwik loaders
- `@ldesign/http-alpinejs` - Alpine.js magic properties
- `@ldesign/http-astro` - Astro components
- `@ldesign/http-nextjs` - Next.js (基于React)
- `@ldesign/http-nuxtjs` - Nuxt (基于Vue)
- `@ldesign/http-remix` - Remix (基于React)
- `@ldesign/http-sveltekit` - SvelteKit (基于Svelte)

## 设计原则

### 1. 单一核心原则

所有框架适配包都依赖同一个核心包 `@ldesign/http-core`，确保:
- 核心功能的一致性
- 代码复用和维护性
- 统一的API设计

### 2. 渐进式增强

- **核心包**: 提供完整的HTTP客户端功能，可独立使用
- **框架包**: 在核心功能之上添加框架特定的便捷API
- **用户**: 可以只使用核心包,也可以使用框架包

### 3. 框架特性优先

每个框架包充分利用该框架的特性:
- Vue: Composition API + 响应式系统
- React: Hooks + Context
- Svelte: Stores
- Solid: Signals
- Angular: Services + DI

### 4. TypeScript First

- 所有包都用TypeScript编写
- 完整的类型定义
- 泛型支持

## 构建系统

使用 `@ldesign/builder` 统一构建所有包:

```typescript
// builder.config.ts
export default defineConfig({
  input: 'src/index.ts',
  output: {
    format: ['esm', 'cjs'],
    dir: {
      esm: 'es',
      cjs: 'lib',
    },
  },
  dts: {
    enabled: true,
  },
  external: ['vue', 'react', '@ldesign/http-core'],
})
```

**输出:**
- ES Module: `es/index.js`
- CommonJS: `lib/index.cjs`
- TypeScript声明: `es/index.d.ts`

## 开发工作流

### 1. 安装依赖

```bash
pnpm install
```

### 2. 开发模式

```bash
# 开发核心包
cd packages/core
pnpm dev

# 开发框架包
cd packages/vue
pnpm dev
```

### 3. 构建

```bash
# 构建所有包
pnpm tsx scripts/build-all.ts

# 构建单个包
cd packages/core
pnpm build
```

### 4. 测试

```bash
# 测试所有包
pnpm -r test

# 测试单个包
cd packages/vue
pnpm test
```

## 扩展

### 添加新框架支持

1. 在 `scripts/create-framework-packages.ts` 中添加框架配置
2. 运行脚本生成包骨架
3. 实现框架特定功能
4. 添加测试和文档

### 添加新适配器

1. 在 `core/src/adapters/` 中创建新适配器
2. 实现 `RequestAdapter` 接口
3. 导出适配器
4. 更新文档

## 发布流程

```bash
# 1. 更新版本
pnpm changeset

# 2. 构建所有包
pnpm tsx scripts/build-all.ts

# 3. 发布
pnpm changeset publish
```

## 维护指南

### 核心包更新

当更新核心包时:
1. 确保向后兼容
2. 更新所有框架包的依赖版本
3. 运行所有测试
4. 更新文档

### 框架包更新

当更新框架包时:
1. 保持与核心包API一致
2. 遵循框架最佳实践
3. 添加测试覆盖
4. 更新README

## 性能考虑

- **Tree-shaking**: 使用ES Module输出支持
- **Bundle大小**: 核心包 < 60KB (gzipped)
- **缓存**: 智能缓存减少重复请求
- **重试**: 指数退避避免服务器压力

## 未来规划

- [ ] 添加更多适配器 (Fetch API、XMLHttpRequest)
- [ ] GraphQL支持
- [ ] WebSocket支持
- [ ] 更多缓存策略
- [ ] 性能监控
- [ ] 请求并发控制
- [ ] 离线支持
