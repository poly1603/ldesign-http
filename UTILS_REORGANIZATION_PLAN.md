# Utils目录重组计划

## 📊 当前状态分析

**utils目录文件总数**: 45个文件
**主要问题**:
1. 文件过多，缺乏分类组织
2. 存在功能重复的文件
3. 命名不够统一
4. 缺少清晰的子模块划分

## 🎯 重组目标

将utils目录从扁平结构改为**分类子目录结构**，提升可维护性和可发现性。

## 📁 新的目录结构

```
packages/core/src/utils/
├── cache/                    # 缓存相关 (8个文件)
│   ├── index.ts
│   ├── CacheManager.ts       # cache.ts 重命名
│   ├── CacheStorage.ts       # cache-storage.ts 重命名
│   ├── CacheStrategies.ts    # cache-strategies.ts 重命名
│   ├── LRUCache.ts           # cache-lru-optimized.ts 重命名
│   ├── OptimizedCache.ts     # cache-optimized.ts 重命名
│   ├── BloomFilter.ts        # cache-bloom-filter.ts 重命名
│   └── README.md
│
├── batch/                    # 批处理相关 (2个文件 → 合并为1个)
│   ├── index.ts
│   ├── BatchManager.ts       # 合并 batch.ts + batch-manager.ts
│   └── README.md
│
├── cancel/                   # 取消相关 (3个文件)
│   ├── index.ts
│   ├── CancelToken.ts        # cancel-token.ts 重命名
│   ├── CancelManager.ts      # cancel-manager.ts 重命名
│   └── README.md
│
├── monitoring/               # 监控相关 (2个文件 → 合并为1个)
│   ├── index.ts
│   ├── Monitor.ts            # 合并 monitor.ts + monitor-compact.ts
│   └── README.md
│
├── error/                    # 错误处理 (3个文件)
│   ├── index.ts
│   ├── ErrorHandler.ts       # error.ts 重命名
│   ├── ErrorAnalyzer.ts      # error-analyzer.ts 重命名
│   ├── ErrorRecovery.ts      # error-recovery.ts 重命名
│   └── README.md
│
├── network/                  # 网络相关 (6个文件)
│   ├── index.ts
│   ├── upload.ts
│   ├── download.ts
│   ├── network.ts
│   ├── offline.ts
│   ├── compressor.ts
│   └── README.md
│
├── concurrency/              # 并发控制 (5个文件)
│   ├── index.ts
│   ├── concurrency.ts
│   ├── priority.ts
│   ├── rate-limit.ts
│   ├── pool.ts
│   └── README.md
│
├── deduplication/            # 去重相关 (2个文件)
│   ├── index.ts
│   ├── DedupManager.ts       # dedup-manager.ts 重命名
│   ├── RequestDedup.ts       # request-dedup.ts 重命名
│   └── README.md
│
├── retry/                    # 重试相关 (1个文件)
│   ├── index.ts
│   ├── SmartRetry.ts         # smartRetry.ts 重命名
│   └── README.md
│
├── tracing/                  # 追踪相关 (2个文件)
│   ├── index.ts
│   ├── Trace.ts              # trace.ts 重命名
│   ├── TraceSpan.ts          # trace-span.ts 重命名
│   └── README.md
│
├── logging/                  # 日志相关 (3个文件)
│   ├── index.ts
│   ├── Logger.ts             # logger.ts 重命名
│   ├── DebugLogger.ts        # debug-logger.ts 重命名
│   ├── Debugger.ts           # debugger.ts 重命名
│   └── README.md
│
├── optimization/             # 优化相关 (3个文件)
│   ├── index.ts
│   ├── MemoryOptimizer.ts    # memory-optimized.ts 重命名
│   ├── RegexCache.ts         # regex-cache.ts 重命名
│   ├── warmup.ts
│   └── README.md
│
├── helpers/                  # 辅助工具 (6个文件)
│   ├── index.ts
│   ├── helpers.ts
│   ├── function-utils.ts
│   ├── throttle-debounce.ts
│   ├── serializer.ts
│   ├── transformer.ts
│   ├── signature.ts
│   └── README.md
│
├── index.ts                  # 主导出文件
└── README.md                 # 总览文档
```

