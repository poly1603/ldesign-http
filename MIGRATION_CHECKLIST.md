# HTTP 包重构迁移清单

## 📋 总览

本文档详细列出了重构过程中需要移动、合并或删除的所有文件和目录。

---

## 🗂️ 文件迁移清单

### 阶段一: 核心包整合

#### 1. 适配器 (Adapters)

**源位置 → 目标位置**

```
✅ src/adapters/base.ts              → packages/core/src/adapters/base.ts
✅ src/adapters/fetch.ts             → packages/core/src/adapters/fetch.ts
✅ src/adapters/axios.ts             → packages/core/src/adapters/axios.ts
✅ src/adapters/alova.ts             → packages/core/src/adapters/alova.ts
✅ src/adapters/factory.ts           → packages/core/src/adapters/factory.ts
✅ src/adapters/index.ts             → packages/core/src/adapters/index.ts

✅ packages/http-adapters/src/*      → packages/core/src/adapters/ (合并)
```

**操作**: 合并重复代码,保留最新实现

---

#### 2. 拦截器 (Interceptors)

**源位置 → 目标位置**

```
✅ src/interceptors/manager.ts       → packages/core/src/interceptors/manager.ts
✅ src/interceptors/common.ts        → packages/core/src/interceptors/common.ts
✅ src/interceptors/middleware.ts    → packages/core/src/interceptors/middleware.ts
✅ src/interceptors/index.ts         → packages/core/src/interceptors/index.ts

✅ packages/http-interceptors/src/*  → packages/core/src/interceptors/ (合并)
```

**操作**: 合并拦截器实现,统一接口

---

#### 3. 缓存系统 (Cache)

**源位置 → 目标位置**

```
✅ src/utils/cache.ts                → packages/core/src/cache/CacheManager.ts
✅ src/utils/cache-lru-optimized.ts  → packages/core/src/cache/strategies/LRU.ts
✅ src/utils/cache-storage.ts        → packages/core/src/cache/storage/index.ts
✅ src/utils/cache-strategies.ts     → packages/core/src/cache/strategies/index.ts
✅ src/utils/cache-bloom-filter.ts   → packages/core/src/cache/filters/BloomFilter.ts
✅ src/features/cache.ts             → packages/core/src/cache/middleware.ts
```

**操作**: 重组缓存系统,创建清晰的目录结构

---

#### 4. 重试机制 (Retry)

**源位置 → 目标位置**

```
✅ src/features/retry.ts             → packages/core/src/retry/RetryManager.ts
✅ src/utils/smartRetry.ts           → packages/core/src/retry/strategies/SmartRetry.ts
✅ src/interceptors/common.ts        → packages/core/src/retry/interceptor.ts (提取重试部分)
```

**操作**: 整合重试相关代码

---

#### 5. 特性功能 (Features)

**源位置 → 目标位置**

```
✅ src/features/circuit-breaker.ts   → packages/core/src/features/circuit-breaker.ts
✅ src/features/graphql.ts           → packages/core/src/features/graphql.ts
✅ src/features/mock.ts              → packages/core/src/features/mock.ts
✅ src/features/recorder.ts          → packages/core/src/features/recorder.ts
✅ src/features/request-replay.ts    → packages/core/src/features/request-replay.ts
✅ src/features/response-validator.ts → packages/core/src/features/response-validator.ts
✅ src/features/sse.ts               → packages/core/src/features/sse.ts
✅ src/features/websocket.ts         → packages/core/src/features/websocket.ts

✅ packages/http-features/src/*      → packages/core/src/features/ (合并)
```

**操作**: 保留所有特性,合并重复实现

---

#### 6. 工具函数 (Utils)

**源位置 → 目标位置**

```
✅ src/utils/error.ts                → packages/core/src/utils/error.ts
✅ src/utils/error-analyzer.ts       → packages/core/src/utils/error-analyzer.ts
✅ src/utils/error-recovery.ts       → packages/core/src/utils/error-recovery.ts
✅ src/utils/helpers.ts              → packages/core/src/utils/helpers.ts
✅ src/utils/logger.ts               → packages/core/src/utils/logger.ts
✅ src/utils/debug-logger.ts         → packages/core/src/utils/debug-logger.ts
✅ src/utils/debugger.ts             → packages/core/src/utils/debugger.ts
✅ src/utils/monitor.ts              → packages/core/src/utils/monitor.ts
✅ src/utils/monitor-compact.ts      → packages/core/src/utils/monitor-compact.ts
✅ src/utils/network.ts              → packages/core/src/utils/network.ts
✅ src/utils/transformer.ts          → packages/core/src/utils/transformer.ts
✅ src/utils/upload.ts               → packages/core/src/utils/upload.ts
✅ src/utils/download.ts             → packages/core/src/utils/download.ts
✅ src/utils/compressor.ts           → packages/core/src/utils/compressor.ts
✅ src/utils/signature.ts            → packages/core/src/utils/signature.ts

✅ packages/http-utils/src/*         → packages/core/src/utils/ (合并)
```

