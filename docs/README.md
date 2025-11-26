# @ldesign/http 文档

本目录包含 @ldesign/http 项目的完整文档，使用 VitePress 构建。

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

启动本地开发服务器：

```bash
pnpm docs:dev
```

访问 <http://localhost:5173> 查看文档（开发服务器启动后）。

### 构建文档

构建生产版本：

```bash
pnpm docs:build
```

构建结果将输出到 `docs/.vitepress/dist` 目录。

### 预览构建结果

```bash
pnpm docs:preview
```

## 文档结构

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress 配置
├── index.md               # 首页
├── guide/                 # 指南
│   ├── introduction.md    # 介绍
│   ├── getting-started.md # 快速开始
│   ├── installation.md    # 安装
│   ├── http-client.md     # HTTP 客户端
│   ├── adapters.md        # 适配器
│   └── interceptors.md    # 拦截器
├── packages/              # 包文档
│   ├── core.md           # 核心包
│   └── vue.md            # Vue 适配器
├── api/                   # API 参考
│   └── core.md           # 核心 API
└── examples/              # 示例
    └── basic.md          # 基础示例
```

## 编写文档

### Markdown 语法

文档使用标准 Markdown 语法，支持：

- 标题
- 列表
- 代码块
- 表格
- 链接
- 图片

### 代码块

使用代码组：

```markdown
::: code-group

\`\`\`bash [pnpm]
pnpm add @ldesign/http-core
\`\`\`

\`\`\`bash [npm]
npm install @ldesign/http-core
\`\`\`

:::
```

### 提示框

```markdown
::: tip
这是一个提示
:::

::: warning
这是一个警告
:::

::: danger
这是一个危险提示
:::

::: info
这是一个信息提示
:::
```

### 自定义容器

```markdown
::: details 点击查看详情
这是详细内容
:::
```

## 部署

### GitHub Pages

1. 配置 GitHub Actions
2. 推送到 `main` 分支
3. 文档自动部署到 GitHub Pages

### 其他平台

构建后的静态文件可以部署到任何静态网站托管平台：

- Vercel
- Netlify
- Cloudflare Pages
- 阿里云 OSS
- 腾讯云 COS

## 贡献

欢迎贡献文档！

1. Fork 项目
2. 创建分支
3. 修改文档
4. 提交 PR

## 许可证

MIT License