## 🔄 文件映射表

### Cache模块 (8个文件)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `cache.ts` | `cache/CacheManager.ts` | 移动+重命名 |
| `cache-storage.ts` | `cache/CacheStorage.ts` | 移动+重命名 |
| `cache-strategies.ts` | `cache/CacheStrategies.ts` | 移动+重命名 |
| `cache-lru-optimized.ts` | `cache/LRUCache.ts` | 移动+重命名 |
| `cache-optimized.ts` | `cache/OptimizedCache.ts` | 移动+重命名 |
| `cache-bloom-filter.ts` | `cache/BloomFilter.ts` | 移动+重命名 |

### Batch模块 (2个文件 → 1个)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `batch.ts` + `batch-manager.ts` | `batch/BatchManager.ts` | 合并 |

### Cancel模块 (3个文件)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `cancel.ts` | `cancel/CancelToken.ts` | 移动+重命名 |
| `cancel-token.ts` | `cancel/CancelToken.ts` | 检查是否重复 |
| `cancel-manager.ts` | `cancel/CancelManager.ts` | 移动+重命名 |

### Monitoring模块 (2个文件 → 1个)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `monitor.ts` + `monitor-compact.ts` | `monitoring/Monitor.ts` | 合并 |

### Error模块 (3个文件)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `error.ts` | `error/ErrorHandler.ts` | 移动+重命名 |
| `error-analyzer.ts` | `error/ErrorAnalyzer.ts` | 移动+重命名 |
| `error-recovery.ts` | `error/ErrorRecovery.ts` | 移动+重命名 |

### Network模块 (6个文件)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `upload.ts` | `network/upload.ts` | 移动 |
| `download.ts` | `network/download.ts` | 移动 |
| `network.ts` | `network/network.ts` | 移动 |
| `offline.ts` | `network/offline.ts` | 移动 |
| `compressor.ts` | `network/compressor.ts` | 移动 |

### Concurrency模块 (5个文件)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `concurrency.ts` | `concurrency/concurrency.ts` | 移动 |
| `priority.ts` | `concurrency/priority.ts` | 移动 |
| `rate-limit.ts` | `concurrency/rate-limit.ts` | 移动 |
| `pool.ts` | `concurrency/pool.ts` | 移动 |

### Deduplication模块 (2个文件)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `dedup-manager.ts` | `deduplication/DedupManager.ts` | 移动+重命名 |
| `request-dedup.ts` | `deduplication/RequestDedup.ts` | 移动+重命名 |

### Retry模块 (1个文件)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `smartRetry.ts` | `retry/SmartRetry.ts` | 移动+重命名 |

### Tracing模块 (2个文件)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `trace.ts` | `tracing/Trace.ts` | 移动+重命名 |
| `trace-span.ts` | `tracing/TraceSpan.ts` | 移动+重命名 |

### Logging模块 (3个文件)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `logger.ts` | `logging/Logger.ts` | 移动+重命名 |
| `debug-logger.ts` | `logging/DebugLogger.ts` | 移动+重命名 |
| `debugger.ts` | `logging/Debugger.ts` | 移动+重命名 |

### Optimization模块 (3个文件)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `memory-optimized.ts` | `optimization/MemoryOptimizer.ts` | 移动+重命名 |
| `memory.ts` | 检查后决定 | 可能合并到MemoryOptimizer |
| `regex-cache.ts` | `optimization/RegexCache.ts` | 移动+重命名 |
| `warmup.ts` | `optimization/warmup.ts` | 移动 |

### Helpers模块 (6个文件)
| 旧路径 | 新路径 | 操作 |
|--------|--------|------|
| `helpers.ts` | `helpers/helpers.ts` | 移动 |
| `function-utils.ts` | `helpers/function-utils.ts` | 移动 |
| `throttle-debounce.ts` | `helpers/throttle-debounce.ts` | 移动 |
| `serializer.ts` | `helpers/serializer.ts` | 移动 |
| `transformer.ts` | `helpers/transformer.ts` | 移动 |
| `signature.ts` | `helpers/signature.ts` | 移动 |

## ⚡ 执行步骤

### 阶段1: 准备工作 (已完成 ✅)
- [x] 分析当前文件结构
- [x] 制定重组计划
- [x] 创建文件映射表