**操作**: 整理工具函数,删除重复代码

---

#### 7. 并发控制 (Concurrency)

**源位置 → 目标位置**

```
✅ src/utils/concurrency.ts          → packages/core/src/features/concurrency.ts
✅ src/utils/dedup-manager.ts        → packages/core/src/features/deduplication.ts
✅ src/utils/request-dedup.ts        → packages/core/src/features/deduplication.ts (合并)
✅ src/utils/rate-limit.ts           → packages/core/src/features/rate-limit.ts
✅ src/utils/throttle-debounce.ts    → packages/core/src/utils/throttle-debounce.ts
✅ src/utils/pool.ts                 → packages/core/src/features/pool.ts
✅ src/utils/priority.ts             → packages/core/src/features/priority.ts
```

**操作**: 将并发控制相关功能移到 features

---

#### 8. 取消管理 (Cancellation)

**源位置 → 目标位置**

```
✅ src/utils/cancel.ts               → packages/core/src/features/cancellation/CancelManager.ts
✅ src/utils/cancel-token.ts         → packages/core/src/features/cancellation/CancelToken.ts
✅ src/utils/cancel-manager-enhanced.ts → packages/core/src/features/cancellation/EnhancedManager.ts
```

**操作**: 创建独立的取消管理模块

---

#### 9. 批处理 (Batch)

**源位置 → 目标位置**

```
✅ src/utils/batch.ts                → packages/core/src/features/batch/BatchManager.ts
✅ src/utils/batch-optimizer.ts      → packages/core/src/features/batch/Optimizer.ts
```

**操作**: 整合批处理功能

---

#### 10. 内存优化 (Memory)

**源位置 → 目标位置**

```
✅ src/utils/memory.ts               → packages/core/src/utils/memory.ts
✅ src/utils/memory-optimized.ts     → packages/core/src/utils/memory-optimized.ts
✅ src/utils/regex-cache.ts          → packages/core/src/utils/regex-cache.ts
```

**操作**: 保留内存优化工具

---

#### 11. 离线支持 (Offline)

**源位置 → 目标位置**

```
✅ src/utils/offline.ts              → packages/core/src/features/offline.ts
✅ src/utils/warmup.ts               → packages/core/src/features/warmup.ts
```

**操作**: 移到特性目录

---

#### 12. 追踪和监控 (Tracing)

**源位置 → 目标位置**

```
✅ src/utils/trace.ts                → packages/core/src/devtools/trace.ts
✅ src/utils/trace-span.ts           → packages/core/src/devtools/trace-span.ts
```

**操作**: 移到开发工具目录

---

#### 13. 开发工具 (DevTools)

**源位置 → 目标位置**

```
✅ src/devtools/index.ts             → packages/core/src/devtools/DevTools.ts
✅ packages/http-devtools/src/*      → packages/core/src/devtools/ (合并)
```

**操作**: 整合开发工具

---

#### 14. 预设配置 (Presets)

**源位置 → 目标位置**

```
✅ src/presets/index.ts              → packages/core/src/presets/index.ts
✅ packages/http-presets/src/*       → packages/core/src/presets/ (合并)
```

**操作**: 合并预设配置

---

#### 15. 类型定义 (Types)

**源位置 → 目标位置**

```
✅ src/types/base.ts                 → packages/core/src/types/base.ts
✅ src/types/brand.ts                → packages/core/src/types/brand.ts
✅ src/types/safe.ts                 → packages/core/src/types/safe.ts
✅ src/types/utils.ts                → packages/core/src/types/utils.ts
✅ src/types/index.ts                → packages/core/src/types/index.ts
❌ src/types/vue.ts                  → 删除 (移到 packages/vue/)
```

**操作**: 保留框架无关的类型,删除框架特定类型

---

#### 16. 核心客户端 (Core Client)

