# 迁移指南 - @ldesign/http 子包拆分

本指南帮助你从旧的 `@ldesign/http` 单体包迁移到新的子包结构。

## 🎯 为什么要拆分？

1. **按需加载** - 只安装需要的功能，减小包体积
2. **独立开发** - 每个子包可以独立开发、测试和发布
3. **清晰的职责** - 每个包专注于特定功能
4. **更好的维护性** - 模块化结构便于维护和升级
5. **灵活的集成** - 可以选择性地集成所需功能

## 📦 包对应关系

| 旧包路径 | 新子包 | 说明 |
|---------|--------|------|
| `@ldesign/http` | `@ldesign/http-core` | 核心客户端 |
| `@ldesign/http/adapters` | `@ldesign/http-adapters` | 适配器 |
| `@ldesign/http/interceptors` | `@ldesign/http-interceptors` | 拦截器 |
| `@ldesign/http/features` | `@ldesign/http-features` | 高级特性 |
| `@ldesign/http/utils` | `@ldesign/http-utils` | 工具函数 |
| `@ldesign/http/vue` | `@ldesign/http-vue` | Vue 集成 |
| `@ldesign/http/devtools` | `@ldesign/http-devtools` | 开发工具 |
| `@ldesign/http/presets` | `@ldesign/http-presets` | 预设配置 |

## 🔄 迁移步骤

### 1. 更新依赖

#### 旧方式
```json
{
  "dependencies": {
    "@ldesign/http": "^0.1.0"
  }
}
```

#### 新方式
```json
{
  "dependencies": {
    "@ldesign/http-core": "^0.1.0",
    "@ldesign/http-adapters": "^0.1.0"
  }
}
```

### 2. 更新导入语句

#### 旧方式
```typescript
// 从主包导入
import { createHttpClient } from '@ldesign/http'
import { FetchAdapter } from '@ldesign/http/adapters'
import { useHttp } from '@ldesign/http/vue'
```

#### 新方式
```typescript
// 从独立子包导入
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-adapters'
import { useHttp } from '@ldesign/http-vue'
```

### 3. 更新类型导入

#### 旧方式
```typescript
import type { 
  HttpClient, 
  RequestConfig, 
  ResponseData 
} from '@ldesign/http'
```

#### 新方式
```typescript
import type { 
  HttpClient, 
  RequestConfig, 
  ResponseData 
} from '@ldesign/http-core'
```

## 📋 完整迁移示例

### 示例 1: 基础客户端

#### 旧代码
```typescript
import { createHttpClient, FetchAdapter } from '@ldesign/http'

const client = createHttpClient(
  { baseURL: 'https://api.example.com' },
  new FetchAdapter()
)
```

#### 新代码
```typescript
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-adapters'

const client = createHttpClient(
  { baseURL: 'https://api.example.com' },
  new FetchAdapter()
)
```

### 示例 2: 使用拦截器

#### 旧代码
```typescript
import { createHttpClient } from '@ldesign/http'
import { createInterceptorManager } from '@ldesign/http/interceptors'

const client = createHttpClient(config, adapter)
client.interceptors.request.use(config => {
  // ...
  return config
})
```

#### 新代码
```typescript
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-adapters'
// 拦截器功能已内置在 http-core 中
// 如需高级拦截器功能，可安装 @ldesign/http-interceptors

const client = createHttpClient(config, new FetchAdapter())
client.interceptors.request.use(config => {
  // ...
  return config
})
```

### 示例 3: Vue 3 集成

#### 旧代码
```typescript
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http/vue'

const app = createApp(App)
app.use(createHttpPlugin(config))
```

#### 新代码
```typescript
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http-vue'

const app = createApp(App)
app.use(createHttpPlugin(config))
```

### 示例 4: 使用高级特性

#### 旧代码
```typescript
import { createHttpClient } from '@ldesign/http'
import { CacheManager, RetryManager } from '@ldesign/http/features'

const client = createHttpClient({
  cache: { enabled: true },
  retry: { retries: 3 },
}, adapter)
```

#### 新代码
```typescript
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-adapters'
// 高级特性配置保持不变，由 http-core 支持
// 如需自定义缓存/重试策略，可安装 @ldesign/http-features

const client = createHttpClient({
  cache: { enabled: true },
  retry: { retries: 3 },
}, new FetchAdapter())
```

## ⚠️ 注意事项

### 1. 破坏性变更

- **适配器导入**: 所有适配器现在从 `@ldesign/http-adapters` 导入
- **Vue 集成**: Vue 相关功能从 `@ldesign/http-vue` 导入
- **工具函数**: 工具函数从 `@ldesign/http-utils` 导入

### 2. 依赖关系

新的子包有依赖关系：

- `@ldesign/http-adapters` 依赖 `@ldesign/http-core`
- `@ldesign/http-interceptors` 依赖 `@ldesign/http-core`
- `@ldesign/http-features` 依赖 `@ldesign/http-core` 和 `@ldesign/http-utils`
- `@ldesign/http-vue` 依赖 `@ldesign/http-core` 和 `@ldesign/http-adapters`

使用 pnpm workspace 时，这些依赖会自动解析。

### 3. 包体积

新的子包结构可以显著减小最终打包体积：

| 使用场景 | 旧包大小 | 新包大小 | 节省 |
|---------|---------|---------|------|
| 仅使用核心功能 | ~60KB | ~20KB | 67% |
| 使用核心 + Fetch | ~60KB | ~25KB | 58% |
| 使用核心 + Vue | ~60KB | ~35KB | 42% |
| 使用全部功能 | ~60KB | ~60KB | 0% |

## 🛠️ 自动化迁移工具

我们提供了自动化迁移脚本帮助你快速迁移：

```bash
# 在项目根目录运行
npx @ldesign/http-migrate
```

该工具会自动：
1. 分析你的代码
2. 更新 package.json 依赖
3. 更新导入语句
4. 生成迁移报告

## 🐛 常见问题

### Q: 我需要安装所有子包吗？

A: 不需要。只安装你实际使用的子包。最基本的使用只需要 `@ldesign/http-core` 和 `@ldesign/http-adapters`。

### Q: 旧的 @ldesign/http 包还会维护吗？

A: 旧包会保持维护状态 3 个月，之后将标记为废弃。建议尽快迁移到新的子包结构。

### Q: 如何确定我需要哪些子包？

A: 参考以下规则：
- 基础HTTP请求 → `http-core` + `http-adapters`
- 需要拦截器 → 添加 `http-interceptors`
- 需要缓存/重试 → 添加 `http-features`
- Vue 3 项目 → 添加 `http-vue`
- 需要调试工具 → 添加 `http-devtools`

### Q: 子包之间的版本号需要保持一致吗？

A: 建议保持一致，但不是强制的。使用 `workspace:*` 可以自动引用最新的工作区版本。

## 📚 更多资源

- [子包总览](./packages/README.md)
- [核心包文档](./packages/http-core/README.md)
- [适配器文档](./packages/http-adapters/README.md)
- [Vue 集成文档](./packages/http-vue/README.md)

## 💬 获取帮助

如果在迁移过程中遇到问题：

1. 查阅 [FAQ](./FAQ.md)
2. 查看 [示例代码](./examples)
3. 提交 [Issue](https://github.com/ldesign/http/issues)
4. 加入我们的 [Discord 社区](https://discord.gg/ldesign)

---

祝迁移顺利！🚀


