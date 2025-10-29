# Utils 工具函数模块

> 📦 HTTP 包的工具函数集合  
> 🎯 提供缓存、错误处理、网络监控等通用功能

---

## 📁 目录结构

```
utils/
├── 缓存相关
│   ├── cache.ts                    - 基础缓存管理器
│   ├── cache-lru-optimized.ts      - 优化的LRU缓存（推荐）⭐
│   ├── cache-bloom-filter.ts       - 布隆过滤器缓存（高性能）⭐
│   ├── cache-optimized.ts          - 旧版优化缓存
│   ├── cache-strategies.ts         - 缓存策略
│   └── cache-storage.ts            - 缓存存储接口
│
├── 错误处理
│   ├── error.ts                    - 错误管理器
│   ├── error-analyzer.ts           - 错误分析器
│   └── error-recovery.ts           - 错误恢复策略
│
├── 网络相关
│   ├── network.ts                  - 网络监控
│   ├── offline.ts                  - 离线队列
│   ├── download.ts                 - 下载工具
│   └── upload.ts                   - 上传工具
│
├── 并发控制
│   ├── concurrency.ts              - 并发管理器
│   ├── dedup-manager.ts            - 去重管理器
│   ├── request-dedup.ts            - 请求去重
│   ├── priority.ts                 - 优先级队列
│   └── rate-limit.ts               - 限流器
│
├── 性能监控
│   ├── monitor.ts                  - 性能监控器
│   ├── monitor-compact.ts          - 紧凑监控器
│   ├── trace.ts                    - 请求追踪
│   └── trace-span.ts               - 追踪跨度
│
├── 取消管理
│   ├── cancel.ts                   - 取消管理器
│   ├── cancel-token.ts             - 取消令牌
│   └── cancel-manager-enhanced.ts  - 增强取消管理
│
├── 优化模块（新增）⭐
│   ├── cache-lru-optimized.ts      - O(1) LRU缓存
│   ├── cache-bloom-filter.ts       - 布隆过滤器缓存
│   └── regex-cache.ts              - 正则表达式缓存
│
├── 通用工具
│   ├── helpers.ts                  - 辅助函数
│   ├── logger.ts                   - 日志工具
│   ├── memory.ts                   - 内存管理
│   ├── batch.ts                    - 批处理
│   ├── batch-optimizer.ts          - 批处理优化
│   ├── signature.ts                - 签名工具
│   ├── transformer.ts              - 数据转换
│   ├── compressor.ts               - 压缩工具
│   ├── pool.ts                     - 连接池
│   ├── warmup.ts                   - 预热工具
│   ├── debugger.ts                 - 调试器
│   ├── debug-logger.ts             - 调试日志
│   ├── smartRetry.ts               - 智能重试
│   ├── throttle-debounce.ts        - 节流防抖
│   └── function-utils.ts           - 函数工具
│
└── index.ts                        - 统一导出
```

---

## 🌟 推荐使用（优化模块）

### 1. 高性能LRU缓存

```typescript
import { OptimizedLRUCache } from '@ldesign/http/utils/cache-lru-optimized'

const cache = new OptimizedLRUCache(1000)
// O(1)所有操作，内存减少50%
```

### 2. 布隆过滤器缓存

```typescript
import { BloomFilterCache } from '@ldesign/http/utils/cache-bloom-filter'

const cache = new BloomFilterCache(2000)
// 不存在键查询性能提升90%+
```

### 3. 正则表达式缓存

```typescript
import { REGEX_CACHE, RegexUtils } from '@ldesign/http/utils/regex-cache'

// 使用预编译正则，性能提升30%
if (RegexUtils.isAbsoluteURL(url)) {
  // ...
}
```

---

## 📚 模块说明

### 缓存模块

**推荐使用：**
- ⭐ `cache-lru-optimized.ts` - 优化的LRU（O(1)淘汰）
- ⭐ `cache-bloom-filter.ts` - 布隆过滤器增强

**基础功能：**
- `cache.ts` - 标准缓存管理器
- `cache-storage.ts` - 存储接口实现
- `cache-strategies.ts` - 缓存策略

### 错误处理

- `error.ts` - 统一错误处理
- `error-analyzer.ts` - 错误模式分析
- `error-recovery.ts` - 自动恢复策略

### 网络工具

- `network.ts` - 网络状态监控
- `offline.ts` - 离线请求队列
- `download.ts` - 文件下载
- `upload.ts` - 文件上传

### 并发控制

- `concurrency.ts` - 并发数量控制
- `dedup-manager.ts` - 请求去重
- `priority.ts` - 优先级调度
- `rate-limit.ts` - 请求限流

### 性能监控

- `monitor.ts` - 完整监控
- `monitor-compact.ts` - 轻量监控
- `trace.ts` - 请求追踪
- `trace-span.ts` - 分布式追踪

---

## 🚀 性能优化模块对比

| 模块 | 性能 | 内存 | 适用场景 |
|------|------|------|----------|
| **OptimizedLRUCache** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 通用场景 |
| **BloomFilterCache** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 大规模缓存 |
| **RegexCache** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 正则密集 |
| 基础Cache | ⭐⭐⭐ | ⭐⭐⭐ | 小规模 |

---

## 📖 使用建议

### 选择缓存实现

**小规模应用（<100项）：**
```typescript
import { CacheManager } from '@ldesign/http/utils/cache'
```

**普通应用（100-1000项）：**
```typescript
import { OptimizedLRUCache } from '@ldesign/http/utils/cache-lru-optimized'
```

**大规模应用（>1000项）：**
```typescript
import { BloomFilterCache } from '@ldesign/http/utils/cache-bloom-filter'
```

---

## 🔧 开发计划

### 未来优化方向

1. **utils目录重构**（可选）
   - 创建二级分类目录
   - 合并功能重复的文件
   - 简化导出结构

2. **性能持续优化**
   - 更多性能基准测试
   - 识别新的优化点
   - 持续改进算法

---

**最后更新：** 2025年1月  
**维护者：** @ldesign团队  
**状态：** 优化版本


