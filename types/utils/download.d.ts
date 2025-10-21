/**
 * 文件下载工具函数
 * 提供文件下载、进度监控、断点续传等功能
 */
import type { RequestConfig } from '../types';
/**
 * 下载配置
 */
export interface DownloadConfig extends RequestConfig {
    /** 下载文件名 */
    filename?: string;
    /** 下载进度回调 */
    onProgress?: (progress: DownloadProgress) => void;
    /** 是否启用断点续传 */
    resumable?: boolean;
    /** 分片大小（字节），用于大文件分片下载 */
    chunkSize?: number;
    /** 是否自动保存文件 */
    autoSave?: boolean;
    /** 保存目录（仅 Node.js 环境） */
    saveDir?: string;
}
/**
 * 下载进度信息
 */
export interface DownloadProgress {
    /** 已下载字节数 */
    loaded: number;
    /** 总字节数 */
    total: number;
    /** 下载百分比 (0-100) */
    percentage: number;
    /** 下载速度 (字节/秒) */
    speed: number;
    /** 预计剩余时间 (秒) */
    timeRemaining: number;
    /** 下载的文件名 */
    filename?: string;
    /** 当前分片索引 */
    chunkIndex?: number;
    /** 总分片数 */
    totalChunks?: number;
}
/**
 * 下载结果
 */
export interface DownloadResult {
    /** 下载的数据 */
    data: Blob | ArrayBuffer | string;
    /** 文件名 */
    filename: string;
    /** 文件大小 */
    size: number;
    /** 文件类型 */
    type: string;
    /** 下载耗时 */
    duration: number;
    /** 下载URL（如果自动保存） */
    url?: string;
}
/**
 * 分片下载信息
 */
export interface DownloadChunk {
    /** 分片索引 */
    index: number;
    /** 分片开始位置 */
    start: number;
    /** 分片结束位置 */
    end: number;
    /** 分片大小 */
    size: number;
    /** 分片数据 */
    data?: ArrayBuffer;
    /** 是否已完成 */
    completed: boolean;
}
/**
 * 下载进度计算器
 */
export declare class DownloadProgressCalculator {
    private startTime;
    private lastLoaded;
    private lastTime;
    private speeds;
    calculate(loaded: number, total: number, filename?: string): DownloadProgress;
    reset(): void;
}
/**
 * 从响应头获取文件名
 */
export declare function getFilenameFromResponse(headers: Record<string, string>): string | null;
/**
 * 从URL获取文件名
 */
export declare function getFilenameFromURL(url: string): string;
/**
 * 获取文件MIME类型
 */
export declare function getMimeTypeFromFilename(filename: string): string;
/**
 * 保存文件到本地（浏览器环境）
 */
export declare function saveFileToLocal(data: Blob, filename: string): void;
/**
 * 创建下载分片
 */
export declare function createDownloadChunks(totalSize: number, chunkSize: number): DownloadChunk[];
/**
 * 合并下载分片
 */
export declare function mergeDownloadChunks(chunks: DownloadChunk[]): ArrayBuffer;
/**
 * 检查是否支持断点续传
 */
export declare function supportsRangeRequests(headers: Record<string, string>): boolean;
/**
 * 创建Range请求头
 */
export declare function createRangeHeader(start: number, end?: number): string;
/**
 * 解析Content-Range响应头
 */
export declare function parseContentRange(contentRange: string): {
    start: number;
    end: number;
    total: number;
} | null;
/**
 * 格式化下载速度
 */
export declare function formatDownloadSpeed(bytesPerSecond: number): string;
/**
 * 格式化剩余时间
 */
export declare function formatTimeRemaining(seconds: number): string;
/**
 * 检查文件是否可以预览
 */
export declare function isPreviewableFile(filename: string): boolean;
