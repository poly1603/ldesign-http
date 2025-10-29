# HTTP 包重构快速指南

> 5 分钟了解重构方案,30 分钟开始执行

---

## 🎯 核心问题

当前 `packages/http/` 存在严重的结构问题:

1. **重复包** - 8 个 `http-*` 包与新架构包重复
2. **代码混乱** - `src/` 和 `packages/` 功能重复
3. **文档过多** - 23+ 个过时文档

---

## ✨ 重构目标

### 之前 (混乱)

```
packages/http/
├── src/                    # 所有功能都在这里
├── packages/
│   ├── core/              # ✅ 新架构
│   ├── http-core/         # ❌ 重复
│   ├── http-adapters/     # ❌ 重复
│   ├── http-vue/          # ❌ 重复
│   └── ... (8个重复包)
```

### 之后 (清晰)

```
packages/http/
├── src/
│   ├── index.ts           # 主入口 (重新导出)
│   └── index.core.ts      # 核心入口
├── packages/
│   ├── core/              # ✅ 核心包 (框架无关)
│   ├── react/             # ✅ React 适配器
│   ├── vue/               # ✅ Vue 适配器
│   ├── solid/             # ✅ Solid 适配器
│   └── svelte/            # ✅ Svelte 适配器
```

---

## 📋 重构步骤

### 第 1 步: 备份 (5 分钟)

```bash
# 创建备份分支
git checkout -b backup/before-refactoring
git push origin backup/before-refactoring

# 创建重构分支
git checkout -b refactor/http-structure
```

### 第 2 步: 合并核心包 (30 分钟)

**自动化方式** (推荐):

```bash
# 先预览
node scripts/refactor.js --dry-run

# 确认后执行
node scripts/refactor.js
```

**手动方式**:

```bash
# 1. 合并适配器
cp -r packages/http-adapters/src/* packages/core/src/adapters/
cp -r src/adapters/* packages/core/src/adapters/

# 2. 合并拦截器
cp -r packages/http-interceptors/src/* packages/core/src/interceptors/
cp -r src/interceptors/* packages/core/src/interceptors/

# 3. 合并特性
cp -r packages/http-features/src/* packages/core/src/features/
cp -r src/features/* packages/core/src/features/

# 4. 合并工具
cp -r packages/http-utils/src/* packages/core/src/utils/
cp -r src/utils/* packages/core/src/utils/

# 5. 合并其他
cp -r src/types/* packages/core/src/types/
cp -r src/devtools/* packages/core/src/devtools/
cp -r src/presets/* packages/core/src/presets/
```

### 第 3 步: 合并 Vue 适配器 (10 分钟)

```bash
# 合并 Vue 代码
cp -r src/vue/* packages/vue/src/composables/
cp -r packages/http-vue/src/* packages/vue/src/
```

### 第 4 步: 删除重复 (10 分钟)

```bash
# 删除重复包
rm -rf packages/http-core
rm -rf packages/http-adapters
rm -rf packages/http-interceptors
rm -rf packages/http-features
rm -rf packages/http-utils
rm -rf packages/http-vue
rm -rf packages/http-devtools
rm -rf packages/http-presets

# 删除已迁移代码
rm -rf src/adapters
rm -rf src/core
rm -rf src/features
rm -rf src/interceptors
rm -rf src/utils
rm -rf src/vue
rm -rf src/types
rm -rf src/devtools
rm -rf src/presets

# 删除过时文档
rm -f HTTP包*.md
rm -f QUICK_START*.md
rm -f 优化*.md
rm -f *.md (所有优化相关)
```

### 第 5 步: 验证 (20 分钟)

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm -r build

# 运行测试
pnpm -r test

# 测试示例
cd examples/react && pnpm dev
cd examples/vue3 && pnpm dev
```

---

## 📦 核心包结构

重构后的核心包结构:

```
packages/core/src/
├── client/              # HTTP 客户端
├── adapters/            # 适配器 (Fetch, Axios, Alova)
├── interceptors/        # 拦截器系统
├── cache/               # 缓存系统
├── retry/               # 重试机制
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
├── devtools/            # 开发工具
├── presets/             # 预设配置
├── types/               # 类型定义
├── utils/               # 工具函数
└── index.ts             # 主入口
```

---

## 🔌 框架适配器

### React

```typescript
import { useHttp, useQuery, useMutation } from '@ldesign/http-react'

function UserList() {
  const { data, loading } = useQuery('/api/users')
  return <div>{data?.map(u => u.name)}</div>
}
```

### Vue

```typescript
import { useHttp, useQuery, useMutation } from '@ldesign/http-vue'

const { data, loading } = useQuery('/api/users')
```

### Solid

```typescript
import { createQuery, createMutation } from '@ldesign/http-solid'

const [data] = createQuery(() => '/api/users')
```

### Svelte

```typescript
import { createQueryStore } from '@ldesign/http-svelte'

const users = createQueryStore('/api/users', fetcher)
```

---

## ⚠️ 注意事项

### 破坏性变更

1. **导入路径变化**
   ```typescript
   // 旧
   import { FetchAdapter } from '@ldesign/http-adapters'
   
   // 新
   import { FetchAdapter } from '@ldesign/http-core/adapters'
   ```

2. **包名变化**
   - 所有 `http-*` 包合并到 `http-core`
   - 框架适配器保持独立

### 迁移建议

1. 使用主包重新导出保持兼容:
   ```typescript
   // @ldesign/http/index.ts
   export * from '@ldesign/http-core'
   ```

2. 提供迁移指南和工具

---

## 📊 预期收益

### 代码质量
- ✅ 删除 100+ 个重复文件
- ✅ 清晰的模块边界
- ✅ 更好的可维护性

### 包体积
- ✅ 核心包: ~30KB (gzipped)
- ✅ 框架适配器: ~5KB 每个

### 开发体验
- ✅ 更清晰的 API
- ✅ 更好的类型提示
- ✅ 按需导入

---

## 📚 详细文档

- [完整重构方案](./REFACTORING_PLAN.md) - 详细的设计和实现
- [文件迁移清单](./MIGRATION_CHECKLIST.md) - 所有文件的迁移路径
- [重构总结](./REFACTORING_SUMMARY.md) - 问题分析和解决方案

---

## 🚀 立即开始

```bash
# 1. 备份
git checkout -b backup/before-refactoring
git push origin backup/before-refactoring

# 2. 创建重构分支
git checkout -b refactor/http-structure

# 3. 运行自动化脚本
node scripts/refactor.js --dry-run  # 先预览
node scripts/refactor.js            # 执行

# 4. 验证
pnpm install
pnpm -r build
pnpm -r test

# 5. 提交
git add .
git commit -m "refactor: 重构 HTTP 包结构"
git push origin refactor/http-structure
```

---

## 💡 提示

1. **先预览** - 使用 `--dry-run` 查看将要执行的操作
2. **分步执行** - 可以分阶段执行,每个阶段单独提交
3. **保留备份** - 确保备份分支已推送到远程
4. **测试充分** - 每个阶段都要运行测试
5. **文档同步** - 及时更新文档

---

## 🆘 遇到问题?

1. 查看详细文档: [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)
2. 检查迁移清单: [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)
3. 回滚到备份分支: `git checkout backup/before-refactoring`