**源位置 → 目标位置**

```
✅ src/client.ts                     → packages/core/src/client/HttpClient.ts
✅ src/client-operations.ts          → packages/core/src/client/operations.ts
✅ src/client-monitoring.ts          → packages/core/src/client/monitoring.ts
✅ src/factory.ts                    → packages/core/src/client/factory.ts
✅ src/core/interceptor-processor.ts → packages/core/src/client/interceptor-processor.ts
✅ src/core/request-executor.ts      → packages/core/src/client/request-executor.ts
```

**操作**: 重组客户端代码结构

---

#### 17. 引擎 (Engine)

**源位置 → 目标位置**

```
✅ src/engine/index.ts               → packages/core/src/engine/index.ts
✅ src/engine/plugin.ts              → packages/core/src/engine/plugin.ts
```

**操作**: 保留引擎系统

---

### 阶段二: 框架适配器整合

#### 1. Vue 适配器

**源位置 → 目标位置**

```
✅ src/vue/index.ts                  → packages/vue/src/index.ts
✅ src/vue/plugin.ts                 → packages/vue/src/plugin/index.ts
✅ src/vue/useHttp.ts                → packages/vue/src/composables/useHttp.ts
✅ src/vue/useBasicHttp.ts           → packages/vue/src/composables/useBasicHttp.ts
✅ src/vue/useHttpStandalone.ts      → packages/vue/src/composables/useHttpStandalone.ts
✅ src/vue/useQuery.ts               → packages/vue/src/composables/useQuery.ts
✅ src/vue/useMutation.ts            → packages/vue/src/composables/useMutation.ts
✅ src/vue/usePagination.ts          → packages/vue/src/composables/usePagination.ts
✅ src/vue/useInfiniteScroll.ts      → packages/vue/src/composables/useInfiniteScroll.ts
✅ src/vue/usePolling.ts             → packages/vue/src/composables/usePolling.ts
✅ src/vue/useForm.ts                → packages/vue/src/composables/useForm.ts
✅ src/vue/useRequest.ts             → packages/vue/src/composables/useRequest.ts
✅ src/vue/useRequestQueue.ts        → packages/vue/src/composables/useRequestQueue.ts
✅ src/vue/useResource.ts            → packages/vue/src/composables/useResource.ts
✅ src/vue/useThrottledRequest.ts    → packages/vue/src/composables/useThrottledRequest.ts
✅ src/vue/useNetworkStatus.ts       → packages/vue/src/composables/useNetworkStatus.ts
✅ src/vue/useOptimisticUpdate.ts    → packages/vue/src/composables/useOptimisticUpdate.ts
✅ src/types/vue.ts                  → packages/vue/src/types/index.ts

✅ packages/http-vue/src/*           → packages/vue/src/ (合并)
```

**操作**: 合并所有 Vue 相关代码

---

#### 2. React 适配器

**状态**: ✅ 已存在,需要增强

**需要添加的功能**:
```
📝 packages/react/src/hooks/useQuery.ts
📝 packages/react/src/hooks/useMutation.ts
📝 packages/react/src/hooks/usePagination.ts
📝 packages/react/src/hooks/useInfiniteScroll.ts
📝 packages/react/src/hooks/usePolling.ts
📝 packages/react/src/hooks/useWebSocket.ts
📝 packages/react/src/hooks/useSSE.ts
```

---

#### 3. Solid 适配器

**状态**: ✅ 已存在,需要增强

**需要添加的功能**:
```
📝 packages/solid/src/hooks/createQuery.ts
📝 packages/solid/src/hooks/createMutation.ts
📝 packages/solid/src/hooks/createPagination.ts
📝 packages/solid/src/hooks/createInfiniteScroll.ts
```

---

#### 4. Svelte 适配器

**状态**: ✅ 已存在,需要增强

**需要添加的功能**:
```
📝 packages/svelte/src/stores/queryStore.ts
📝 packages/svelte/src/stores/mutationStore.ts
📝 packages/svelte/src/stores/paginationStore.ts
```

---

## 🗑️ 删除清单

### 阶段三: 删除重复包

#### 1. 重复的核心包

