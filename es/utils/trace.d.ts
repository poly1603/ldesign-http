/**
 * 请求链路追踪
 *
 * 生成trace ID,跟踪请求的完整生命周期
 */
import type { HttpError, RequestConfig, ResponseData } from '../types';
/**
 * 追踪span类型
 */
export declare enum SpanType {
    /** HTTP请求 */
    HTTP = "http",
    /** 数据库查询 */
    DATABASE = "database",
    /** 缓存操作 */
    CACHE = "cache",
    /** 自定义 */
    CUSTOM = "custom"
}
/**
 * 追踪span状态
 */
export declare enum SpanStatus {
    /** 进行中 */
    PENDING = "pending",
    /** 成功 */
    SUCCESS = "success",
    /** 失败 */
    ERROR = "error",
    /** 取消 */
    CANCELLED = "cancelled"
}
/**
 * 追踪标签
 */
export interface TraceTag {
    key: string;
    value: string | number | boolean;
}
/**
 * 追踪span
 */
export interface TraceSpan {
    /** Span ID */
    spanId: string;
    /** 父Span ID */
    parentSpanId?: string;
    /** Trace ID */
    traceId: string;
    /** Span名称 */
    name: string;
    /** Span类型 */
    type: SpanType;
    /** 开始时间 */
    startTime: number;
    /** 结束时间 */
    endTime?: number;
    /** 持续时间(ms) */
    duration?: number;
    /** 状态 */
    status: SpanStatus;
    /** 标签 */
    tags: TraceTag[];
    /** 日志 */
    logs: Array<{
        timestamp: number;
        message: string;
        data?: any;
    }>;
    /** 错误信息 */
    error?: {
        message: string;
        stack?: string;
    };
}
/**
 * 追踪上下文
 */
export interface TraceContext {
    /** Trace ID */
    traceId: string;
    /** 当前Span */
    currentSpan?: TraceSpan;
    /** 所有Spans */
    spans: TraceSpan[];
    /** 元数据 */
    metadata: Record<string, any>;
}
/**
 * 追踪配置
 */
export interface TraceConfig {
    /** 是否启用 */
    enabled?: boolean;
    /** 采样率(0-1) */
    sampleRate?: number;
    /** 是否在Header中传递trace ID */
    propagateTraceId?: boolean;
    /** Trace ID Header名称 */
    traceIdHeader?: string;
    /** Span ID Header名称 */
    spanIdHeader?: string;
    /** 导出器 */
    exporter?: (spans: TraceSpan[]) => void | Promise<void>;
}
/**
 * 请求追踪管理器
 *
 * @example
 * ```typescript
 * const tracer = new RequestTracer({
 *  enabled: true,
 *  sampleRate: 1.0,
 * })
 *
 * // 开始追踪
 * const trace = tracer.startTrace('GET /api/users')
 *
 * // 添加span
 * const span = trace.startSpan('Query Database', SpanType.DATABASE)
 * span.addTag('table', 'users')
 * span.finish()
 *
 * // 结束追踪
 * trace.finish()
 * ```
 */
export declare class RequestTracer {
    private config;
    private traces;
    constructor(config?: TraceConfig);
    /**
     * 开始新的追踪
     */
    startTrace(name: string, type?: SpanType): Trace;
    /**
     * 获取追踪上下文
     */
    getTrace(traceId: string): TraceContext | undefined;
    /**
     * 结束追踪
     */
    finishTrace(traceId: string): void;
    /**
     * 判断是否应该采样
     */
    private shouldSample;
    /**
     * 生成Trace ID
     */
    private generateTraceId;
    /**
     * 生成Span ID
     */
    private generateSpanId;
    /**
     * 获取配置
     */
    getConfig(): TraceConfig;
}
/**
 * 追踪对象
 */
export declare class Trace {
    private tracer;
    private context;
    private rootSpan;
    constructor(tracer: RequestTracer, context: TraceContext, rootSpan: TraceSpan);
    /**
     * 获取Trace ID
     */
    get traceId(): string;
    /**
     * 获取当前Span ID
     */
    get spanId(): string;
    /**
     * 开始子Span
     */
    startSpan(name: string, type?: SpanType): Span;
    /**
     * 添加标签
     */
    addTag(key: string, value: string | number | boolean): this;
    /**
     * 添加日志
     */
    addLog(message: string, data?: any): this;
    /**
     * 设置错误
     */
    setError(error: Error): this;
    /**
     * 结束追踪
     */
    finish(status?: SpanStatus): void;
    /**
     * 获取所有Spans
     */
    getSpans(): TraceSpan[];
    /**
     * 获取元数据
     */
    getMetadata(): Record<string, any>;
    /**
     * 设置元数据
     */
    setMetadata(key: string, value: any): this;
}
/**
 * Span对象
 */
export declare class Span {
    private span;
    constructor(span: TraceSpan);
    /**
     * 添加标签
     */
    addTag(key: string, value: string | number | boolean): this;
    /**
     * 添加日志
     */
    addLog(message: string, data?: any): this;
    /**
     * 设置错误
     */
    setError(error: Error): this;
    /**
     * 结束Span
     */
    finish(status?: SpanStatus): void;
    /**
     * 获取原始span数据
     */
    getRawSpan(): TraceSpan;
}
/**
 * 创建请求追踪器
 */
export declare function createRequestTracer(config?: TraceConfig): RequestTracer;
/**
 * 全局请求追踪器
 */
export declare const globalTracer: RequestTracer;
/**
 * 追踪拦截器
 *
 * 自动为每个请求创建追踪
 */
export declare function createTraceInterceptor(config?: TraceConfig): {
    request: {
        onFulfilled: (requestConfig: RequestConfig) => RequestConfig;
    };
    response: {
        onFulfilled: (response: ResponseData<any>) => ResponseData<any>;
        onRejected: (error: HttpError) => never;
    };
};
/**
 * 控制台导出器
 */
export declare function consoleExporter(spans: TraceSpan[]): void;
