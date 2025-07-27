# 贡献指南

感谢你对 @ldesign/http 的关注！我们欢迎所有形式的贡献。

## 🤝 如何贡献

### 报告问题

如果你发现了bug或有功能建议：

1. 检查 [现有Issues](https://github.com/your-org/ldesign/issues) 是否已有相关问题
2. 如果没有，请 [创建新Issue](https://github.com/your-org/ldesign/issues/new)
3. 使用合适的Issue模板
4. 提供详细的描述和复现步骤

### 提交代码

1. **Fork 仓库**
   ```bash
   # 克隆你的fork
   git clone https://github.com/your-username/ldesign.git
   cd ldesign
   ```

2. **创建分支**
   ```bash
   # 创建功能分支
   git checkout -b feature/your-feature-name

   # 或者创建修复分支
   git checkout -b fix/issue-number
   ```

3. **安装依赖**
   ```bash
   pnpm install
   ```

4. **开发和测试**
   ```bash
   # 进入http包目录
   cd packages/http

   # 开发模式
   pnpm dev

   # 运行测试
   pnpm test

   # 构建
   pnpm build
   ```

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

6. **推送并创建PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 开发规范

### 代码风格

我们使用 ESLint 和 Prettier 来保持代码风格一致：

```bash
# 检查代码风格
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化代码
pnpm format
```

### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型 (type):**
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例:**
```
feat(http): add retry mechanism
fix(vue): resolve memory leak in useRequest
docs: update getting started guide
test: add unit tests for cache plugin
```

### TypeScript 规范

- 使用严格的TypeScript配置
- 为所有公共API提供类型定义
- 避免使用 `any` 类型
- 使用泛型提供类型安全

```typescript
// ✅ 好的示例
interface RequestConfig<T = any> {
  url: string
  method?: HttpMethod
  data?: T
}

// ❌ 避免的示例
interface RequestConfig {
  url: string
  method?: any
  data?: any
}
```

### 测试规范

- 为新功能编写单元测试
- 保持测试覆盖率在90%以上
- 使用描述性的测试名称
- 测试边界情况和错误场景

```typescript
describe('HttpClient', () => {
  it('should send GET request successfully', async () => {
    // 测试实现
  })

  it('should handle network errors gracefully', async () => {
    // 错误处理测试
  })
})
```

## 🏗️ 项目结构

```
packages/http/
├── src/
│   ├── types/           # 类型定义
│   ├── core/            # 核心实现
│   ├── adapters/        # 适配器
│   ├── plugins/         # 插件
│   ├── vue/             # Vue集成
│   └── index.ts         # 主入口
├── __tests__/           # 测试文件
├── docs/                # 文档
├── examples/            # 示例
└── package.json
```

### 添加新功能

1. **核心功能** - 添加到 `src/core/`
2. **适配器** - 添加到 `src/adapters/`
3. **插件** - 添加到 `src/plugins/`
4. **Vue集成** - 添加到 `src/vue/`
5. **类型定义** - 更新 `src/types/`

### 添加新适配器

1. 实现 `HttpAdapter` 接口
2. 添加工厂函数
3. 添加类型定义
4. 编写单元测试
5. 更新文档

```typescript
// 示例：新适配器实现
export class CustomAdapter implements HttpAdapter {
  async request<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    // 实现逻辑
  }

  cancel(): void {
    // 取消逻辑
  }

  getName(): string {
    return 'custom'
  }
}
```

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test HttpClient.test.ts

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 监听模式
pnpm test:watch
```

### 测试类型

1. **单元测试** - 测试单个函数或类
2. **集成测试** - 测试组件间的交互
3. **端到端测试** - 测试完整的用户场景

### Mock 和 Stub

使用 Vitest 的内置mock功能：

```typescript
import { vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

// Mock 模块
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn()
    }))
  }
}))
```

## 📚 文档贡献

### 文档结构

- **指南** (`docs/guide/`) - 教程和指南
- **API参考** (`docs/api/`) - API文档
- **示例** (`docs/examples/`) - 使用示例
- **插件** (`docs/plugins/`) - 插件文档

### 文档规范

- 使用清晰的标题结构
- 提供代码示例
- 包含实际的使用场景
- 保持内容更新

### 本地预览

```bash
# 启动文档服务
pnpm docs:dev

# 构建文档
pnpm docs:build

# 预览构建结果
pnpm docs:preview
```

## 🔄 发布流程

### 版本管理

1. 更新版本号（遵循语义化版本）
2. 更新 CHANGELOG.md
3. 创建 Git 标签
4. 发布到 npm

### 发布检查清单

- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] CHANGELOG 已更新
- [ ] 版本号已更新
- [ ] 构建成功

## 🎯 开发环境设置

### 必需工具

- Node.js >= 16
- pnpm >= 7
- Git

### 推荐工具

- VS Code
- TypeScript 扩展
- ESLint 扩展
- Prettier 扩展

### 环境配置

```bash
# 克隆仓库
git clone https://github.com/your-org/ldesign.git
cd ldesign

# 安装依赖
pnpm install

# 进入http包
cd packages/http

# 开发模式
pnpm dev
```

## 🤔 需要帮助？

- [GitHub Discussions](https://github.com/your-org/ldesign/discussions) - 提问和讨论
- [GitHub Issues](https://github.com/your-org/ldesign/issues) - 报告问题
- [Discord](https://discord.gg/ldesign) - 实时聊天

## 📄 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](https://github.com/your-org/ldesign/blob/main/LICENSE) 下发布。

---

感谢你的贡献！ 🙏
