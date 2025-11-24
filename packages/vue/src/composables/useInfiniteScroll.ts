/**
 * 无限滚动 Hook
 * 
 * 用于实现分页数据的无限滚动加载
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useInfiniteScroll } from '@ldesign/http/vue'
 * 
 * const {
 *   data,
 *   loading,
 *   error,
 *   hasMore,
 *   loadMore,
 *   refresh,
 *   reset
 * } = useInfiniteScroll('/api/posts', {
 *   pageSize: 20,
 *   getNextPageParam: (lastPage, pages) => lastPage.nextCursor
 * })
 * </script>
 * 
 * <template>
 *   <div>
 *     <div v-for="item in data" :key="item.id">{{ item.title }}</div>
 *     <button @click="loadMore" :disabled="!hasMore || loading">
 *       加载更多
 *     </button>
 *   </div>
 * </template>
 * ```
 */

import { computed, ref, unref } from 'vue'
import type { MaybeRef } from 'vue'
import { useHttp as useHttpStandalone } from './useHttpStandalone'
import type { RequestConfig } from '@ldesign/http-core'

export interface InfiniteScrollOptions<T = any> {
  /**
   * 每页数据量
   */
  pageSize?: number

  /**
   * 初始页码
   */
  initialPage?: number

  /**
   * 是否立即加载第一页
   */
  immediate?: boolean

  /**
   * 获取下一页参数的函数
   * @param lastPage 最后一页的数据
   * @param allPages 所有页的数据
   * @returns 下一页的参数，返回 undefined 表示没有更多数据
   */
  getNextPageParam?: (lastPage: T, allPages: T[]) => any

  /**
   * 数据转换函数
   */
  transform?: (data: any) => T

  /**
   * 请求配置
   */
  requestConfig?: RequestConfig

  /**
   * 页码参数名称
   */
  pageParamName?: string

  /**
   * 每页大小参数名称
   */
  pageSizeParamName?: string
}

export interface UseInfiniteScrollReturn<T = any> {
  /**
   * 所有加载的数据（扁平化）
   */
  data: ReturnType<typeof computed<T[]>>

  /**
   * 原始分页数据
   */
  pages: ReturnType<typeof ref<T[]>>

  /**
   * 加载状态
   */
  loading: ReturnType<typeof ref<boolean>>

  /**
   * 错误信息
   */
  error: ReturnType<typeof ref<Error | null>>

  /**
   * 是否有更多数据
   */
  hasMore: ReturnType<typeof computed<boolean>>

  /**
   * 是否正在加载更多
   */
  isFetchingMore: ReturnType<typeof ref<boolean>>

  /**
   * 当前页码
   */
  currentPage: ReturnType<typeof ref<number>>

  /**
   * 加载更多数据
   */
  loadMore: () => Promise<void>

  /**
   * 刷新数据（重新加载第一页）
   */
  refresh: () => Promise<void>

  /**
   * 重置所有数据
   */
  reset: () => void
}

/**
 * 无限滚动 Hook
 */
export function useInfiniteScroll<T = any>(
  url: MaybeRef<string>,
  options: InfiniteScrollOptions<T> = {},
): UseInfiniteScrollReturn<T> {
  const {
    pageSize = 20,
    initialPage = 1,
    immediate = true,
    getNextPageParam,
    transform,
    requestConfig = {},
    pageParamName = 'page',
    pageSizeParamName = 'pageSize',
  } = options

  const pages = ref<T[]>([])
  const loading = ref(false)
  const isFetchingMore = ref(false)
  const error = ref<Error | null>(null)
  const currentPage = ref(initialPage)
  const nextPageParam = ref<any>(initialPage)
  const hasMoreData = ref(true)

  const { get: execute } = useHttpStandalone()

  // 扁平化的数据
  const data = computed(() => {
    if (Array.isArray(pages.value[0])) {
      // 如果每页是数组，扁平化
      return pages.value.flat() as T[]
    }
    // 如果每页是对象，返回 items 字段
    return pages.value.flatMap((page: any) => {
      if (Array.isArray(page?.items)) {
        return page.items
      }
      if (Array.isArray(page?.data)) {
        return page.data
      }
      return page
    }) as T[]
  })

  const hasMore = computed(() => {
    return hasMoreData.value && !loading.value
  })

  /**
   * 加载指定页
   */
  const fetchPage = async (page: number | any) => {
    try {
      const urlValue = unref(url)

      // 构建请求参数
      const params = {
        ...requestConfig.params,
      }

      // 添加分页参数
      if (typeof page === 'number') {
        params[pageParamName] = page
        params[pageSizeParamName] = pageSize
      }
      else {
        // 使用自定义的下一页参数
        Object.assign(params, page)
      }

      const response = await execute<any>(urlValue, {
        ...requestConfig,
        params,
      })

      let pageData = response
      if (transform) {
        pageData = transform(pageData)
      }

      return pageData
    }
    catch (err) {
      error.value = err as Error
      throw err
    }
  }

  /**
   * 加载更多数据
   */
  const loadMore = async () => {
    if (!hasMoreData.value || loading.value || isFetchingMore.value) {
      return
    }

    isFetchingMore.value = true
    error.value = null

    try {
      const pageData = await fetchPage(nextPageParam.value)
      pages.value.push(pageData)

      // 计算下一页参数
      if (getNextPageParam) {
        const next = getNextPageParam(pageData, pages.value)
        if (next === undefined || next === null) {
          hasMoreData.value = false
        }
        else {
          nextPageParam.value = next
          currentPage.value++
        }
      }
      else {
        // 默认逻辑：检查返回的数据量
        const itemCount = Array.isArray(pageData)
          ? pageData.length
          : pageData?.items?.length || pageData?.data?.length || 0

        if (itemCount < pageSize) {
          hasMoreData.value = false
        }
        else {
          currentPage.value++
          nextPageParam.value = currentPage.value
        }
      }
    }
    catch (err) {
      // 错误已在 fetchPage 中设置
    }
    finally {
      isFetchingMore.value = false
    }
  }

  /**
   * 刷新数据（重新加载第一页）
   */
  const refresh = async () => {
    reset()
    loading.value = true

    try {
      await loadMore()
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 重置所有数据
   */
  const reset = () => {
    pages.value = []
    currentPage.value = initialPage
    nextPageParam.value = initialPage
    hasMoreData.value = true
    error.value = null
    loading.value = false
    isFetchingMore.value = false
  }

  // 初始加载
  if (immediate) {
    refresh()
  }

  return {
    data,
    pages,
    loading,
    error,
    hasMore,
    isFetchingMore,
    currentPage,
    loadMore,
    refresh,
    reset,
  }
}

