# @ldesign/http 子包

`@ldesign/http` 已拆分为多个独立的子包，每个子包专注于特定的功能领域，便于按需使用和维护。

## 📦 子包列表

### 核心包

#### 1. [@ldesign/http-core](./http-core)
**核心客户端和类型定义**

提供HTTP客户端的核心实现和TypeScript类型定义。

```bash
pnpm add @ldesign/http-core
```

```typescript
import { createHttpClient } from '@ldesign/http-core'
import type { RequestConfig, ResponseData } from '@ldesign/http-core'
```

### 适配器包

#### 2. [@ldesign/http-adapters](./http-adapters)
**多种HTTP客户端适配器**

提供 Fetch、Axios、Alova 等多种适配器实现。

```bash
pnpm add @ldesign/http-adapters
```

```typescript
import { FetchAdapter, AxiosAdapter, AlovaAdapter } from '@ldesign/http-adapters'
import { autoSelectAdapter } from '@ldesign/http-adapters'
```

### 功能增强包

#### 3. [@ldesign/http-interceptors](./http-interceptors)
**拦截器管理**

提供请求/响应/错误拦截器的管理功能。

```bash
pnpm add @ldesign/http-interceptors
```

#### 4. [@ldesign/http-features](./http-features)
**高级特性**

提供缓存、重试、熔断器、限流等高级功能。

```bash
pnpm add @ldesign/http-features
```

```typescript
import { CacheManager, RetryManager, CircuitBreaker } from '@ldesign/http-features'
```

#### 5. [@ldesign/http-utils](./http-utils)
**工具函数**

提供各种实用的工具函数。

```bash
pnpm add @ldesign/http-utils
```

```typescript
import { formatUrl, parseHeaders, createAbortController } from '@ldesign/http-utils'
```

### 框架集成包

#### 6. [@ldesign/http-vue](./http-vue)
**Vue 3 集成**

提供 Vue 3 组合式函数和插件。

```bash
pnpm add @ldesign/http-vue
```

```typescript
import { useHttp, useRequest, useMutation } from '@ldesign/http-vue'
```

### 开发工具包

#### 7. [@ldesign/http-devtools](./http-devtools)
**开发者工具**

提供调试、监控和性能分析工具。

```bash
pnpm add @ldesign/http-devtools
```

```typescript
import { HttpDebugger, PerformanceMonitor } from '@ldesign/http-devtools'
```

#### 8. [@ldesign/http-presets](./http-presets)
**预设配置**

提供常用的预设配置，快速开始使用。

```bash
pnpm add @ldesign/http-presets
```

```typescript
import { defaultPreset, restApiPreset, graphqlPreset } from '@ldesign/http-presets'
```

## 🚀 快速开始

### 1. 基础使用

```typescript
// 安装核心包和适配器
// pnpm add @ldesign/http-core @ldesign/http-adapters

import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-adapters'

// 创建客户端
const client = createHttpClient(
  {
    baseURL: 'https://api.example.com',
    timeout: 10000,
  },
  new FetchAdapter()
)

// 发送请求
const response = await client.get('/users')
console.log(response.data)
```

### 2. 使用高级特性

```typescript
// pnpm add @ldesign/http-core @ldesign/http-adapters @ldesign/http-features

import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-adapters'
import { CacheManager, RetryManager } from '@ldesign/http-features'

const client = createHttpClient(
  {
    baseURL: 'https://api.example.com',
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5分钟
    },
    retry: {
      retries: 3,
      retryDelay: 1000,
    },
  },
  new FetchAdapter()
)
```

### 3. Vue 3 集成

```typescript
// pnpm add @ldesign/http-core @ldesign/http-adapters @ldesign/http-vue

import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http-vue'
import { FetchAdapter } from '@ldesign/http-adapters'

const app = createApp(App)

app.use(createHttpPlugin({
  baseURL: 'https://api.example.com',
  adapter: new FetchAdapter(),
}))
```

在组件中使用：

```vue
<script setup>
import { useHttp } from '@ldesign/http-vue'

const { data, loading, error, execute } = useHttp('/users')
</script>
```

## 🏗️ 项目结构

```
packages/http/packages/
├── http-core/              # 核心包
│   ├── src/
│   ├── example/           # 演示示例
│   ├── package.json
│   ├── builder.config.ts  # 使用 @ldesign/builder 构建
│   └── README.md
├── http-adapters/          # 适配器包
│   ├── src/
│   ├── example/
│   ├── package.json
│   ├── builder.config.ts
│   └── README.md
├── http-interceptors/      # 拦截器包
├── http-features/          # 特性包
├── http-utils/            # 工具包
├── http-vue/              # Vue集成包
├── http-devtools/         # 开发工具包
└── http-presets/          # 预设包
```

## 📝 开发指南

### 构建子包

每个子包都使用 `@ldesign/builder` 进行构建：

```bash
# 进入子包目录
cd packages/http-core

# 构建（生成 ESM、CJS、UMD 格式）
pnpm build

# 监听模式
pnpm build:watch

# 清理并构建
pnpm build:clean
```

### 运行演示示例

每个子包都包含基于 `@ldesign/launcher` 的演示示例：

```bash
# 进入示例目录
cd packages/http-core/example

# 启动开发服务器
pnpm dev

# 构建示例
pnpm build

# 预览构建结果
pnpm preview
```

### 构建所有子包

在根目录或 `packages/http` 目录下运行：

```bash
# 构建所有子包
pnpm -r --filter "./packages/http/packages/**" build
```

## 🔧 技术栈

- **构建工具**: [@ldesign/builder](../../tools/builder) - 统一的构建工具
- **开发服务器**: [@ldesign/launcher](../../tools/launcher) - 开发和预览工具
- **语言**: TypeScript 5.7+
- **包管理**: pnpm workspace
- **输出格式**: ESM, CJS, UMD

## 📖 文档

每个子包都有独立的 README.md 文档，详细说明其功能和使用方法。

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

MIT © ldesign

## 🙏 致谢

感谢所有贡献者的辛勤付出！


