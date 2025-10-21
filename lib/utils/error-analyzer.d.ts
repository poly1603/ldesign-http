/**
 * 错误分析器模块
 *
 * 提供错误模式分析和建议生成功能
 */
import type { HttpError } from '../types';
/**
 * 错误模式类型
 */
export type ErrorPatternType = 'network_errors' | 'timeout_errors' | 'auth_errors' | 'server_errors' | 'client_errors' | 'rate_limit_errors' | 'permission_errors';
/**
 * 错误模式分析结果
 */
export interface ErrorPattern {
    type: string;
    count: number;
    percentage: number;
    description: string;
}
/**
 * 错误分析结果
 */
export interface ErrorAnalysisResult {
    patterns: ErrorPattern[];
    recommendations: string[];
    summary: {
        totalErrors: number;
        uniqueEndpoints: number;
        timeRange: {
            start: number;
            end: number;
        };
        mostFrequentError?: {
            type: string;
            count: number;
        };
    };
}
/**
 * 错误分析器
 */
export declare class ErrorAnalyzer {
    private static readonly patternDescriptions;
    /**
     * 分析错误模式
     */
    static analyzeErrorPatterns(errors: HttpError[]): ErrorAnalysisResult;
    /**
     * 获取模式描述
     */
    private static getPatternDescription;
    /**
     * 生成建议
     */
    private static generateRecommendations;
    /**
     * 生成错误报告
     */
    static generateErrorReport(errors: HttpError[]): string;
    /**
     * 预测错误趋势
     */
    static predictErrorTrend(errors: HttpError[]): {
        trend: 'increasing' | 'decreasing' | 'stable';
        rate: number;
    };
}
