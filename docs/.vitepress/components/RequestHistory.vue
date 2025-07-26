<template>
  <div class="request-history">
    <div class="history-header">
      <h3>📜 请求历史</h3>
      <div class="history-actions">
        <button @click="toggleView" class="view-toggle-btn">
          {{ isListView ? '📊 卡片视图' : '📋 列表视图' }}
        </button>
        <button @click="exportHistory" class="export-btn">
          📤 导出
        </button>
        <button @click="clearHistory" class="clear-btn">
          🗑️ 清空
        </button>
      </div>
    </div>

    <!-- 过滤和搜索 -->
    <div class="history-filters">
      <div class="search-box">
        <input 
          v-model="searchQuery"
          placeholder="搜索 URL、方法或状态..."
          class="search-input"
        />
        <span class="search-icon">🔍</span>
      </div>
      
      <div class="filter-tabs">
        <button 
          v-for="filter in filters"
          :key="filter.key"
          @click="activeFilter = filter.key"
          :class="['filter-tab', { active: activeFilter === filter.key }]"
        >
          {{ filter.label }}
          <span v-if="getFilterCount(filter.key)" class="filter-count">
            {{ getFilterCount(filter.key) }}
          </span>
        </button>
      </div>
    </div>

    <!-- 历史记录列表 -->
    <div class="history-content">
      <div v-if="filteredHistory.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-text">
          {{ searchQuery ? '没有找到匹配的请求' : '暂无请求历史' }}
        </p>
      </div>

      <!-- 列表视图 -->
      <div v-else-if="isListView" class="history-list">
        <div 
          v-for="(item, index) in filteredHistory" 
          :key="index"
          class="history-item"
          :class="{ 
            'error': !item.status,
            'favorite': favorites.includes(item.id)
          }"
          @click="loadRequest(item)"
        >
          <div class="item-method">
            <span class="method-badge" :class="getMethodClass(item.method)">
              {{ item.method }}
            </span>
          </div>
          
          <div class="item-url">
            <div class="url-text" :title="item.url">{{ item.url }}</div>
            <div class="url-meta">
              <span class="timestamp">{{ formatTime(item.timestamp) }}</span>
              <span v-if="item.duration" class="duration">{{ item.duration }}ms</span>
            </div>
          </div>
          
          <div class="item-status">
            <span 
              v-if="item.status"
              class="status-badge" 
              :class="getStatusClass(item.status)"
            >
              {{ item.status }}
            </span>
            <span v-else class="error-badge">Error</span>
          </div>
          
          <div class="item-actions">
            <button 
              @click.stop="toggleFavorite(item.id)"
              class="favorite-btn"
              :class="{ active: favorites.includes(item.id) }"
              :title="favorites.includes(item.id) ? '取消收藏' : '收藏'"
            >
              {{ favorites.includes(item.id) ? '⭐' : '☆' }}
            </button>
            
            <button 
              @click.stop="copyRequest(item)"
              class="copy-btn"
              title="复制为 cURL"
            >
              📋
            </button>
            
            <button 
              @click.stop="deleteRequest(index)"
              class="delete-btn"
              title="删除"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- 卡片视图 -->
      <div v-else class="history-grid">
        <div 
          v-for="(item, index) in filteredHistory" 
          :key="index"
          class="history-card"
          :class="{ 
            'error': !item.status,
            'favorite': favorites.includes(item.id)
          }"
          @click="loadRequest(item)"
        >
          <div class="card-header">
            <div class="card-method">
              <span class="method-badge" :class="getMethodClass(item.method)">
                {{ item.method }}
              </span>
            </div>
            
            <div class="card-actions">
              <button 
                @click.stop="toggleFavorite(item.id)"
                class="favorite-btn"
                :class="{ active: favorites.includes(item.id) }"
              >
                {{ favorites.includes(item.id) ? '⭐' : '☆' }}
              </button>
              
              <button 
                @click.stop="deleteRequest(index)"
                class="delete-btn"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <div class="card-url">
            <div class="url-text" :title="item.url">{{ item.url }}</div>
          </div>
          
          <div class="card-meta">
            <div class="meta-row">
              <span class="meta-label">状态:</span>
              <span 
                v-if="item.status"
                class="status-badge" 
                :class="getStatusClass(item.status)"
              >
                {{ item.status }}
              </span>
              <span v-else class="error-badge">Error</span>
            </div>
            
            <div class="meta-row">
              <span class="meta-label">时间:</span>
              <span class="timestamp">{{ formatTime(item.timestamp) }}</span>
            </div>
            
            <div v-if="item.duration" class="meta-row">
              <span class="meta-label">耗时:</span>
              <span class="duration">{{ item.duration }}ms</span>
            </div>
          </div>
          
          <div class="card-footer">
            <button 
              @click.stop="copyRequest(item)"
              class="copy-request-btn"
            >
              📋 复制 cURL
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="history-pagination">
      <button 
        @click="currentPage = Math.max(1, currentPage - 1)"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        ← 上一页
      </button>
      
      <span class="page-info">
        第 {{ currentPage }} 页，共 {{ totalPages }} 页
      </span>
      
      <button 
        @click="currentPage = Math.min(totalPages, currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        下一页 →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface HistoryItem {
  id: string
  method: string
  url: string
  status?: number
  timestamp: number
  duration?: number
  config?: any
  error?: string
}

