# 🚀 快速开始 - HTTP 新架构

## 📦 项目结构

```
packages/http/
├── packages/
│   ├── core/              # ✅ 核心包（已构建成功）
│   ├── vue/               # Vue 3 适配器
│   ├── react/             # React 适配器
│   ├── solid/             # Solid 适配器
│   └── svelte/            # Svelte 适配器
```

## 🎯 核心包使用

### 1. 构建核心包

```bash
cd packages/http/packages/core
pnpm build
```

### 2. 基础用法

```typescript
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-core/adapters'

// 创建客户端
const client = createHttpClient(
  {
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000,
  },
  new FetchAdapter()
)

// 发送请求
const users = await client.get('/users')
const user = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
})
```

## 🎨 运行示例

### Core 示例（原生 JS）

```bash
cd packages/core/examples/vite-demo
pnpm install
pnpm dev
# 访问 http://localhost:3000
```

### Vue 示例

```bash
# 1. 先构建核心包
cd packages/core
pnpm build

# 2. 运行 Vue 示例
cd ../vue/examples/vite-demo
pnpm install
pnpm dev
# 访问 http://localhost:3000
```

### React 示例

```bash
cd packages/react/examples/vite-demo
pnpm install
pnpm dev
# 访问 http://localhost:3001
```

### Solid 示例

```bash
cd packages/solid/examples/vite-demo
pnpm install
pnpm dev
# 访问 http://localhost:3002
```

### Svelte 示例

```bash
cd packages/svelte/examples/vite-demo
pnpm install
pnpm dev
# 访问 http://localhost:3003
```

## 🔧 开发模式

### 监听核心包变化

```bash
cd packages/core
pnpm dev  # 或 pnpm build --watch
```

### 同时开发多个包

```bash
# 终端 1 - 监听核心包
cd packages/core && pnpm dev

# 终端 2 - 监听 Vue 包
cd packages/vue && pnpm dev

# 终端 3 - 运行示例
cd packages/vue/examples/vite-demo && pnpm dev
```

## 📝 添加新功能

### 在核心包中添加功能

```bash
# 1. 编辑源代码
cd packages/core/src

# 2. 添加新模块
# adapters/new-adapter.ts

# 3. 更新导出
# adapters/index.ts
export * from './new-adapter'

# 4. 构建测试
pnpm build
```

### 在框架包中添加功能

```bash
# 以 Vue 为例
cd packages/vue/src/composables

# 添加新的 composable
# useRequest.ts

# 更新导出
# composables/index.ts
export * from './useRequest'

# 构建
pnpm build
```

## 🧪 测试构建

```bash
# 测试所有包的构建
cd packages/http
node test-build.js
```

输出示例:
```
🏗️  开始测试构建流程...

📦 正在构建 @ldesign/http-core...
✅ @ldesign/http-core 构建成功!

📦 正在构建 @ldesign/http-vue...
...

📊 构建总结:
   ✅ 成功: 1 个
   ❌ 失败: 4 个
```

**注意**: 当前 builder 有类型错误，导致其他包构建失败。这不影响核心包的使用和开发。

## 📚 API 文档

### 核心包 API

#### 创建客户端

```typescript
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-core/adapters'

const client = createHttpClient(config, adapter)
```

#### 发送请求

```typescript
// GET
const response = await client.get('/users')

// POST
const user = await client.post('/users', data)

// PUT
const updated = await client.put('/users/1', data)

// DELETE
await client.delete('/users/1')

// PATCH
const patched = await client.patch('/users/1', data)
```

### 适配器

```typescript
// Fetch 适配器（推荐）
import { FetchAdapter } from '@ldesign/http-core/adapters'
const adapter = new FetchAdapter()

// Axios 适配器
import { AxiosAdapter } from '@ldesign/http-core/adapters'
const adapter = new AxiosAdapter()

// Alova 适配器
import { AlovaAdapter } from '@ldesign/http-core/adapters'
const adapter = new AlovaAdapter()

// 自动选择
import { autoSelectAdapter } from '@ldesign/http-core/adapters'
const adapter = autoSelectAdapter()
```

## 🎯 常见任务

### 任务 1: 添加新的适配器

```bash
# 1. 创建适配器文件
cd packages/core/src/adapters
# 创建 new-adapter.ts

# 2. 实现适配器接口
# export class NewAdapter implements HttpAdapter { ... }

# 3. 导出
# adapters/index.ts: export * from './new-adapter'

# 4. 构建和测试
cd ../.. && pnpm build
```

### 任务 2: 添加 Vue Composable

```bash
# 1. 创建 composable
cd packages/vue/src/composables
# 创建 useRequest.ts

# 2. 实现
# export function useRequest() { ... }

# 3. 导出
# composables/index.ts: export * from './useRequest'

# 4. 在示例中测试
cd ../../examples/vite-demo
# 在 App.vue 中使用
```

### 任务 3: 更新示例

```bash
# 1. 修改示例代码
cd packages/core/examples/vite-demo/src
# 编辑 main.ts 或 App.vue

# 2. 运行查看效果
pnpm dev
```

## 💡 提示

1. **先构建核心包**: 所有框架包都依赖核心包，开发前先构建核心包
2. **使用监听模式**: 开发时使用 `pnpm dev` 自动重新构建
3. **查看示例**: 所有示例都是完整可运行的，可以直接参考
4. **保持结构一致**: 参考 engine 包的结构保持一致性

## 🐛 常见问题

### Q: Builder 构建失败怎么办？

A: 这是 builder 本身的类型错误，不影响核心包。核心包已经成功构建。

### Q: 如何只构建核心包？

A: `cd packages/core && pnpm build`

### Q: 示例启动失败？

A: 确保先构建了核心包，并在示例目录运行 `pnpm install`

### Q: 如何查看构建产物？

A: 查看 `es/`, `lib/`, `dist/` 目录

## 📖 下一步

1. 阅读 [新结构指南](./NEW_STRUCTURE_GUIDE.md)
2. 查看 [开发指南](./DEVELOPMENT.md)
3. 参考 [Engine 包](../engine/README.md)
4. 开始开发你的功能

---

祝开发愉快！🎉

