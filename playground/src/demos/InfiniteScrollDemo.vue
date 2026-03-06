<script setup lang="ts">
import { ArrowDown, RefreshCw, RotateCcw } from 'lucide-vue-next'
import { useInfiniteScroll } from '@ldesign/http-vue'

const {
  data, pages, loading, error, hasMore, isFetchingMore, currentPage,
  loadMore, refresh, reset,
} = useInfiniteScroll<any>('/api/posts', {
  pageSize: 8,
  immediate: true,
  pageParamName: 'page',
  pageSizeParamName: 'pageSize',
})
</script>

<template>
  <div class="demo-page">
    <h2>useInfiniteScroll 无限滚动</h2>
    <p class="page-desc">
      分页数据无限滚动加载 Hook。自动拼接多页数据、判断是否有更多数据、支持刷新和重置。
    </p>

    <div class="card">
      <h3>文章列表 — 加载更多</h3>
      <div class="flex items-center gap-2 mb-2">
        <span class="badge badge-loading">已加载 {{ data.length }} 条</span>
        <span class="text-xs text-secondary">当前第 {{ currentPage }} 页</span>
      </div>

      <div v-if="data.length" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: 6px; padding: 8px;">
        <div v-for="item in data" :key="item.id" style="padding: 8px 12px; border-bottom: 1px solid var(--color-border);">
          <strong>#{{ item.id }}</strong> {{ item.title }}
          <div class="text-xs text-secondary">{{ item.body }}</div>
        </div>
      </div>

      <div class="btn-group mt-2">
        <button class="btn btn-primary" :disabled="!hasMore || loading || isFetchingMore" @click="loadMore">
          <ArrowDown :size="14" />
          {{ isFetchingMore ? '加载中...' : hasMore ? '加载更多' : '没有更多了' }}
        </button>
        <button class="btn" @click="refresh">
          <RefreshCw :size="14" /> 刷新
        </button>
        <button class="btn" @click="reset">
          <RotateCcw :size="14" /> 重置
        </button>
      </div>

      <div v-if="!hasMore && data.length" class="text-sm text-secondary mt-2">
        已加载全部数据
      </div>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>useInfiniteScroll</code> 适用于「加载更多」或无限滚动场景。
        它将多次分页请求的数据<strong>扁平化合并</strong>到一个数组中，
        并通过 <code>getNextPageParam</code> 或数据量判断是否还有更多数据。
      </p>
      <p class="text-sm text-secondary mb-2">
        <strong>与 usePagination 的区别：</strong><br>
        <code>usePagination</code> 每次只展示当前页数据，适合传统的分页表格；<br>
        <code>useInfiniteScroll</code> 累积所有已加载的数据，适合瀑布流、消息列表等场景。
      </p>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { useInfiniteScroll } from '@ldesign/http-vue'

const {
  data,             // ComputedRef&lt;T[]&gt; - 所有数据（扁平化）
  pages,            // Ref&lt;T[]&gt; - 原始分页数据
  loading,          // Ref&lt;boolean&gt;
  error,            // Ref&lt;Error | null&gt;
  hasMore,          // ComputedRef&lt;boolean&gt; - 是否有更多
  isFetchingMore,   // Ref&lt;boolean&gt; - 是否正在加载下一页
  currentPage,      // Ref&lt;number&gt; - 当前页码
  loadMore,         // () => Promise - 加载下一页
  refresh,          // () => Promise - 刷新（重新从第一页开始）
  reset,            // () => void - 重置所有状态
} = useInfiniteScroll('/api/posts', {
  pageSize: 20,
  immediate: true,
  // 自定义获取下一页参数（可选）
  getNextPageParam: (lastPage, allPages) => {
    return lastPage.nextCursor  // 返回 undefined 表示没有更多
  },
})</pre>
    </div>
  </div>
</template>
