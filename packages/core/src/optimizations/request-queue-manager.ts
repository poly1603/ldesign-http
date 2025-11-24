/**
 * HTTP 请求队列管理器
 * 优化并发请求控制、请求去重、智能重试
 */

/**
 * 请求优先级
 */
export enum RequestPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * 请求状态
 */
export enum RequestStatus {
  PENDING = 'pending',
  IN_FLIGHT = 'in_flight',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 请求配置
 */
export interface RequestConfig {
  url: string;
  method?: string;
  data?: any;
  headers?: Record<string, string>;
  priority?: RequestPriority;
  timeout?: number;
  retries?: number;
  deduplication?: boolean;
  cacheKey?: string;
}

/**
 * 请求项
 */
interface RequestItem {
  id: string;
  config: RequestConfig;
  priority: RequestPriority;
  status: RequestStatus;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retryCount: number;
  timestamp: number;
  abortController?: AbortController;
}

/**
 * 请求队列管理器
 */
export class RequestQueueManager {
  private queue: RequestItem[] = [];
  private inFlight: Map<string, RequestItem> = new Map();
  private maxConcurrent: number;
  private currentConcurrent: number = 0;
  private requestCache = new Map<string, Promise<any>>();
  private deduplicationMap = new Map<string, RequestItem>();

  // 统计信息
  private stats = {
    total: 0,
    success: 0,
    failed: 0,
    cancelled: 0,
    deduplicated: 0
  };

  constructor(maxConcurrent: number = 6) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * 添加请求到队列
   */
  async request<T = any>(config: RequestConfig): Promise<T> {
    this.stats.total++;

    // 请求去重
    if (config.deduplication !== false) {
      const deduplicationKey = this.generateDeduplicationKey(config);
      const existing = this.deduplicationMap.get(deduplicationKey);

      if (existing) {
        this.stats.deduplicated++;
        return new Promise((resolve, reject) => {
          existing.resolve = resolve;
          existing.reject = reject;
        });
      }
    }

    return new Promise((resolve, reject) => {
      const item: RequestItem = {
        id: this.generateRequestId(),
        config,
        priority: config.priority ?? RequestPriority.NORMAL,
        status: RequestStatus.PENDING,
        resolve,
        reject,
        retryCount: 0,
        timestamp: Date.now(),
        abortController: new AbortController()
      };

      // 添加到队列
      this.addToQueue(item);

      // 如果有空闲槽位，立即处理
      this.processQueue();
    });
  }

  /**
   * 取消请求
   */
  cancel(requestId: string): boolean {
    // 从队列中移除
    const queueIndex = this.queue.findIndex(item => item.id === requestId);
    if (queueIndex !== -1) {
      const item = this.queue[queueIndex];
      this.queue.splice(queueIndex, 1);
      item.status = RequestStatus.CANCELLED;
      item.reject(new Error('Request cancelled'));
      this.stats.cancelled++;
      return true;
    }

    // 取消正在进行的请求
    const inFlightItem = this.inFlight.get(requestId);
    if (inFlightItem) {
      inFlightItem.abortController?.abort();
      inFlightItem.status = RequestStatus.CANCELLED;
      inFlightItem.reject(new Error('Request cancelled'));
      this.inFlight.delete(requestId);
      this.currentConcurrent--;
      this.stats.cancelled++;
      this.processQueue();
      return true;
    }

    return false;
  }

  /**
   * 取消所有请求
   */
  cancelAll(): void {
    // 取消队列中的请求
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      item.status = RequestStatus.CANCELLED;
      item.reject(new Error('Request cancelled'));
      this.stats.cancelled++;
    }

    // 取消正在进行的请求
    for (const [id, item] of this.inFlight) {
      item.abortController?.abort();
      item.status = RequestStatus.CANCELLED;
      item.reject(new Error('Request cancelled'));
      this.stats.cancelled++;
    }

    this.inFlight.clear();
    this.currentConcurrent = 0;
    this.deduplicationMap.clear();
  }

  /**
   * 获取队列状态
   */
  getStatus(): {
    pending: number;
    inFlight: number;
    maxConcurrent: number;
    stats: {
      total: number;
      success: number;
      failed: number;
      cancelled: number;
      deduplicated: number;
    };
  } {
    return {
      pending: this.queue.length,
      inFlight: this.currentConcurrent,
      maxConcurrent: this.maxConcurrent,
      stats: { ...this.stats }
    };
  }

