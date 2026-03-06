<script setup lang="ts">
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from 'lucide-vue-next'
import { usePagination } from '@ldesign/http-vue'

const {
  data, loading, error, page, pageSize, total, totalPages,
  hasPrev, hasNext, next, prev, goto, refresh, reset, setPageSize,
} = usePagination<any>('/api/posts', {
  pageSize: 5,
  immediate: true,
  totalParamName: 'total',
  dataParamName: 'data',
})

function changePageSize(size: number) {
  setPageSize(size)
}
</script>

<template>
  <div class="demo-page">
    <h2>usePagination 分页</h2>
    <p class="page-desc">
      标准分页数据加载 Hook，支持上一页/下一页/跳转、自动提取 total、响应式页码。
    </p>

    <div class="card">
      <h3>文章列表分页</h3>
      <div class="flex items-center gap-2 mb-2">
        <span v-if="loading" class="badge badge-loading"><span class="spinner" /> 加载中...</span>
        <span v-else class="badge badge-success">第 {{ page }} / {{ totalPages }} 页</span>
        <span class="text-xs text-secondary">共 {{ total }} 条</span>
      </div>

      <table v-if="data.length" class="data-table mb-4">
        <thead>
          <tr><th>ID</th><th>标题</th><th>内容</th></tr>
        </thead>
        <tbody>
          <tr v-for="post in data" :key="post.id">
            <td>{{ post.id }}</td>
            <td>{{ post.title }}</td>
            <td class="text-secondary text-sm">{{ post.body }}</td>
          </tr>
        </tbody>
      </table>

      <div class="btn-group">
        <button class="btn btn-sm" :disabled="!hasPrev || loading" @click="goto(1)">
          <ChevronsLeft :size="14" /> 首页
        </button>
        <button class="btn btn-sm" :disabled="!hasPrev || loading" @click="prev">
          <ChevronLeft :size="14" /> 上一页
        </button>
        <button class="btn btn-sm" :disabled="!hasNext || loading" @click="next">
          下一页 <ChevronRight :size="14" />
        </button>
        <button class="btn btn-sm" :disabled="!hasNext || loading" @click="goto(totalPages)">
          末页 <ChevronsRight :size="14" />
        </button>
        <button class="btn btn-sm" @click="refresh">
          <RefreshCw :size="14" /> 刷新
        </button>
      </div>

      <div class="flex items-center gap-2 mt-2">
        <span class="text-sm text-secondary">每页:</span>
        <button v-for="size in [5, 10, 20]" :key="size" class="btn btn-sm" :class="{ 'btn-primary': pageSize === size }" @click="changePageSize(size)">
          {{ size }}
        </button>
      </div>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>usePagination</code> 封装了标准的分页逻辑：自动构建分页请求参数、从响应中提取数据和总数、
        计算总页数、维护当前页状态。支持监听 URL 变化自动重置。
      </p>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { usePagination } from '@ldesign/http-vue'

const {
  data,         // Ref&lt;T[]&gt; - 当前页数据
  loading,      // Ref&lt;boolean&gt;
  error,        // Ref&lt;Error | null&gt;
  page,         // Ref&lt;number&gt; - 当前页码
  pageSize,     // Ref&lt;number&gt; - 每页数量
  total,        // Ref&lt;number&gt; - 总数据量
  totalPages,   // ComputedRef&lt;number&gt; - 总页数
  hasPrev,      // ComputedRef&lt;boolean&gt;
  hasNext,      // ComputedRef&lt;boolean&gt;
  next,         // () => Promise - 下一页
  prev,         // () => Promise - 上一页
  goto,         // (page) => Promise - 跳转
  refresh,      // () => Promise - 刷新当前页
  reset,        // () => Promise - 重置到第一页
  setPageSize,  // (size) => Promise - 修改每页数量
} = usePagination('/api/posts', {
  pageSize: 10,
  immediate: true,
  totalParamName: 'total',   // 从响应中提取总数的字段名
  dataParamName: 'data',     // 从响应中提取数据的字段名
  pageParamName: 'page',     // 请求参数中的页码字段名
  pageSizeParamName: 'pageSize',
  onPageChange: (page, size) => {},
  onDataLoaded: (data, total) => {},
})</pre>
    </div>
  </div>
</template>
