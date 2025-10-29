# HTTP 包重构总结

## 📊 当前状态分析

### 问题概述

经过详细分析,`packages/http/` 目录存在以下主要问题:

1. **结构混乱** - 存在两套并行的包结构
   - `packages/core/` vs `packages/http-core/`
   - `packages/vue/` vs `packages/http-vue/`
   - 其他 7 个 `http-*` 前缀的重复包

2. **职责不清** - 框架无关代码和框架特定代码混在一起
   - `src/` 目录包含所有功能
   - Vue 特定代码在 `src/vue/` 和 `packages/vue/` 两处

3. **文档过多** - 23+ 个重复或过时的文档文件

4. **维护困难** - 重复代码导致维护成本高

---

## 🎯 重构目标

### 理想架构

```
packages/http/
├── packages/
│   ├── core/          # 核心包 (框架无关)
│   ├── react/         # React 适配器
│   ├── vue/           # Vue 适配器
│   ├── solid/         # Solid 适配器
│   └── svelte/        # Svelte 适配器
├── src/
│   ├── index.ts       # 主入口 (重新导出)
│   └── index.core.ts  # 核心入口 (重新导出)
├── docs/              # 统一文档
├── examples/          # 示例项目
└── scripts/           # 构建脚本
```

### 核心原则

1. **单一职责** - 每个包只负责一个领域
2. **框架分离** - 核心包完全框架无关
3. **清晰依赖** - 框架适配器依赖核心包
4. **零重复** - 消除所有重复代码

---

## 📋 重构计划

### 阶段一: 核心包整合 (2-3天)

**目标**: 将所有框架无关的代码合并到 `packages/core/`

**操作**:
1. 合并 `packages/http-*` 包到 `packages/core/src/`
2. 移动 `src/` 中的核心代码到 `packages/core/src/`
3. 重组目录结构

**涉及文件**: 100+ 个文件

**详细清单**: 见 [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)

---

### 阶段二: 框架适配器整合 (1-2天)

**目标**: 整合框架特定代码

**操作**:
1. 合并 `src/vue/` 和 `packages/http-vue/` 到 `packages/vue/`
2. 增强 React、Solid、Svelte 适配器

**涉及文件**: 20+ 个文件

---

### 阶段三: 删除重复包 (1天)

**目标**: 删除所有重复和过时的代码

**操作**:
1. 删除 8 个 `http-*` 包
2. 删除已迁移的 `src/` 代码
3. 删除 23+ 个过时文档
4. 删除临时脚本

**涉及文件**: 150+ 个文件/目录

---

### 阶段四: 测试验证 (2-3天)

**目标**: 确保所有功能正常

**操作**:
1. 运行所有测试
2. 验证构建产物
3. 测试示例项目
4. 性能回归测试

---

### 阶段五: 文档更新 (1-2天)

**目标**: 提供清晰的文档

**操作**:
1. 更新主 README
2. 编写迁移指南
3. 更新 API 文档
4. 添加示例代码

---

## 🗂️ 核心包结构设计

### 目录组织

```
packages/core/src/
├── client/              # HTTP 客户端
│   ├── HttpClient.ts
│   ├── factory.ts
│   ├── operations.ts
│   └── monitoring.ts
│
├── adapters/            # 适配器系统
│   ├── base.ts
│   ├── fetch.ts
│   ├── axios.ts
│   ├── alova.ts
│   └── factory.ts
│
├── interceptors/        # 拦截器
│   ├── manager.ts
│   ├── common.ts
│   ├── auth.ts
│   └── logging.ts
│
├── cache/               # 缓存系统
│   ├── CacheManager.ts
│   ├── strategies/
│   └── storage/
│
├── retry/               # 重试机制
│   ├── RetryManager.ts
│   └── strategies/
│
├── features/            # 高级特性
│   ├── circuit-breaker.ts
│   ├── rate-limit.ts
│   ├── concurrency.ts
│   ├── deduplication.ts
│   ├── cancellation/
│   ├── batch/
│   ├── mock.ts
│   ├── graphql.ts
│   ├── sse.ts
│   └── websocket.ts
│
├── devtools/            # 开发工具
│   ├── DevTools.ts
│   ├── logger.ts
│   └── monitor.ts
│
├── presets/             # 预设配置
│   ├── restful.ts
│   ├── graphql.ts
│   └── microservice.ts
│
├── types/               # 类型定义
│   ├── base.ts
│   ├── client.ts
│   ├── adapter.ts
│   └── index.ts
│
├── utils/               # 工具函数
│   ├── error.ts
│   ├── helpers.ts
│   └── validators.ts
│
└── index.ts             # 主入口
```