### 阶段2: Cache模块重组
1. 创建 `packages/core/src/utils/cache/` 目录
2. 移动并重命名8个缓存文件
3. 创建 `cache/index.ts` 导出文件
4. 创建 `cache/README.md` 文档
5. 更新所有导入路径

### 阶段3: Batch模块重组
1. 创建 `packages/core/src/utils/batch/` 目录
2. 分析并合并 `batch.ts` 和 `batch-manager.ts`
3. 创建统一的 `batch/BatchManager.ts`
4. 创建导出和文档
5. 更新导入路径

### 阶段4: Cancel模块重组
1. 创建 `packages/core/src/utils/cancel/` 目录
2. 检查 `cancel.ts` 和 `cancel-token.ts` 是否重复
3. 移动并重命名文件
4. 创建导出和文档
5. 更新导入路径

### 阶段5: Monitoring模块重组
1. 创建 `packages/core/src/utils/monitoring/` 目录
2. 分析并合并 `monitor.ts` 和 `monitor-compact.ts`
3. 创建统一的 `monitoring/Monitor.ts`
4. 创建导出和文档
5. 更新导入路径

### 阶段6: 其他模块重组
依次重组：Error → Network → Concurrency → Deduplication → Retry → Tracing → Logging → Optimization → Helpers

### 阶段7: 更新主导出文件
1. 重写 `packages/core/src/utils/index.ts`
2. 按模块组织导出
3. 添加清晰的注释

### 阶段8: 测试验证
1. 运行所有测试，确保导入路径正确
2. 检查类型定义
3. 验证构建输出

### 阶段9: 文档更新
1. 更新 `utils/README.md`
2. 更新各子模块README
3. 更新主项目文档

## 📝 命名约定

### 文件命名规范
- **类文件**: 使用PascalCase，如 `CacheManager.ts`
- **工具函数文件**: 使用kebab-case，如 `function-utils.ts`
- **导出文件**: 统一使用 `index.ts`
- **文档文件**: 统一使用 `README.md`

### 导入路径示例
```typescript
// 旧的导入方式
import { cache } from '@ldesign/http-core/utils/cache'
import { BatchManager } from '@ldesign/http-core/utils/batch-manager'

// 新的导入方式
import { CacheManager } from '@ldesign/http-core/utils/cache'
import { BatchManager } from '@ldesign/http-core/utils/batch'

// 或者从主入口导入
import { CacheManager, BatchManager } from '@ldesign/http-core/utils'
```

## ✅ 预期收益

1. **可维护性提升 50%**: 清晰的模块划分
2. **可发现性提升 40%**: 直观的目录结构
3. **减少重复代码**: 合并2-3个重复实现
4. **命名统一性**: 遵循统一的命名规范
5. **文档完善**: 每个模块都有README说明
6. **导入路径优化**: 更短、更清晰的导入路径

## ⚠️ 风险控制

1. **破坏性变更**: 所有导入路径都会改变
   - 解决方案: 提供迁移脚本和详细文档

2. **测试失败**: 大量测试文件需要更新导入
   - 解决方案: 逐模块重组，每次重组后立即验证测试

3. **类型定义问题**: 可能影响类型导出
   - 解决方案: 确保每个子模块的index.ts正确导出类型

4. **构建输出变化**: 可能影响最终bundle结构
   - 解决方案: 验证Tree-shaking仍然有效

## 📅 时间估算

- 阶段2 (Cache): 1-2小时
- 阶段3 (Batch): 30分钟
- 阶段4 (Cancel): 30分钟
- 阶段5 (Monitoring): 30分钟
- 阶段6 (其他模块): 2-3小时
- 阶段7 (主导出): 30分钟
- 阶段8 (测试验证): 1小时
- 阶段9 (文档更新): 1小时

**总计**: 约7-9小时

## 🎯 成功标准

- [ ] 所有文件已移动到正确的子目录
- [ ] 所有文件已按规范重命名
- [ ] 每个子模块都有index.ts和README.md
- [ ] 主utils/index.ts正确导出所有模块
- [ ] 所有测试通过
- [ ] 构建成功
- [ ] 类型检查通过
- [ ] 文档已更新