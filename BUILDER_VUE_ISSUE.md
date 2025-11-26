# @ldesign/builder Vue支持问题

## 问题描述

`@ldesign/builder`工具声称支持`libraryType: 'vue3'`,但实际无法构建包含`.vue`文件的项目。

## 错误信息

```
Rollup 构建失败: src/components/HttpLoader/HttpLoader.vue (1:0): 
Expression expected (Note that you need plugins to import files that are not JavaScript)
```

## 根本原因

builder使用Rollup作为bundler,但没有自动配置`@vitejs/plugin-vue`插件来处理`.vue`文件。

## 已尝试的解决方案

### 1. 配置`plugins`字段 ❌
```typescript
export default defineConfig({
  libraryType: 'vue3',
  plugins: [vue() as any]
})
```
结果: builder忽略此配置

### 2. 配置`rollup.plugins` ❌
```typescript
export default defineConfig({
  libraryType: 'vue3',
  rollup: {
    plugins: [vue() as Plugin]
  }
})
```
结果: builder忽略此配置

### 3. 使用`bundler: 'vite'` ❌
```typescript
export default defineConfig({
  libraryType: 'vue3',
  bundler: 'vite'
})
```
结果: builder仍使用Rollup

## 临时解决方案

使用Vite直接构建Vue包:

1. 创建`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs', 'umd']
    }
  }
})
```

2. 修改package.json:
```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

## 建议的修复方案

### 方案1: 自动注入Vue插件
当检测到`libraryType: 'vue3'`时,builder应自动添加`@vitejs/plugin-vue`:

```typescript
// builder内部逻辑
if (config.libraryType === 'vue3') {
  const vue = require('@vitejs/plugin-vue')
  rollupConfig.plugins.push(vue())
}
```

### 方案2: 支持插件配置
允许用户通过配置传递Rollup插件:

```typescript
export interface BuilderConfig {
  rollupPlugins?: Plugin[]
  // 或
  rollup?: {
    plugins?: Plugin[]
  }
}
```

### 方案3: 切换到Vite
当`bundler: 'vite'`时,真正使用Vite而不是Rollup。

## 影响范围

所有使用`@ldesign/builder`构建Vue3项目的包都会遇到这个问题。

## 优先级

**高** - 这是一个阻塞性bug,使得`libraryType: 'vue3'`配置完全无法使用。

## 相关依赖

- `@vitejs/plugin-vue`: ^5.0.3
- `rollup`: ^4.52.5
- `vite`: ^7.2.2

## 测试用例

创建一个简单的Vue组件并尝试用builder构建:

```vue
<!-- test.vue -->
<template>
  <div>Hello</div>
</template>

<script setup>
// component logic
</script>
```

预期: 构建成功
实际: 构建失败

---

**日期**: 2025-11-25
**报告人**: Roo
**状态**: 待修复