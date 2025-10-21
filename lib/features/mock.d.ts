import type { HttpClient, RequestConfig } from '../types';
/**
 * Mock 响应配置
 */
export interface MockResponse<T = any> {
    /** 响应数据 */
    data?: T;
    /** 状态码 */
    status?: number;
    /** 状态文本 */
    statusText?: string;
    /** 响应头 */
    headers?: Record<string, string>;
    /** 延迟时间（毫秒） */
    delay?: number;
    /** 错误信息（如果要返回错误） */
    error?: string | Error;
}
/**
 * Mock 规则匹配函数
 */
export type MockMatcher = (config: RequestConfig) => boolean;
/**
 * Mock 规则配置
 */
export interface MockRule<T = any> {
    /** 匹配规则 */
    matcher: string | RegExp | MockMatcher;
    /** Mock 响应 */
    response: MockResponse<T> | ((config: RequestConfig) => MockResponse<T> | Promise<MockResponse<T>>);
    /** 是否只匹配一次 */
    once?: boolean;
    /** 是否启用 */
    enabled?: boolean;
    /** 规则名称 */
    name?: string;
    /** 优先级（越大越优先） */
    priority?: number;
}
/**
 * Mock 统计信息
 */
export interface MockStats {
    /** 总匹配次数 */
    totalMatches: number;
    /** 各规则匹配次数 */
    ruleMatches: Map<string, number>;
    /** 最后匹配时间 */
    lastMatchTime: number | null;
}
/**
 * Mock 适配器
 *
 * 拦截 HTTP 请求并返回模拟数据，用于开发和测试
 *
 * @example
 * ```typescript
 * const mockAdapter = new MockAdapter()
 *
 * // 添加 Mock 规则
 * mockAdapter.onGet('/api/users').reply(200, [
 *   { id: 1, name: 'John' },
 *   { id: 2, name: 'Jane' }
 * ])
 *
 * // 使用正则匹配
 * mockAdapter.onGet(/\/api\/users\/\d+/).reply((config) => {
 *   const id = config.url?.split('/').pop()
 *   return {
 *     status: 200,
 *     data: { id: Number(id), name: 'User ' + id }
 *   }
 * })
 *
 * // 应用到 HTTP 客户端
 * mockAdapter.apply(httpClient)
 * ```
 */
export declare class MockAdapter {
    private rules;
    private stats;
    private originalRequest?;
    private isApplied;
    /**
     * 添加 GET 请求 Mock 规则
     */
    onGet(matcher: string | RegExp): MockRuleBuilder;
    /**
     * 添加 POST 请求 Mock 规则
     */
    onPost(matcher: string | RegExp): MockRuleBuilder;
    /**
     * 添加 PUT 请求 Mock 规则
     */
    onPut(matcher: string | RegExp): MockRuleBuilder;
    /**
     * 添加 DELETE 请求 Mock 规则
     */
    onDelete(matcher: string | RegExp): MockRuleBuilder;
    /**
     * 添加 PATCH 请求 Mock 规则
     */
    onPatch(matcher: string | RegExp): MockRuleBuilder;
    /**
     * 添加任意方法的 Mock 规则
     */
    on(method: string, matcher: string | RegExp): MockRuleBuilder;
    /**
     * 添加自定义匹配规则
     */
    onAny(matcher: MockMatcher): MockRuleBuilder;
    /**
     * 添加规则
     */
    addRule(rule: MockRule): void;
    /**
     * 移除规则
     */
    removeRule(name: string): boolean;
    /**
     * 清空所有规则
     */
    clearRules(): void;
    /**
     * 启用规则
     */
    enableRule(name: string): boolean;
    /**
     * 禁用规则
     */
    disableRule(name: string): boolean;
    /**
     * 获取所有规则
     */
    getRules(): MockRule[];
    /**
     * 获取统计信息
     */
    getStats(): MockStats;
    /**
     * 重置统计
     */
    resetStats(): void;
    /**
     * 应用到 HTTP 客户端
     */
    apply(client: HttpClient): void;
    /**
     * 从 HTTP 客户端移除
     */
    restore(client: HttpClient): void;
    /**
     * 创建 Mock 请求函数
     */
    private createMockRequest;
    /**
     * 查找匹配的规则
     */
    private findMatchingRule;
    /**
     * 匹配 URL
     */
    private matchURL;
    /**
     * 更新统计
     */
    private updateStats;
    /**
     * 延迟函数
     */
    private delay;
}
/**
 * Mock 规则构建器
 */
export declare class MockRuleBuilder<T = any> {
    private adapter;
    private matcher;
    private ruleName?;
    private rulePriority?;
    private ruleOnce;
    constructor(adapter: MockAdapter, matcher: MockMatcher);
    /**
     * 设置规则名称
     */
    name(name: string): this;
    /**
     * 设置优先级
     */
    priority(priority: number): this;
    /**
     * 只匹配一次
     */
    once(): this;
    /**
     * 返回指定响应
     */
    reply(statusOrResponse: number | MockResponse<T> | ((config: RequestConfig) => MockResponse<T> | Promise<MockResponse<T>>), data?: T, headers?: Record<string, string>): void;
    /**
     * 返回错误
     */
    replyWithError(error: string | Error): void;
    /**
     * 延迟响应
     */
    delay(ms: number): DelayedMockRuleBuilder<T>;
}
/**
 * 延迟 Mock 规则构建器
 */
export declare class DelayedMockRuleBuilder<T = any> {
    private builder;
    private delayMs;
    constructor(builder: MockRuleBuilder<T>, delayMs: number);
    /**
     * 返回指定响应
     */
    reply(status: number, data?: T, headers?: Record<string, string>): void;
    /**
     * 返回错误
     */
    replyWithError(error: string | Error): void;
}
/**
 * 创建 Mock 适配器
 */
export declare function createMockAdapter(): MockAdapter;
/**
 * 创建 Mock 拦截器
 *
 * 用于在拦截器链中使用
 */
export declare function createMockInterceptor(): (config: RequestConfig) => Promise<RequestConfig>;
