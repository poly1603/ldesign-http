# @ldesign/http-core 源码目录结构

## 📁 目录说明

### 核心模块
- **index.ts** - 主入口文件，统一导出所有公共 API
- **constants/** - 常量定义（版本号等）
- **deprecated/** - 已废弃的代码（保留用于向后兼容）
- **types/** - TypeScript 类型定义

### 功能模块
- **adapters/** - HTTP 适配器（Fetch、Axios、Alova 等）
- **cache/** - 缓存管理系统
- **client/** - HTTP 客户端核心实现
- **interceptors/** - 请求/响应拦截器
- **retry/** - 重试机制
- **queue/** - 请求队列管理
- **features/** - 高级特性（GraphQL、WebSocket、SSE 等）
- **utils/** - 工具函数库

### 扩展模块
- **core/** - 核心处理器
- **engine/** - 插件引擎系统
- **devtools/** - 开发者工具
- **middleware/** - 中间件系统
- **optimizations/** - 性能优化模块

## 📝 规范说明

### 文件组织原则
1. **单一入口**：src 目录下只保留 `index.ts` 作为主入口
2. **功能分组**：相关功能放在对应的子目录中
3. **类型集中**：所有类型定义统一放在 `types/` 目录
4. **常量独立**：常量定义放在 `constants/` 目录
5. **废弃隔离**：已废弃的代码放在 `deprecated/` 目录，不在主入口导出

### 导入规范
```typescript
// ✅ 推荐：从主入口导入
import { createHttpClient, HttpClient } from '@ldesign/http-core'

// ✅ 推荐：从子模块导入
import { FetchAdapter } from '@ldesign/http-core/adapters'
import { CacheManager } from '@ldesign/http-core/cache'

// ❌ 避免：直接导入内部文件
import { version } from '@ldesign/http-core/src/constants/version'
```

## 🔄 迁移指南

### 从旧结构迁移

如果你之前使用了以下导入：
```typescript
// 旧的导入方式
import { version } from '@ldesign/http-core/version'
import { createHttpClient } from '@ldesign/http-core/factory'
```

请更新为：
```typescript
// 新的导入方式
import { version, createHttpClient } from '@ldesign/http-core'
```

### 废弃文件说明

- `deprecated/factory.ts` - 已废弃，请使用 `client/factory.ts`
- `types.ts` 已移动到 `types/legacy.ts`，新代码应使用 `types/index.ts`

## 📚 相关文档

- [API 文档](../README.md)
- [类型定义](./types/README.md)
- [适配器系统](./adapters/README.md)
- [缓存系统](./cache/README.md)