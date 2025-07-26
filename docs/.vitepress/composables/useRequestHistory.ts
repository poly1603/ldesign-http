import { ref, reactive, computed } from 'vue'

interface HistoryItem {
  id: string
  method: string
  url: string
  status?: number
  timestamp: number
  duration?: number
  config?: any
  error?: string
  responseSize?: number
  cached?: boolean
}

interface HistoryStats {
  totalRequests: number
  successRequests: number
  errorRequests: number
  averageResponseTime: number
  totalDataTransferred: number
  cacheHitRate: number
}

// 全局历史记录存储
const STORAGE_KEY = 'api_tester_history'
const FAVORITES_KEY = 'api_tester_favorites'
const MAX_HISTORY_SIZE = 1000

// 从本地存储加载数据
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error)
    return defaultValue
  }
}

// 保存到本地存储
const saveToStorage = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error)
  }
}

export function useRequestHistory() {
  // 响应式数据
  const requestHistory = ref<HistoryItem[]>(loadFromStorage(STORAGE_KEY, []))
  const favorites = ref<string[]>(loadFromStorage(FAVORITES_KEY, []))
  
  // 计算属性
  const historyStats = computed<HistoryStats>(() => {
    const history = requestHistory.value
    const totalRequests = history.length
    
    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        successRequests: 0,
        errorRequests: 0,
        averageResponseTime: 0,
        totalDataTransferred: 0,
        cacheHitRate: 0
      }
    }
    
    const successRequests = history.filter(item => item.status && item.status >= 200 && item.status < 400).length
    const errorRequests = totalRequests - successRequests
    
    const totalResponseTime = history
      .filter(item => item.duration)
      .reduce((sum, item) => sum + (item.duration || 0), 0)
    const averageResponseTime = totalResponseTime / Math.max(1, history.filter(item => item.duration).length)
    
    const totalDataTransferred = history
      .filter(item => item.responseSize)
      .reduce((sum, item) => sum + (item.responseSize || 0), 0)
    
    const cachedRequests = history.filter(item => item.cached).length
    const cacheHitRate = totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0
    
    return {
      totalRequests,
      successRequests,
      errorRequests,
      averageResponseTime: Math.round(averageResponseTime),
      totalDataTransferred,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100
    }
  })
  
  const favoriteRequests = computed(() => {
    return requestHistory.value.filter(item => favorites.value.includes(item.id))
  })
  
  const recentRequests = computed(() => {
    return requestHistory.value
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
  })
  
  const successfulRequests = computed(() => {
    return requestHistory.value.filter(item => 
      item.status && item.status >= 200 && item.status < 400
    )
  })
  
  const failedRequests = computed(() => {
    return requestHistory.value.filter(item => 
      !item.status || item.status >= 400
    )
  })
  
  // 方法
  const generateId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  const addToHistory = (item: Omit<HistoryItem, 'id'>): string => {
    const id = generateId()
    const historyItem: HistoryItem = {
      id,
      ...item
    }
    
    // 添加到历史记录开头
    requestHistory.value.unshift(historyItem)
    
    // 限制历史记录大小
    if (requestHistory.value.length > MAX_HISTORY_SIZE) {
      const removed = requestHistory.value.splice(MAX_HISTORY_SIZE)
      // 同时从收藏中移除被删除的项目
      const removedIds = removed.map(item => item.id)
      favorites.value = favorites.value.filter(fav => !removedIds.includes(fav))
    }
    
    // 保存到本地存储
    saveToStorage(STORAGE_KEY, requestHistory.value)
    
    return id
  }
  
  const updateHistoryItem = (id: string, updates: Partial<HistoryItem>): boolean => {
    const index = requestHistory.value.findIndex(item => item.id === id)
    if (index === -1) return false
    
    requestHistory.value[index] = {
      ...requestHistory.value[index],
      ...updates
    }
    
    saveToStorage(STORAGE_KEY, requestHistory.value)
    return true
  }
  
  const removeFromHistory = (id: string): boolean => {
    const index = requestHistory.value.findIndex(item => item.id === id)
    if (index === -1) return false
    
    requestHistory.value.splice(index, 1)
    
    // 同时从收藏中移除
    const favIndex = favorites.value.indexOf(id)
    if (favIndex !== -1) {
      favorites.value.splice(favIndex, 1)
      saveToStorage(FAVORITES_KEY, favorites.value)
    }
    
    saveToStorage(STORAGE_KEY, requestHistory.value)
    return true
  }
  
  const clearHistory = (): void => {
    requestHistory.value = []
    favorites.value = []
    saveToStorage(STORAGE_KEY, [])
    saveToStorage(FAVORITES_KEY, [])
  }
  
  const toggleFavorite = (id: string): boolean => {
    const index = favorites.value.indexOf(id)
    
    if (index === -1) {
      // 添加到收藏
      favorites.value.push(id)
    } else {
      // 从收藏中移除
      favorites.value.splice(index, 1)
    }
    
    saveToStorage(FAVORITES_KEY, favorites.value)
    return index === -1 // 返回是否添加到收藏
  }
  
  const isFavorite = (id: string): boolean => {
    return favorites.value.includes(id)
  }
  
  const searchHistory = (query: string): HistoryItem[] => {
    if (!query.trim()) return requestHistory.value
    
    const lowerQuery = query.toLowerCase()
    return requestHistory.value.filter(item => 
      item.url.toLowerCase().includes(lowerQuery) ||
      item.method.toLowerCase().includes(lowerQuery) ||
      (item.status && item.status.toString().includes(lowerQuery)) ||
      (item.error && item.error.toLowerCase().includes(lowerQuery))
    )
  }
  
  const filterHistory = (filters: {
    method?: string[]
    status?: 'success' | 'error' | 'all'
    dateRange?: { start: Date; end: Date }
    favorites?: boolean
  }): HistoryItem[] => {
    let filtered = requestHistory.value
    
    // 按方法过滤
    if (filters.method && filters.method.length > 0) {
      filtered = filtered.filter(item => 
        filters.method!.includes(item.method.toUpperCase())
      )
    }
    
    // 按状态过滤
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'success') {
        filtered = filtered.filter(item => 
          item.status && item.status >= 200 && item.status < 400
        )
      } else if (filters.status === 'error') {
        filtered = filtered.filter(item => 
          !item.status || item.status >= 400
        )
      }
    }
    
    // 按日期范围过滤
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp)
        return itemDate >= start && itemDate <= end
      })
    }
    
    // 只显示收藏
    if (filters.favorites) {
      filtered = filtered.filter(item => favorites.value.includes(item.id))
    }
    
    return filtered
  }
  
  const exportHistory = (format: 'json' | 'csv' = 'json'): string => {
    if (format === 'csv') {
      const headers = ['ID', 'Method', 'URL', 'Status', 'Timestamp', 'Duration', 'Error']
      const rows = requestHistory.value.map(item => [
        item.id,
        item.method,
        item.url,
        item.status || '',
        new Date(item.timestamp).toISOString(),
        item.duration || '',
        item.error || ''
      ])
      
      return [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')
    }
    
    return JSON.stringify(requestHistory.value, null, 2)
  }
  
  const importHistory = (data: string, format: 'json' | 'csv' = 'json'): boolean => {
    try {
      let items: HistoryItem[]
      
      if (format === 'csv') {
        const lines = data.split('\n')
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
        
        items = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, ''))
          return {
            id: values[0] || generateId(),
            method: values[1] || 'GET',
            url: values[2] || '',
            status: values[3] ? parseInt(values[3]) : undefined,
            timestamp: values[4] ? new Date(values[4]).getTime() : Date.now(),
            duration: values[5] ? parseInt(values[5]) : undefined,
            error: values[6] || undefined
          }
        }).filter(item => item.url) // 过滤掉无效项
      } else {
        items = JSON.parse(data)
      }
      
      // 验证数据格式
      if (!Array.isArray(items)) {
        throw new Error('Invalid data format')
      }
      
      // 合并到现有历史记录
      const existingIds = new Set(requestHistory.value.map(item => item.id))
      const newItems = items.filter(item => !existingIds.has(item.id))
      
      requestHistory.value.unshift(...newItems)
      
      // 限制大小
      if (requestHistory.value.length > MAX_HISTORY_SIZE) {
        requestHistory.value = requestHistory.value.slice(0, MAX_HISTORY_SIZE)
      }
      
      saveToStorage(STORAGE_KEY, requestHistory.value)
      return true
    } catch (error) {
      console.error('Failed to import history:', error)
      return false
    }
  }
  
  const getHistoryByUrl = (url: string): HistoryItem[] => {
    return requestHistory.value.filter(item => item.url === url)
  }
  
  const getHistoryByMethod = (method: string): HistoryItem[] => {
    return requestHistory.value.filter(item => 
      item.method.toUpperCase() === method.toUpperCase()
    )
  }
  
  const duplicateRequest = (id: string): string | null => {
    const original = requestHistory.value.find(item => item.id === id)
    if (!original) return null
    
    const duplicate: Omit<HistoryItem, 'id'> = {
      method: original.method,
      url: original.url,
      timestamp: Date.now(),
      config: original.config
    }
    
    return addToHistory(duplicate)
  }
  
  return {
    // 响应式数据
    requestHistory: computed(() => requestHistory.value),
    favorites: computed(() => favorites.value),
    historyStats,
    favoriteRequests,
    recentRequests,
    successfulRequests,
    failedRequests,
    
    // 方法
    addToHistory,
    updateHistoryItem,
    removeFromHistory,
    clearHistory,
    toggleFavorite,
    isFavorite,
    searchHistory,
    filterHistory,
    exportHistory,
    importHistory,
    getHistoryByUrl,
    getHistoryByMethod,
    duplicateRequest
  }
}