interface Props {
  history: HistoryItem[]
  favorites: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'load-request': [item: HistoryItem]
  'toggle-favorite': [id: string]
  'clear-history': []
  'delete-request': [index: number]
}>()

// 响应式数据
const isListView = ref(true)
const searchQuery = ref('')
const activeFilter = ref('all')
const currentPage = ref(1)
const pageSize = 10

// 过滤器
const filters = [
  { key: 'all', label: '全部' },
  { key: 'success', label: '成功' },
  { key: 'error', label: '错误' },
  { key: 'favorites', label: '收藏' }
]

// 计算属性
const filteredHistory = computed(() => {
  let filtered = [...props.history]

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.url.toLowerCase().includes(query) ||
      item.method.toLowerCase().includes(query) ||
      (item.status && item.status.toString().includes(query))
    )
  }

  // 状态过滤
  switch (activeFilter.value) {
    case 'success':
      filtered = filtered.filter(item => item.status && item.status >= 200 && item.status < 400)
      break
    case 'error':
      filtered = filtered.filter(item => !item.status || item.status >= 400)
      break
    case 'favorites':
      filtered = filtered.filter(item => props.favorites.includes(item.id))
      break
  }

  // 分页
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  let filtered = [...props.history]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.url.toLowerCase().includes(query) ||
      item.method.toLowerCase().includes(query) ||
      (item.status && item.status.toString().includes(query))
    )
  }

  switch (activeFilter.value) {
    case 'success':
      filtered = filtered.filter(item => item.status && item.status >= 200 && item.status < 400)
      break
    case 'error':
      filtered = filtered.filter(item => !item.status || item.status >= 400)
      break
    case 'favorites':
      filtered = filtered.filter(item => props.favorites.includes(item.id))
      break
  }

  return Math.ceil(filtered.length / pageSize)
})

// 方法
const getFilterCount = (filterKey: string): number | null => {
  let count = 0
  
  switch (filterKey) {
    case 'all':
      count = props.history.length
      break
    case 'success':
      count = props.history.filter(item => item.status && item.status >= 200 && item.status < 400).length
      break
    case 'error':
      count = props.history.filter(item => !item.status || item.status >= 400).length
      break
    case 'favorites':
      count = props.favorites.length
      break
  }
  
  return count > 0 ? count : null
}

const getMethodClass = (method: string): string => {
  switch (method.toUpperCase()) {
    case 'GET': return 'method-get'
    case 'POST': return 'method-post'
    case 'PUT': return 'method-put'
    case 'DELETE': return 'method-delete'
    case 'PATCH': return 'method-patch'
    default: return 'method-other'
  }
}

const getStatusClass = (status: number): string => {
  if (status >= 200 && status < 300) return 'status-success'
  if (status >= 300 && status < 400) return 'status-redirect'
  if (status >= 400 && status < 500) return 'status-client-error'
  return 'status-server-error'
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 1天内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }
}

const toggleView = () => {
  isListView.value = !isListView.value
}

