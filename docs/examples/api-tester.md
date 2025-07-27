# API 测试工具

这是一个功能完整的交互式 HTTP 请求测试工具，让你可以直接在文档中测试各种 API 请求。

## 🚀 功能特性

- **支持所有 HTTP 方法** - GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **完整的请求配置** - URL、请求头、查询参数、请求体
- **多种请求体格式** - JSON、Form Data、Raw Text、文件上传
- **实时响应展示** - 状态码、响应头、响应数据、时间统计
- **请求历史记录** - 自动保存请求历史，支持收藏和重复使用
- **cURL 命令生成** - 一键生成等效的 cURL 命令
- **错误处理展示** - 详细的错误信息和处理建议
- **文件上传支持** - 拖拽上传、进度显示、Base64 预览
- **智能缓存** - 自动缓存 GET 请求，提高性能
- **重试机制** - 自动重试失败的请求

## 📋 使用说明

### 1. 选择 HTTP 方法
从下拉菜单中选择请求方法（GET、POST、PUT、DELETE 等）。

### 2. 输入请求 URL
在 URL 输入框中输入完整的 API 地址，例如：
- `https://jsonplaceholder.typicode.com/users`
- `https://api.github.com/users/octocat`

### 3. 配置请求参数
使用标签页配置不同类型的参数：

#### 查询参数 (Query Parameters)
添加 URL 查询参数，如 `?page=1&limit=10`

#### 请求头 (Headers)
添加 HTTP 请求头，如：
- `Content-Type: application/json`
- `Authorization: Bearer your-token`

#### 请求体 (Body)
根据需要选择不同的请求体格式：
- **JSON**: 结构化数据，自动验证格式
- **Form Data**: 表单数据，键值对格式
- **File Upload**: 文件上传，支持多文件和拖拽
- **Raw Text**: 原始文本数据

#### 配置选项 (Config)
设置请求的高级选项：
- 超时时间
- 响应类型
- 是否包含凭据
- 启用缓存/重试

### 4. 发送请求
点击"发送请求"按钮执行 HTTP 请求。

### 5. 查看响应
响应区域会显示：
- 响应状态和耗时
- 响应数据（支持 JSON 格式化）
- 响应头信息
- 原始响应数据
- 等效的 cURL 命令
- 请求时间线分析

## 🎯 交互式演示

<ApiTester />
