/**
 * 分页 Hook
 * 
 * 用于实现标准的分页数据加载
 * 
 * @example
 * ```vue
 * <script setup>
 * import { usePagination } from '@ldesign/http/vue'
 * 
 * const {
 *   data,
 *   loading,
 *   total,
 *   page,
 *   pageSize,
 *   totalPages,
 *   next,
 *   prev,
 *   goto,
 *   refresh
 * } = usePagination('/api/users', {
 *   pageSize: 20,
 *   immediate: true
 * })
 * </script>
 * 
 * <template>
 *   <div>
 *     <div v-if="loading">加载中...</div>
 *     <div v-else>
 *       <div v-for="user in data" :key="user.id">{{ user.name }}</div>
 *     </div>
 *     
 *     <div class="pagination">
 *       <button @click="prev" :disabled="page <= 1">上一页</button>
 *       <span>{{ page }} / {{ totalPages }}</span>
 *       <button @click="next" :disabled="page >= totalPages">下一页</button>
 *     </div>
 *   </div>
 * </template>
 * ```
 */

import { computed, ref, unref, watch } from 'vue'
import type { MaybeRef, Ref } from 'vue'
import { useHttp as useHttpStandalone } from './useHttpStandalone'
import type { RequestConfig } from '../types'

export interface PaginationOptions<T = any> {
  /**
   * 每页数据量
   */
  pageSize?: number

  /**
   * 初始页码
   */
  initialPage?: number

  /**
   * 是否立即加载
   */
  immediate?: boolean

  /**
   * 页码参数名称
   */
  pageParamName?: string

  /**
   * 每页大小参数名称
   */
  pageSizeParamName?: string

  /**
   * 总数参数名称（从响应中提取）
   */
  totalParamName?: string

  /**
   * 数据参数名称（从响应中提取）
   */
  dataParamName?: string

  /**
   * 数据转换函数
   */
  transform?: (data: any) => T[]

  /**
   * 请求配置
   */
  requestConfig?: RequestConfig

  /**
   * 页码变化回调
   */
  onPageChange?: (page: number, pageSize: number) => void

  /**
   * 数据加载完成回调
   */
  onDataLoaded?: (data: T[], total: number) => void
}

export interface UsePaginationReturn<T = any> {
  /**
   * 当前页数据
   */
  data: Ref<T[]>

  /**
   * 加载状态
   */
  loading: Ref<boolean>

  /**
   * 错误信息
   */
  error: Ref<Error | null>

  /**
   * 当前页码
   */
  page: Ref<number>

  /**
   * 每页数据量
   */
  pageSize: Ref<number>

  /**
   * 总数据量
   */
  total: Ref<number>

  /**
   * 总页数
   */
  totalPages: ReturnType<typeof computed<number>>

  /**
   * 是否有上一页
   */
  hasPrev: ReturnType<typeof computed<boolean>>

  /**
   * 是否有下一页
   */
  hasNext: ReturnType<typeof computed<boolean>>

  /**
   * 下一页
   */
  next: () => Promise<void>

  /**
   * 上一页
   */
  prev: () => Promise<void>

  /**
   * 跳转到指定页
   */
  goto: (page: number) => Promise<void>

  /**
   * 刷新当前页
   */
  refresh: () => Promise<void>

  /**
   * 重置到第一页
   */
  reset: () => Promise<void>

  /**
   * 设置每页数据量
   */
  setPageSize: (size: number) => Promise<void>
}

/**
 * 分页 Hook
 */
export function usePagination<T = any>(
  url: MaybeRef<string>,
  options: PaginationOptions<T> = {},
): UsePaginationReturn<T> {
  const {
    pageSize: initialPageSize = 20,
    initialPage = 1,
    immediate = true,
    pageParamName = 'page',
    pageSizeParamName = 'pageSize',
    totalParamName = 'total',
    dataParamName = 'data',
    transform,
    requestConfig = {},
    onPageChange,
    onDataLoaded,
  } = options

  const data = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const page = ref(initialPage)
  const pageSize = ref(initialPageSize)
  const total = ref(0)

  const { get: execute } = useHttpStandalone()

  // 计算总页数
  const totalPages = computed(() => {
    return Math.ceil(total.value / pageSize.value) || 1
  })

  // 是否有上一页
  const hasPrev = computed(() => {
    return page.value > 1
  })

  // 是否有下一页
  const hasNext = computed(() => {
    return page.value < totalPages.value
  })

  /**
   * 加载指定页
   */
  const loadPage = async (targetPage: number) => {
    if (loading.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      const urlValue = unref(url)

      // 构建请求参数
      const params = {
        ...requestConfig.params,
        [pageParamName]: targetPage,
        [pageSizeParamName]: pageSize.value,
      }

      const response = await execute<any>(urlValue, {
        ...requestConfig,
        params,
      })

      // 提取数据
      let pageData = response

      // 提取嵌套的数据和总数
      if (typeof pageData === 'object' && pageData !== null) {
        // 提取总数
        if (totalParamName in pageData) {
          total.value = Number(pageData[totalParamName as keyof typeof pageData]) || 0
        }

        // 提取数据列表
        if (dataParamName in pageData) {
          pageData = pageData[dataParamName as keyof typeof pageData]
        }
      }

      // 转换数据
      if (transform) {
        data.value = transform(pageData)
      }
      else if (Array.isArray(pageData)) {
        data.value = pageData as T[]
      }
      else {
        data.value = []
      }

      // 更新页码
      page.value = targetPage

      // 触发回调
      onPageChange?.(page.value, pageSize.value)
      onDataLoaded?.(data.value, total.value)
    }
    catch (err) {
      error.value = err as Error
      data.value = []
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 下一页
   */
  const next = async () => {
    if (hasNext.value) {
      await loadPage(page.value + 1)
    }
  }

  /**
   * 上一页
   */
  const prev = async () => {
    if (hasPrev.value) {
      await loadPage(page.value - 1)
    }
  }

  /**
   * 跳转到指定页
   */
  const goto = async (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages.value) {
      return
    }
    await loadPage(targetPage)
  }

  /**
   * 刷新当前页
   */
  const refresh = async () => {
    await loadPage(page.value)
  }

  /**
   * 重置到第一页
   */
  const reset = async () => {
    page.value = initialPage
    total.value = 0
    data.value = []
    error.value = null
    await loadPage(initialPage)
  }

  /**
   * 设置每页数据量
   */
  const setPageSize = async (size: number) => {
    pageSize.value = size
    await loadPage(1) // 重新从第一页加载
  }

  // 监听 URL 变化
  watch(() => unref(url), () => {
    reset()
  })

  // 初始加载
  if (immediate) {
    loadPage(initialPage)
  }

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    hasPrev,
    hasNext,
    next,
    prev,
    goto,
    refresh,
    reset,
    setPageSize,
  }
}

