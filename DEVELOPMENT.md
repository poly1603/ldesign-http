# 开发指南 - @ldesign/http

本指南帮助你在本地开发和贡献 `@ldesign/http` 项目。

## 🛠️ 开发环境设置

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
# 在项目根目录
pnpm install

# 或者在 packages/http 目录
cd packages/http
pnpm install
```

## 📁 项目结构

```
packages/http/
├── packages/              # 子包目录
│   ├── http-core/        # 核心包
│   ├── http-adapters/    # 适配器包
│   ├── http-interceptors/# 拦截器包
│   ├── http-features/    # 特性包
│   ├── http-utils/       # 工具包
│   ├── http-vue/         # Vue集成包
│   ├── http-devtools/    # 开发工具包
│   └── http-presets/     # 预设包
├── scripts/              # 构建和开发脚本
│   ├── build-all.js     # 批量构建脚本
│   └── analyze-bundle.js # 打包分析脚本
├── ldesign.config.ts     # Builder 配置
├── package.json
└── README.md
```

## 🔨 开发工作流

### 1. 开发单个子包

```bash
# 进入子包目录
cd packages/http-core

# 安装依赖（如果需要）
pnpm install

# 开发模式（监听文件变化）
pnpm build:watch

# 或使用 builder 的监听模式
ldesign-builder build --watch
```

### 2. 运行演示示例

```bash
# 进入示例目录
cd packages/http-core/example

# 启动开发服务器
pnpm dev

# 浏览器会自动打开 http://localhost:3000
```

### 3. 构建子包

```bash
# 构建单个包
cd packages/http-core
pnpm build

# 构建时指定格式
pnpm build -f esm,cjs,dts

# 清理并构建
pnpm build:clean

# 分析打包产物
pnpm build:analyze
```

### 4. 构建所有子包

```bash
# 在 packages/http 目录下
node scripts/build-all.js

# 或使用 pnpm workspace 命令
pnpm -r --filter "./packages/**" build
```

## 🧪 测试

### 单元测试

```bash
# 运行测试
pnpm test

# 监听模式
pnpm test:watch

# 运行单次测试
pnpm test:run

# 生成覆盖率报告
pnpm test:coverage
```

### 类型检查

```bash
# TypeScript 类型检查
pnpm type-check
```

### 代码检查

```bash
# ESLint 检查
pnpm lint:check

# ESLint 自动修复
pnpm lint

# Prettier 格式化
pnpm format
```

## 📝 代码规范

### TypeScript

- 使用严格模式
- 所有导出的函数必须有类型注解
- 优先使用 `interface` 而不是 `type`（除非需要联合类型）
- 避免使用 `any`，使用 `unknown` 或具体类型

```typescript
// ✅ 推荐
export interface HttpClient {
  request<T>(config: RequestConfig): Promise<ResponseData<T>>
}

// ❌ 避免
export const client: any = {}
```

### 命名规范

- 文件名：kebab-case (`http-client.ts`)
- 类名：PascalCase (`HttpClient`)
- 函数名：camelCase (`createClient`)
- 常量：UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- 类型/接口：PascalCase (`RequestConfig`)

### 注释规范

使用 JSDoc 格式：

```typescript
/**
 * 创建 HTTP 客户端实例
 * 
 * @param config - 客户端配置
 * @param adapter - HTTP 适配器
 * @returns HTTP 客户端实例
 * 
 * @example
 * ```typescript
 * const client = createHttpClient(config, new FetchAdapter())
 * ```
 */
export function createHttpClient(
  config: HttpClientConfig,
  adapter: HttpAdapter,
): HttpClient {
  // ...
}
```

## 🏗️ 添加新功能

### 1. 在现有子包中添加功能

```bash
# 1. 进入相应的子包
cd packages/http-core

# 2. 在 src/ 目录下添加新文件
# src/new-feature.ts

# 3. 在 src/index.ts 中导出
export * from './new-feature'

# 4. 添加测试
# src/new-feature.test.ts

# 5. 构建和测试
pnpm build
pnpm test
```

### 2. 创建新的子包

```bash
# 1. 创建子包目录结构
mkdir -p packages/http-new-feature/src

# 2. 创建 package.json
# 参考其他子包的 package.json

# 3. 创建 ldesign.config.ts
# 参考其他子包的配置

# 4. 创建 tsconfig.json
# 继承根目录的 tsconfig.json

# 5. 实现功能
# packages/http-new-feature/src/index.ts

# 6. 创建演示示例
mkdir -p packages/http-new-feature/example

# 7. 构建和测试
cd packages/http-new-feature
pnpm build
pnpm test
```

## 📦 发布流程

### 版本管理

使用语义化版本：

- **Major (x.0.0)**: 破坏性变更
- **Minor (0.x.0)**: 新功能（向后兼容）
- **Patch (0.0.x)**: Bug 修复

### 发布前检查

```bash
# 1. 运行所有检查
pnpm lint:check
pnpm type-check
pnpm test:run

# 2. 构建所有包
node scripts/build-all.js

# 3. 检查打包产物
pnpm build:analyze
```

### 发布步骤

```bash
# 1. 更新版本号
# 手动修改 package.json 中的 version

# 2. 更新 CHANGELOG.md
# 记录本次更新的内容

# 3. 提交更改
git add .
git commit -m "chore: release vX.X.X"

# 4. 创建标签
git tag vX.X.X

# 5. 推送到远程
git push origin main --tags

# 6. 发布到 npm (如果是公开包)
pnpm publish --access public
```

## 🐛 调试技巧

### 1. 使用 Debugger

在 VSCode 中添加 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 2. 查看构建输出

```bash
# 详细输出
ldesign-builder build --verbose

# 查看生成的文件
ls -lh es/
ls -lh lib/
ls -lh dist/
```

### 3. 分析依赖

```bash
# 查看依赖树
pnpm list --depth=0

# 检查重复依赖
pnpm dedupe
```

## 📚 相关资源

- [Builder 文档](../../tools/builder/README.md)
- [Launcher 文档](../../tools/launcher/README.md)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Vitest 文档](https://vitest.dev/)
- [pnpm Workspace](https://pnpm.io/workspaces)

## 💡 常见问题

### Q: 如何同时开发多个子包？

A: 使用 Builder 的监听模式在多个终端窗口中运行：

```bash
# 终端 1
cd packages/http-core && pnpm build:watch

# 终端 2
cd packages/http-adapters && pnpm build:watch

# 终端 3
cd packages/http-core/example && pnpm dev
```

### Q: 如何解决循环依赖？

A: 避免子包之间的循环依赖。如果需要共享功能，将其提取到 `http-utils` 或 `http-core`。

### Q: 构建失败怎么办？

A: 尝试以下步骤：
1. 清理构建产物：`pnpm clean`
2. 删除 node_modules：`rm -rf node_modules && pnpm install`
3. 检查 TypeScript 错误：`pnpm type-check`
4. 查看详细错误信息：`ldesign-builder build --verbose`

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 遵循代码规范
4. 添加测试
5. 更新文档
6. 提交更改 (`git commit -m 'feat: add amazing feature'`)
7. 推送到分支 (`git push origin feature/amazing-feature`)
8. 创建 Pull Request

---

感谢你的贡献！🎉


