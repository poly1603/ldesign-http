import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { IndexedDBCacheStorage } from '../../../packages/core/src/cache/IndexedDBCacheStorage'

// Mock IDBKeyRange
Object.defineProperty(global, 'IDBKeyRange', {
  value: {
    upperBound: (value: any) => ({ upper: value }),
  },
  writable: true,
})

// Mock IndexedDB - 简化版本用于测试
class IDBRequestMock {
  result: any = null
  error: Error | null = null
  onsuccess: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null

  simulateSuccess(result: any) {
    this.result = result
    if (this.onsuccess) {
      this.onsuccess({ target: this })
    }
  }
}

class IDBObjectStoreMock {
  private static globalData = new Map<string, any>()
  private data = IDBObjectStoreMock.globalData

  get(key: string) {
    const request = new IDBRequestMock()
    setTimeout(() => request.simulateSuccess(this.data.get(key)), 0)
    return request
  }

  put(entry: any) {
    const request = new IDBRequestMock()
    setTimeout(() => {
      this.data.set(entry.key, entry)
      request.simulateSuccess(undefined)
    }, 0)
    return request
  }

  delete(key: string) {
    const request = new IDBRequestMock()
    setTimeout(() => {
      this.data.delete(key)
      request.simulateSuccess(undefined)
    }, 0)
    return request
  }

  clear() {
    const request = new IDBRequestMock()
    setTimeout(() => {
      this.data.clear()
      request.simulateSuccess(undefined)
    }, 0)
    return request
  }

  getAllKeys() {
    const request = new IDBRequestMock()
    setTimeout(() => request.simulateSuccess(Array.from(this.data.keys())), 0)
    return request
  }

  count() {
    const request = new IDBRequestMock()
    setTimeout(() => request.simulateSuccess(this.data.size), 0)
    return request
  }

  createIndex() { return {} }
  index() {
    return {
      openCursor: () => {
        const request = new IDBRequestMock()
        setTimeout(() => request.simulateSuccess(null), 0)
        return request
      },
    }
  }
}

class IDBTransactionMock {
  objectStore() { return new IDBObjectStoreMock() }
}

class IDBDatabaseMock {
  objectStoreNames = { contains: () => false }
  transaction() { return new IDBTransactionMock() }
  createObjectStore() { return new IDBObjectStoreMock() }
  deleteObjectStore() {}
  close() {}
}

class IDBOpenDBRequestMock extends IDBRequestMock {
  onupgradeneeded: ((event: any) => void) | null = null
}

const indexedDBMock = {
  open: () => {
    const request = new IDBOpenDBRequestMock()
    setTimeout(() => {
      const db = new IDBDatabaseMock()
      if (request.onupgradeneeded) request.onupgradeneeded({ target: { result: db } })
      request.simulateSuccess(db)
    }, 0)
    return request
  },
  deleteDatabase: () => {
    const request = new IDBRequestMock()
    setTimeout(() => request.simulateSuccess(undefined), 0)
    return request
  },
}

Object.defineProperty(global, 'indexedDB', { value: indexedDBMock, writable: true })

describe('IndexedDBCacheStorage', () => {
  let storage: IndexedDBCacheStorage

  beforeEach(async () => {
    storage = new IndexedDBCacheStorage({ dbName: 'test_db', storeName: 'test_store' })
    await storage.init()
  })

  afterEach(() => storage.close())

  it('应该能够设置和获取缓存', async () => {
    await storage.set('key', { data: 'value' }, 60000)
    const result = await storage.get('key')
    expect(result).toEqual({ data: 'value' })
  })

  it('应该返回null当缓存不存在', async () => {
    expect(await storage.get('non-existent')).toBeNull()
  })

  it('应该能够删除缓存', async () => {
    await storage.set('key', 'value', 60000)
    await storage.delete('key')
    expect(await storage.get('key')).toBeNull()
  })

  it('应该能够清空所有缓存', async () => {
    await storage.set('key1', 'value1', 60000)
    await storage.set('key2', 'value2', 60000)
    await storage.clear()
    expect(await storage.get('key1')).toBeNull()
  })

  it('应该返回正确的统计信息', async () => {
    const stats = await storage.getStats()
    expect(stats.dbName).toBe('test_db')
    expect(stats.storeName).toBe('test_store')
  })
})