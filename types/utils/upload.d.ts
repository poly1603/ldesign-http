/**
 * 文件上传工具函数
 * 提供文件上传、进度监控、断点续传等功能
 */
import type { RequestConfig, ResponseData } from '../types';
/**
 * 文件上传配置
 */
export interface UploadConfig extends Omit<RequestConfig, 'data'> {
    /** 文件字段名 */
    fileField?: string;
    /** 额外的表单数据 */
    formData?: Record<string, string | Blob>;
    /** 上传进度回调 */
    onProgress?: (progress: UploadProgress) => void;
    /** 分片大小（字节），用于大文件分片上传 */
    chunkSize?: number;
    /** 是否启用断点续传 */
    resumable?: boolean;
    /** 文件类型限制 */
    accept?: string[];
    /** 文件大小限制（字节） */
    maxSize?: number;
    /** 并发上传数量 */
    concurrent?: number;
}
/**
 * 上传进度信息
 */
export interface UploadProgress {
    /** 已上传字节数 */
    loaded: number;
    /** 总字节数 */
    total: number;
    /** 上传百分比 (0-100) */
    percentage: number;
    /** 上传速度 (字节/秒) */
    speed: number;
    /** 预计剩余时间 (秒) */
    timeRemaining: number;
    /** 当前上传的文件 */
    file?: File;
    /** 当前分片索引 */
    chunkIndex?: number;
    /** 总分片数 */
    totalChunks?: number;
}
/**
 * 上传结果
 */
export interface UploadResult<T = any> extends ResponseData<T> {
    /** 上传的文件信息 */
    file: File;
    /** 上传耗时 */
    duration: number;
}
/**
 * 分片信息
 */
export interface ChunkInfo {
    /** 分片索引 */
    index: number;
    /** 分片数据 */
    chunk: Blob;
    /** 分片大小 */
    size: number;
    /** 分片开始位置 */
    start: number;
    /** 分片结束位置 */
    end: number;
    /** 文件哈希 */
    fileHash: string;
}
/**
 * 文件验证错误
 */
export declare class FileValidationError extends Error {
    file: File;
    code: 'TYPE_NOT_ALLOWED' | 'SIZE_TOO_LARGE' | 'INVALID_FILE';
    constructor(message: string, file: File, code: 'TYPE_NOT_ALLOWED' | 'SIZE_TOO_LARGE' | 'INVALID_FILE');
}
/**
 * 验证文件
 */
export declare function validateFile(file: File, config: UploadConfig): void;
/**
 * 格式化文件大小
 */
export declare function formatFileSize(bytes: number): string;
/**
 * 获取文件扩展名
 */
export declare function getFileExtension(filename: string): string;
/**
 * 生成文件哈希
 */
export declare function generateFileHash(file: File): Promise<string>;
/**
 * 将文件分片
 */
export declare function createFileChunks(file: File, chunkSize: number): ChunkInfo[];
/**
 * 创建上传表单数据
 */
export declare function createUploadFormData(file: File, config: UploadConfig, chunkInfo?: ChunkInfo): FormData;
/**
 * 计算上传进度
 */
export declare class ProgressCalculator {
    private startTime;
    private lastLoaded;
    private lastTime;
    private speeds;
    calculate(loaded: number, total: number, file?: File): UploadProgress;
    reset(): void;
}
/**
 * 检查文件是否为图片
 */
export declare function isImageFile(file: File): boolean;
/**
 * 检查文件是否为视频
 */
export declare function isVideoFile(file: File): boolean;
/**
 * 检查文件是否为音频
 */
export declare function isAudioFile(file: File): boolean;
/**
 * 检查文件是否为文档
 */
export declare function isDocumentFile(file: File): boolean;
/**
 * 生成文件预览URL
 */
export declare function createFilePreviewURL(file: File): string;
/**
 * 释放文件预览URL
 */
export declare function revokeFilePreviewURL(url: string): void;
