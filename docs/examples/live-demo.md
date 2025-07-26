# 在线演示

这里展示了 @ldesign/http 的所有交互式组件和功能演示。

## 🚀 完整的 API 测试工具

这是一个功能完整的 HTTP 请求测试工具，支持所有 HTTP 方法、请求配置、文件上传等功能：

<ApiTester />

## 📁 文件上传组件

专门的文件上传组件，支持拖拽上传、进度显示、Base64 预览等功能：

### 基础文件上传

<FileUploader
  :max-file-size="5242880"
  :max-files="3"
  accepted-types="image/*"
  :auto-upload="false"
/>

### 带 Base64 预览的上传

<FileUploader
  :max-file-size="2097152"
  :max-files="2"
  accepted-types="image/jpeg,image/png"
  :show-base64-preview="true"
  :auto-upload="true"
/>

## 🎯 使用场景演示

### 1. RESTful API 测试

使用 API 测试工具测试标准的 RESTful API：

**推荐测试端点：**
- `GET https://jsonplaceholder.typicode.com/users` - 获取用户列表
- `GET https://jsonplaceholder.typicode.com/posts/1` - 获取单个文章
- `POST https://jsonplaceholder.typicode.com/posts` - 创建新文章

**POST 请求示例数据：**
```json
{
  "title": "测试文章",
  "body": "这是一篇测试文章的内容",
  "userId": 1
}
```

### 2. GitHub API 测试

测试 GitHub 的公开 API：

**推荐测试端点：**
- `GET https://api.github.com/users/octocat` - 获取用户信息
- `GET https://api.github.com/repos/microsoft/vscode` - 获取仓库信息
- `GET https://api.github.com/search/repositories?q=vue` - 搜索仓库

**请求头设置：**
```
Accept: application/vnd.github.v3+json
User-Agent: @ldesign/http-demo
```

## 📚 学习建议

### 新手用户

1. 从简单的 GET 请求开始
2. 尝试添加查询参数
3. 测试 POST 请求和请求体
4. 学习使用请求头

### 进阶用户

1. 测试文件上传功能
2. 使用认证功能
3. 启用缓存和重试
4. 分析请求性能

---

**提示：** 这些演示组件都是实时运行的，你可以直接在文档中测试真实的 API 请求。请注意不要发送敏感信息到公开的测试端点。