  /**
   * 设置最大并发数
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
    this.processQueue();
  }

  /**
   * 添加到队列（按优先级排序）
   */
  private addToQueue(item: RequestItem): void {
    // 按优先级插入
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (item.priority > this.queue[i].priority) {
        this.queue.splice(i, 0, item);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.queue.push(item);
    }

    // 添加到去重map
    if (item.config.deduplication !== false) {
      const key = this.generateDeduplicationKey(item.config);
      this.deduplicationMap.set(key, item);
    }
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    while (this.currentConcurrent < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.executeRequest(item);
    }
  }

  /**
   * 执行请求
   */
  private async executeRequest(item: RequestItem): Promise<void> {
    item.status = RequestStatus.IN_FLIGHT;
    this.inFlight.set(item.id, item);
    this.currentConcurrent++;

    try {
      // 实际的HTTP请求（这里简化处理）
      const response = await this.performHttpRequest(item);

      item.status = RequestStatus.SUCCESS;
      item.resolve(response);
      this.stats.success++;

      // 从去重map移除
      if (item.config.deduplication !== false) {
        const key = this.generateDeduplicationKey(item.config);
        this.deduplicationMap.delete(key);
      }
    } catch (error) {
      // 重试逻辑
      const maxRetries = item.config.retries ?? 3;
      if (item.retryCount < maxRetries) {
        item.retryCount++;
        item.status = RequestStatus.PENDING;

        // 指数退避
        const delay = Math.min(1000 * Math.pow(2, item.retryCount), 10000);
        await this.sleep(delay);

        // 重新加入队列
        this.addToQueue(item);
      } else {
        item.status = RequestStatus.FAILED;
        item.reject(error);
        this.stats.failed++;

        // 从去重map移除
        if (item.config.deduplication !== false) {
          const key = this.generateDeduplicationKey(item.config);
          this.deduplicationMap.delete(key);
        }
      }
    } finally {
      this.inFlight.delete(item.id);
      this.currentConcurrent--;
      this.processQueue();
    }
  }

  /**
   * 执行实际的HTTP请求
   */
  private async performHttpRequest(item: RequestItem): Promise<any> {
    const { url, method = 'GET', data, headers, timeout = 30000 } = item.config;

    const controller = item.abortController!;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成去重键
   */
  private generateDeduplicationKey(config: RequestConfig): string {
    const { url, method = 'GET', data } = config;
    const dataStr = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataStr}`;
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 请求批处理器
 */
export class RequestBatcher {
  private batches = new Map<string, Array<{ config: RequestConfig; resolve: any; reject: any }>>();
  private flushTimers = new Map<string, NodeJS.Timeout>();
  private batchDelay: number;

  constructor(batchDelay: number = 50) {
    this.batchDelay = batchDelay;
  }

  /**
   * 添加到批次
   */
  async add<T = any>(config: RequestConfig, batchKey: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, []);
      }

      const batch = this.batches.get(batchKey)!;
      batch.push({ config, resolve, reject });

      // 设置刷新定时器
      if (this.flushTimers.has(batchKey)) {
        clearTimeout(this.flushTimers.get(batchKey)!);
      }

      const timer = setTimeout(() => {
        this.flush(batchKey);
      }, this.batchDelay);

      this.flushTimers.set(batchKey, timer);
    });
  }

  /**
   * 刷新批次
   */
  private async flush(batchKey: string): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.length === 0) return;

    this.batches.delete(batchKey);
    this.flushTimers.delete(batchKey);

    try {
      // 执行批量请求
      const results = await this.executeBatch(batch.map(item => item.config));

      // 分发结果
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      // 所有请求都失败
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }

  /**
   * 执行批量请求
   */
  private async executeBatch(configs: RequestConfig[]): Promise<any[]> {
    // 这里应该实现实际的批量请求逻辑
    // 例如：POST /batch { requests: [...] }
    return Promise.all(configs.map(config =>
      fetch(config.url).then(r => r.json())
    ));
  }
}

/**
 * 创建请求队列管理器
 */
export function createRequestQueueManager(maxConcurrent?: number): RequestQueueManager {
  return new RequestQueueManager(maxConcurrent);
}

/**
 * 创建请求批处理器
 */
export function createRequestBatcher(batchDelay?: number): RequestBatcher {
  return new RequestBatcher(batchDelay);
}