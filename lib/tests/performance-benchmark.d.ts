/**
 * 性能基准测试和内存泄漏检测
 *
 * 功能：
 * 1. 性能基准测试
 * 2. 内存泄漏检测
 * 3. 压力测试
 * 4. 性能对比分析
 */
/**
 * 性能测试配置
 */
interface BenchmarkConfig {
    /** 测试名称 */
    name: string;
    /** 请求数量 */
    requests: number;
    /** 并发数量 */
    concurrency: number;
    /** 是否启用缓存 */
    cache?: boolean;
    /** 是否启用批处理 */
    batching?: boolean;
    /** 是否启用优先级队列 */
    priorityQueue?: boolean;
}
/**
 * 性能测试结果
 */
interface BenchmarkResult {
    name: string;
    totalRequests: number;
    totalTime: number;
    averageTime: number;
    requestsPerSecond: number;
    memoryUsage: MemoryUsage;
    errors: number;
    p50: number;
    p95: number;
    p99: number;
}
/**
 * 内存使用情况
 */
interface MemoryUsage {
    initial: number;
    peak: number;
    final: number;
    leaked: number;
}
/**
 * 性能基准测试类
 */
export declare class PerformanceBenchmark {
    private results;
    /**
     * 运行基准测试
     */
    runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult>;
    /**
     * 执行单个请求
     */
    private executeRequest;
    /**
     * 运行内存泄漏测试
     */
    runMemoryLeakTest(): Promise<void>;
    /**
     * 运行压力测试
     */
    runStressTest(): Promise<void>;
    /**
     * 打印结果
     */
    private printResult;
    /**
     * 打印性能对比
     */
    private printComparison;
    /**
     * 获取内存使用量（字节）
     */
    private getMemoryUsage;
    /**
     * 格式化内存大小
     */
    private formatMemory;
    /**
     * 强制垃圾回收
     */
    private forceGC;
    /**
     * 获取百分位数
     */
    private getPercentile;
    /**
     * 睡眠
     */
    private sleep;
}
/**
 * 运行所有性能测试
 */
export declare function runAllBenchmarks(): Promise<void>;
export {};