const loadRequest = (item: HistoryItem) => {
  emit('load-request', item)
}

const toggleFavorite = (id: string) => {
  emit('toggle-favorite', id)
}

const clearHistory = () => {
  if (confirm('确定要清空所有历史记录吗？')) {
    emit('clear-history')
  }
}

const deleteRequest = (index: number) => {
  emit('delete-request', index)
}

const copyRequest = async (item: HistoryItem) => {
  if (!item.config) return
  
  const config = item.config
  let curl = `curl -X ${config.method?.toUpperCase() || 'GET'}`
  
  // 添加URL
  curl += ` "${config.url}"`
  
  // 添加请求头
  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      curl += ` \\\n  -H "${key}: ${value}"`
    })
  }
  
  // 添加请求体
  if (config.data) {
    const dataStr = typeof config.data === 'string' 
      ? config.data 
      : JSON.stringify(config.data)
    curl += ` \\\n  -d '${dataStr}'`
  }
  
  try {
    await navigator.clipboard.writeText(curl)
    // 显示复制成功提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const exportHistory = () => {
  const data = JSON.stringify(props.history, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `request_history_${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.request-history {
  margin-top: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.history-header h3 {
  margin: 0;
  color: #374151;
  font-size: 18px;
}

.history-actions {
  display: flex;
  gap: 8px;
}

.view-toggle-btn,
.export-btn,
.clear-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
  transition: all 0.2s ease;
}

.view-toggle-btn:hover,
.export-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.clear-btn {
  color: #dc2626;
  border-color: #fca5a5;
}

.clear-btn:hover {
  background: #fef2f2;
  border-color: #f87171;
}

.history-filters {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.search-box {
  position: relative;
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.filter-tabs {
  display: flex;
  gap: 4px;
}

.filter-tab {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: #6b7280;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.filter-tab.active {
  background: #3b82f6;
  color: white;
}

.filter-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
}

.filter-tab.active .filter-count {
  background: rgba(255, 255, 255, 0.3);
}

.history-content {
  max-height: 500px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: grid;
  grid-template-columns: 80px 1fr 80px 120px;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
}

.history-item:hover {
  background: #f9fafb;
}

.history-item.favorite {
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
}

.history-item.error {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
}

.method-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
}

.method-get { background: #dbeafe; color: #1e40af; }
.method-post { background: #dcfce7; color: #166534; }
.method-put { background: #fef3c7; color: #92400e; }
.method-delete { background: #fecaca; color: #991b1b; }
.method-patch { background: #e0e7ff; color: #3730a3; }
.method-other { background: #f3f4f6; color: #374151; }

.item-url {
  min-width: 0;
}

.url-text {
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.url-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #9ca3af;
}

.status-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
}

.status-success { background: #dcfce7; color: #166534; }
.status-redirect { background: #fef3c7; color: #92400e; }
.status-client-error { background: #fecaca; color: #991b1b; }
.status-server-error { background: #fecaca; color: #991b1b; }

.error-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  background: #fecaca;
  color: #991b1b;
}

.item-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.favorite-btn,
.copy-btn,
.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
  background: transparent;
}

.favorite-btn:hover {
  background: #fef3c7;
}

.favorite-btn.active {
  color: #f59e0b;
}

.copy-btn:hover {
  background: #dbeafe;
}

.delete-btn:hover {
  background: #fecaca;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 20px;
}

.history-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.history-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.history-card.favorite {
  border-color: #f59e0b;
  background: #fffbeb;
}

.history-card.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.card-url {
  margin-bottom: 12px;
}

.card-url .url-text {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  word-break: break-all;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.meta-label {
  color: #6b7280;
  font-weight: 500;
}

.card-footer {
  border-top: 1px solid #f3f4f6;
  padding-top: 8px;
}

.copy-request-btn {
  width: 100%;
  padding: 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
  transition: all 0.2s ease;
}

.copy-request-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.history-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .history-actions {
    justify-content: space-between;
  }

  .history-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .item-actions {
    justify-content: flex-start;
  }

  .history-grid {
    grid-template-columns: 1fr;
  }

  .filter-tabs {
    flex-wrap: wrap;
  }
}
</style>
