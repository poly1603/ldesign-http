# 更新日志

所有重要的变更都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- React 集成支持
- Vue2 兼容性
- GraphQL 适配器
- WebSocket 支持
- 更多缓存策略

## [1.0.0] - 2024-01-20

### 新增
- 🎉 首次发布
- 🎯 多适配器支持（Fetch、Axios、Alova）
- ⚡ Vue3 深度集成
- 🔧 TypeScript 优先设计
- 💾 智能缓存系统
- 🔄 智能重试机制
- 🛡️ 强大的拦截器系统
- 📊 进度监控支持
- 🚫 请求取消功能
- 🎨 插件系统架构
- 📡 事件系统

### 核心功能
- `createHttpClient` - 创建HTTP客户端
- `createQuickClient` - 快速创建预配置客户端
- 多种适配器工厂函数
- Vue3 组合式函数（`useRequest`、`useGet`、`usePost`等）
- 缓存插件（内存、localStorage、sessionStorage）
- 重试插件（固定、指数退避、线性增长）
- 拦截器插件（认证、日志、错误处理）

### 适配器支持
- **FetchAdapter** - 基于原生 fetch API
- **AxiosAdapter** - 基于 axios 库
- **AlovaAdapter** - 基于 alova 库

### Vue3 集成
- `createHttpPlugin` - Vue3 插件
- `useHttp` - 获取全局客户端
- `useRequest` - 通用请求组合式函数
- `useGet`、`usePost`、`usePut`、`useDelete` - HTTP方法组合式函数
- 响应式状态管理
- 自动请求取消（组件卸载时）

### 插件系统
- 可扩展的插件架构
- 标准化的插件接口
- 生命周期钩子支持
- 内置常用插件

### 缓存功能
- 多种存储策略
- 自定义缓存键生成
- TTL（生存时间）支持
- 缓存清理机制

### 重试功能
- 多种重试策略
- 自定义重试条件
- 延迟抖动支持
- 最大延迟限制

### 拦截器
- 请求拦截器
- 响应拦截器
- 错误拦截器
- 内置常用拦截器

### 类型支持
- 完整的 TypeScript 类型定义
- 泛型支持
- 类型推断
- 智能提示

### 构建输出
- ES Module 格式
- CommonJS 格式
- UMD 格式
- TypeScript 声明文件
- Tree-shaking 支持

### 文档
- 完整的使用文档
- API 参考
- 实际示例
- 最佳实践指南
- 迁移指南

## [0.9.0] - 2024-01-15

### 新增
- 🚧 Beta 版本发布
- 核心架构设计
- 基础HTTP客户端实现
- Fetch适配器实现

### 变更
- 重构适配器接口
- 优化类型定义

### 修复
- 修复请求取消问题
- 修复类型推断错误

## [0.8.0] - 2024-01-10

### 新增
- 🚧 Alpha 版本发布
- 基础项目结构
- 核心类型定义
- 基础测试框架

### 开发环境
- 配置 TypeScript
- 配置 Rollup 构建
- 配置 Vitest 测试
- 配置 ESLint 和 Prettier

## 版本说明

### 语义化版本

我们遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **主版本号**：当你做了不兼容的 API 修改
- **次版本号**：当你做了向下兼容的功能性新增
- **修订号**：当你做了向下兼容的问题修正

### 发布周期

- **主版本**：重大功能更新或破坏性变更
- **次版本**：新功能添加，每月发布
- **修订版本**：Bug修复，按需发布

### 支持政策

- **当前版本**：完全支持，包括新功能和Bug修复
- **前一个主版本**：仅Bug修复，持续6个月
- **更早版本**：不再维护

### 破坏性变更

所有破坏性变更都会在主版本更新中进行，并会提前在文档中说明：

1. **弃用警告**：在次版本中添加弃用警告
2. **迁移指南**：提供详细的迁移步骤
3. **过渡期**：至少一个主版本的过渡期
4. **移除**：在下一个主版本中移除

### 实验性功能

标记为 `experimental` 的功能：
- 可能在任何版本中发生变更
- 不遵循语义化版本规范
- 建议仅在测试环境中使用

### 获取更新

- [GitHub Releases](https://github.com/your-org/ldesign/releases)
- [npm 包](https://www.npmjs.com/package/@ldesign/http)
- [更新通知](https://github.com/your-org/ldesign/discussions)

### 贡献

欢迎贡献代码和反馈：
- [提交 Issue](https://github.com/your-org/ldesign/issues)
- [提交 PR](https://github.com/your-org/ldesign/pulls)
- [参与讨论](https://github.com/your-org/ldesign/discussions)

---

感谢所有贡献者的支持！ 🙏