---

## 🔌 框架适配器设计

### React 适配器

```typescript
// packages/react/src/hooks/
- useHttp.ts              // 基础 HTTP 请求
- useQuery.ts             // 查询数据
- useMutation.ts          // 修改数据
- usePagination.ts        // 分页
- useInfiniteScroll.ts    // 无限滚动
- usePolling.ts           // 轮询
- useWebSocket.ts         // WebSocket
- useSSE.ts               // Server-Sent Events
```

### Vue 适配器

```typescript
// packages/vue/src/composables/
- useHttp.ts              // 基础 HTTP 请求
- useQuery.ts             // 查询数据
- useMutation.ts          // 修改数据
- usePagination.ts        // 分页
- useInfiniteScroll.ts    // 无限滚动
- usePolling.ts           // 轮询
- useWebSocket.ts         // WebSocket
- useSSE.ts               // Server-Sent Events
```

### Solid 适配器

```typescript
// packages/solid/src/hooks/
- createHttp.ts           // 基础 HTTP 请求
- createQuery.ts          // 查询数据
- createMutation.ts       // 修改数据
- createPagination.ts     // 分页
```

### Svelte 适配器

```typescript
// packages/svelte/src/stores/
- httpStore.ts            // HTTP 状态存储
- queryStore.ts           // 查询存储
- mutationStore.ts        // 修改存储
```

---

## 📦 包依赖关系

```
@ldesign/http (主包)
  └── 重新导出所有子包

@ldesign/http-core (核心包)
  └── 零依赖,框架无关

@ldesign/http-react
  └── 依赖: @ldesign/http-core, react

@ldesign/http-vue
  └── 依赖: @ldesign/http-core, vue

@ldesign/http-solid
  └── 依赖: @ldesign/http-core, solid-js

@ldesign/http-svelte
  └── 依赖: @ldesign/http-core, svelte
```

---

## 🚀 实施步骤

### 1. 准备阶段

```bash
# 创建备份分支
git checkout -b backup/before-refactoring
git push origin backup/before-refactoring

# 创建重构分支
git checkout -b refactor/http-structure
```

### 2. 执行重构

```bash
# 运行自动化脚本 (推荐先 dry-run)
node scripts/refactor.js --dry-run

# 确认无误后执行
node scripts/refactor.js
```

### 3. 手动调整

- 检查并修复导入路径
- 合并重复代码
- 更新配置文件

### 4. 测试验证

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm -r build

# 运行测试
pnpm -r test

# 运行示例
cd examples/react && pnpm dev
cd examples/vue3 && pnpm dev
```

### 5. 文档更新

- 更新 README.md
- 编写迁移指南
- 更新 API 文档

### 6. 发布

```bash
# 更新版本
pnpm version minor

# 发布
pnpm publish -r
```

---

## 📊 预期成果

### 代码质量
- ✅ 消除 100+ 个重复文件
- ✅ 清晰的职责分离
- ✅ 统一的代码风格
- ✅ 更好的可维护性

### 包体积
- ✅ 核心包: ~30KB (gzipped)
- ✅ React 适配器: ~5KB (gzipped)
- ✅ Vue 适配器: ~5KB (gzipped)
- ✅ Solid 适配器: ~5KB (gzipped)
- ✅ Svelte 适配器: ~5KB (gzipped)

### 开发体验
- ✅ 更清晰的 API
- ✅ 更好的类型提示
- ✅ 更完善的文档
- ✅ 更多的示例

---

## ⚠️ 注意事项

### 破坏性变更

重构会导致以下破坏性变更:

1. **导入路径变化**
   ```typescript
   // 旧
   import { createHttpClient } from '@ldesign/http'
   
   // 新
   import { createHttpClient } from '@ldesign/http-core'
   // 或
   import { createHttpClient } from '@ldesign/http/core'
   ```

2. **包名变化**
   - `@ldesign/http-adapters` → `@ldesign/http-core/adapters`
   - `@ldesign/http-vue` → `@ldesign/http-vue` (保持不变)

### 迁移建议

1. 提供详细的迁移指南
2. 保留旧版本支持一段时间
3. 提供自动化迁移工具

---

## 📚 相关文档

- [详细重构方案](./REFACTORING_PLAN.md)
- [文件迁移清单](./MIGRATION_CHECKLIST.md)
- [架构图](见上方 Mermaid 图表)

---

## 🎯 下一步

1. **审查方案** - 团队审查重构方案
2. **确认时间** - 确定重构时间表
3. **开始执行** - 按阶段执行重构
4. **持续跟踪** - 跟踪进度和问题


