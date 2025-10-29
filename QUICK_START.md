# 🚀 快速开始 - @ldesign/http 子包

5 分钟快速上手 HTTP 子包系统。

## 📦 安装依赖

```bash
# 进入 packages/http 目录
cd packages/http

# 安装所有依赖
pnpm install
```

## 🔨 构建子包

### 方式 1: 构建单个子包

```bash
# 进入子包目录
cd packages/http-core

# 构建
pnpm build

# 输出:
# ✅ es/ - ESM 格式
# ✅ lib/ - CJS 格式
# ✅ dist/ - UMD 格式
```

### 方式 2: 批量构建所有子包

```bash
# 在 packages/http 目录下
node scripts/build-all.js

# 输出:
# 🚀 开始构建所有子包...
# 📦 正在构建 @ldesign/http-core...
# ✅ @ldesign/http-core 构建成功!
# ...
# 📊 构建总结: ✅ 成功: 8 个
```

### 方式 3: 使用 pnpm workspace

```bash
# 构建所有子包
pnpm -r --filter "./packages/**" build

# 清理所有子包
pnpm -r --filter "./packages/**" clean

# 运行所有测试
pnpm -r --filter "./packages/**" test
```

## 🎨 运行演示示例

### 单个演示

```bash
# 1. 构建子包
cd packages/http-core
pnpm build

# 2. 进入演示目录
cd example

# 3. 启动开发服务器
pnpm dev

# 浏览器自动打开 http://localhost:3000
```

### 并行开发

在不同终端窗口中运行：

```bash
# 终端 1 - 监听核心包变化
cd packages/http-core
pnpm build:watch

# 终端 2 - 监听适配器包变化
cd packages/http-adapters
pnpm build:watch

# 终端 3 - 运行演示
cd packages/http-core/example
pnpm dev
```

## 📝 基础使用示例

### 1. HTTP Core 基础用法

```typescript
// main.ts
import { createHttpClient } from '@ldesign/http-core'
import type { HttpClient } from '@ldesign/http-core'

// 创建客户端（需要提供适配器）
const client: HttpClient = createHttpClient(
  {
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 10000,
  },
  adapter // 需要从 @ldesign/http-adapters 引入
)

// 发送请求
const response = await client.get('/users/1')
console.log(response.data)
```

### 2. 使用 Fetch 适配器

```typescript
// main.ts
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-adapters'

const client = createHttpClient(
  { baseURL: 'https://api.example.com' },
  new FetchAdapter()
)

// GET 请求
const users = await client.get('/users')

// POST 请求
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
})

// PUT 请求
const updated = await client.put('/users/1', {
  name: 'Jane Doe',
})

// DELETE 请求
await client.delete('/users/1')
```

### 3. Vue 3 集成

```vue
<script setup lang="ts">
// App.vue
import { createHttpPlugin } from '@ldesign/http-vue'
import { FetchAdapter } from '@ldesign/http-adapters'
import { useHttp } from '@ldesign/http-vue'

// 在 main.ts 中安装插件
// app.use(createHttpPlugin({
//   baseURL: 'https://api.example.com',
//   adapter: new FetchAdapter()
// }))

// 在组件中使用
const { data, loading, error, execute } = useHttp<User[]>('/users')
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error }}</div>
    <div v-else>
      <div v-for="user in data" :key="user.id">
        {{ user.name }}
      </div>
    </div>
    <button @click="execute">刷新</button>
  </div>
</template>
```

## 🛠️ 开发任务

### 添加新功能到现有子包

```bash
# 1. 进入子包目录
cd packages/http-core

# 2. 创建新文件
# src/new-feature.ts

# 3. 在 src/index.ts 中导出
echo "export * from './new-feature'" >> src/index.ts

# 4. 构建
pnpm build

# 5. 测试
pnpm test
```

### 创建新的子包

```bash
# 1. 复制现有子包作为模板
cp -r packages/http-utils packages/http-new-feature

# 2. 修改 package.json
# - name: "@ldesign/http-new-feature"
# - description: "新功能描述"

# 3. 实现功能
# packages/http-new-feature/src/index.ts

# 4. 构建和测试
cd packages/http-new-feature
pnpm build
pnpm test
```

## 📊 查看构建产物

```bash
# 构建
cd packages/http-core
pnpm build

# 分析打包大小
pnpm build:analyze

# 输出:
# 📊 分析打包产物大小...
# 
# 📁 es/
# ==================================================
#   index.js                                    12.34 KB
#   types/base.js                                5.67 KB
#   ...
```

## 🧪 运行测试

```bash
# 单次运行
pnpm test:run

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage

# 查看覆盖率报告
open coverage/index.html
```

## 🔍 代码质量检查

```bash
# TypeScript 类型检查
pnpm type-check

# ESLint 检查
pnpm lint:check

# ESLint 自动修复
pnpm lint

# Prettier 格式化
pnpm format
```

## 📚 查看文档

### 在线查看演示

```bash
cd packages/http-core/example
pnpm dev
# 打开 http://localhost:3000
```

### 生成 API 文档

```bash
# 如果配置了 VitePress
pnpm docs:dev
pnpm docs:build
```

## 🎯 常用命令速查

| 命令 | 说明 |
|------|------|
| `pnpm build` | 构建当前包 |
| `pnpm build:watch` | 监听模式构建 |
| `pnpm build:clean` | 清理并构建 |
| `pnpm build:analyze` | 分析打包产物 |
| `pnpm test` | 运行测试（监听模式） |
| `pnpm test:run` | 运行测试（单次） |
| `pnpm test:coverage` | 生成覆盖率报告 |
| `pnpm lint` | 代码检查并修复 |
| `pnpm lint:check` | 仅检查不修复 |
| `pnpm type-check` | TypeScript 类型检查 |
| `pnpm clean` | 清理构建产物 |

## 📦 发布检查清单

在发布前，确保完成以下检查：

```bash
# 1. 清理并构建
pnpm clean
pnpm build

# 2. 运行所有测试
pnpm test:run

# 3. 类型检查
pnpm type-check

# 4. 代码检查
pnpm lint:check

# 5. 分析打包产物
pnpm build:analyze

# 6. 检查包内容
npm pack --dry-run
```

## 🐛 常见问题

### Q1: 构建失败怎么办？

```bash
# 1. 清理缓存
pnpm clean
rm -rf node_modules
pnpm install

# 2. 检查 TypeScript 错误
pnpm type-check

# 3. 查看详细错误
ldesign-builder build --verbose
```

### Q2: 演示示例启动失败？

```bash
# 1. 确保已构建子包
cd packages/http-core
pnpm build

# 2. 安装演示依赖
cd example
pnpm install

# 3. 启动开发服务器
pnpm dev
```

### Q3: 如何调试构建过程？

```bash
# 使用 verbose 模式
ldesign-builder build --verbose

# 检查生成的文件
ls -lh es/
ls -lh lib/
ls -lh dist/
```

## 🔗 相关资源

- [完整文档](./README.md)
- [开发指南](./DEVELOPMENT.md)
- [迁移指南](./MIGRATION_GUIDE.md)
- [子包总览](./packages/README.md)
- [优化报告](./packages/OPTIMIZATION_REPORT.md)

## 💡 下一步

1. 📖 阅读 [开发指南](./DEVELOPMENT.md) 了解详细开发流程
2. 🎯 查看 [子包总览](./packages/README.md) 了解各包功能
3. 🚀 运行演示示例了解实际用法
4. 🔧 开始开发你的第一个功能

---

祝你开发愉快！🎉

如有问题，请查阅文档或提交 Issue。
