/**
 * 追踪Span管理模块
 *
 * 提供Span的创建、管理和操作功能
 */
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
    CUSTOM = "custom",
    /** 中间件 */
    MIDDLEWARE = "middleware",
    /** 服务调用 */
    SERVICE = "service",
    /** 消息队列 */
    MESSAGE = "message"
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
    CANCELLED = "cancelled",
    /** 超时 */
    TIMEOUT = "timeout",
    /** 警告 */
    WARNING = "warning"
}
/**
 * 追踪标签
 */
export interface TraceTag {
    key: string;
    value: string | number | boolean;
}
/**
 * 追踪日志
 */
export interface TraceLog {
    timestamp: number;
    level?: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    data?: any;
}
/**
 * 追踪事件
 */
export interface TraceEvent {
    name: string;
    timestamp: number;
    attributes?: Record<string, any>;
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
    logs: TraceLog[];
    /** 事件 */
    events?: TraceEvent[];
    /** 错误信息 */
    error?: {
        message: string;
        stack?: string;
        code?: string | number;
        type?: string;
    };
    /** 属性 */
    attributes?: Record<string, any>;
    /** 子Span ID列表 */
    childSpanIds?: string[];
}
/**
 * Span构建器
 */
export declare class SpanBuilder {
    private span;
    constructor(traceId: string, name: string, type?: SpanType);
    /**
     * 设置父Span
     */
    setParent(parentSpanId: string): this;
    /**
     * 设置类型
     */
    setType(type: SpanType): this;
    /**
     * 添加标签
     */
    addTag(key: string, value: string | number | boolean): this;
    /**
     * 批量添加标签
     */
    addTags(tags: Record<string, string | number | boolean>): this;
    /**
     * 设置属性
     */
    setAttribute(key: string, value: any): this;
    /**
     * 批量设置属性
     */
    setAttributes(attributes: Record<string, any>): this;
    /**
     * 构建Span
     */
    build(): TraceSpan;
    private generateSpanId;
}
/**
 * Span操作器
 */
export declare class SpanOperator {
    private span;
    constructor(span: TraceSpan);
    /**
     * 添加标签
     */
    addTag(key: string, value: string | number | boolean): this;
    /**
     * 添加日志
     */
    addLog(message: string, data?: any, level?: TraceLog['level']): this;
    /**
     * 添加事件
     */
    addEvent(name: string, attributes?: Record<string, any>): this;
    /**
     * 设置错误
     */
    setError(error: Error | string | {
        message: string;
        code?: string | number;
        type?: string;
    }): this;
    /**
     * 设置状态
     */
    setStatus(status: SpanStatus): this;
    /**
     * 结束Span
     */
    finish(status?: SpanStatus): void;
    /**
     * 获取Span数据
     */
    getSpan(): TraceSpan;
    /**
     * 添加子Span ID
     */
    addChildSpanId(spanId: string): this;
    /**
     * 获取持续时间
     */
    getDuration(): number | undefined;
    /**
     * 是否已完成
     */
    isFinished(): boolean;
    /**
     * 是否有错误
     */
    hasError(): boolean;
}
/**
 * Span集合管理器
 */
export declare class SpanCollection {
    private spans;
    private spansByTrace;
    private childToParent;
    /**
     * 添加Span
     */
    add(span: TraceSpan): void;
    /**
     * 获取Span
     */
    get(spanId: string): TraceSpan | undefined;
    /**
     * 获取trace的所有Spans
     */
    getByTraceId(traceId: string): TraceSpan[];
    /**
     * 获取根Spans
     */
    getRootSpans(traceId: string): TraceSpan[];
    /**
     * 获取子Spans
     */
    getChildSpans(parentSpanId: string): TraceSpan[];
    /**
     * 获取Span路径（从根到当前Span）
     */
    getSpanPath(spanId: string): TraceSpan[];
    /**
     * 删除Span
     */
    remove(spanId: string): boolean;
    /**
     * 删除trace的所有Spans
     */
    removeByTraceId(traceId: string): number;
    /**
     * 清空所有Spans
     */
    clear(): void;
    /**
     * 获取大小
     */
    size(): number;
    /**
     * 获取trace数量
     */
    traceCount(): number;
    /**
     * 构建Span树
     */
    buildSpanTree(traceId: string): SpanTreeNode[];
    private buildTreeNode;
}
/**
 * Span树节点
 */
export interface SpanTreeNode {
    span: TraceSpan;
    children: SpanTreeNode[];
}
/**
 * 创建Span构建器
 */
export declare function createSpanBuilder(traceId: string, name: string, type?: SpanType): SpanBuilder;
/**
 * 创建Span操作器
 */
export declare function createSpanOperator(span: TraceSpan): SpanOperator;
/**
 * 创建Span集合
 */
export declare function createSpanCollection(): SpanCollection;