```bash
❌ packages/http-core/              # 删除 (已合并到 packages/core/)
❌ packages/http-adapters/          # 删除 (已合并到 packages/core/src/adapters/)
❌ packages/http-interceptors/      # 删除 (已合并到 packages/core/src/interceptors/)
❌ packages/http-features/          # 删除 (已合并到 packages/core/src/features/)
❌ packages/http-utils/             # 删除 (已合并到 packages/core/src/utils/)
❌ packages/http-devtools/          # 删除 (已合并到 packages/core/src/devtools/)
❌ packages/http-presets/           # 删除 (已合并到 packages/core/src/presets/)
❌ packages/http-vue/               # 删除 (已合并到 packages/vue/)
```

#### 2. 已迁移的源代码

```bash
❌ src/adapters/                    # 删除 (已移到 packages/core/src/adapters/)
❌ src/core/                        # 删除 (已移到 packages/core/src/)
❌ src/devtools/                    # 删除 (已移到 packages/core/src/devtools/)
❌ src/features/                    # 删除 (已移到 packages/core/src/features/)
❌ src/interceptors/                # 删除 (已移到 packages/core/src/interceptors/)
❌ src/presets/                     # 删除 (已移到 packages/core/src/presets/)
❌ src/types/                       # 删除 (已移到 packages/core/src/types/)
❌ src/utils/                       # 删除 (已移到 packages/core/src/utils/)
❌ src/vue/                         # 删除 (已移到 packages/vue/src/)
❌ src/client.ts                    # 删除 (已移到 packages/core/src/client/)
❌ src/client-operations.ts         # 删除 (已移到 packages/core/src/client/)
❌ src/client-monitoring.ts         # 删除 (已移到 packages/core/src/client/)
❌ src/factory.ts                   # 删除 (已移到 packages/core/src/client/)
❌ src/engine/                      # 删除 (已移到 packages/core/src/engine/)
```

**保留的文件**:
```bash
✅ src/index.ts                     # 主入口 (重新导出所有子包)
✅ src/index.core.ts                # 核心入口 (重新导出 @ldesign/http-core)
```

#### 3. 过时的文档

```bash
❌ CHANGELOG_v0.3.0.md
❌ DEVELOPMENT.md
❌ HTTP包优化总结报告.md
❌ HTTP包优化记录.md
❌ HTTP包全面分析总结.md
❌ MIGRATION_GUIDE.md
❌ NEW_STRUCTURE_GUIDE.md
❌ QUICK_START.md
❌ QUICK_START_NEW.md
❌ README_优化完成.md
❌ REORGANIZATION_SUMMARY.md
❌ ✅_全部优化完成.md
❌ 优化功能使用指南.md
❌ 优化完成总结.md
❌ 优化工作完成.md
❌ 优化工作进度.md
❌ 优化建议和最佳实践.md
❌ 使用指南.md
❌ 性能优化指南.md
❌ 最终优化报告.md
❌ 🎉_优化完成报告.md
❌ 🎯_所有任务100%完成.md
❌ packages/COMPLETION_REPORT.md
❌ packages/OPTIMIZATION_REPORT.md
❌ packages/SUMMARY.md
```

**保留的文档**:
```bash
✅ README.md                        # 主文档 (需要更新)
✅ docs/                            # 文档目录 (需要整理)
✅ examples/                        # 示例目录 (需要更新)
```

#### 4. 临时脚本

```bash
❌ copy-core-code.js
❌ create-all-examples.js
❌ create-examples.js
❌ create-subpackages.js
❌ reorganize-structure.js
❌ test-build.js
```

**保留的脚本**:
```bash
✅ scripts/build.js
✅ scripts/release.js
✅ scripts/analyze-bundle.js
✅ scripts/benchmark.js
✅ scripts/security-check.js
✅ scripts/validate-build.js
```

---

## ✅ 验证清单

### 构建验证
- [ ] 核心包构建成功
- [ ] React 适配器构建成功
- [ ] Vue 适配器构建成功
- [ ] Solid 适配器构建成功
- [ ] Svelte 适配器构建成功

### 测试验证
- [ ] 核心包测试通过
- [ ] 框架适配器测试通过
- [ ] 集成测试通过

### 功能验证
- [ ] HTTP 请求功能正常
- [ ] 拦截器功能正常
- [ ] 缓存功能正常
- [ ] 重试功能正常

---

## 📊 进度跟踪

- [ ] 阶段一: 核心包整合 (0%)
- [ ] 阶段二: 框架适配器整合 (0%)
- [ ] 阶段三: 删除重复包 (0%)
- [ ] 阶段四: 测试验证 (0%)
- [ ] 阶段五: 文档更新 (0%)

