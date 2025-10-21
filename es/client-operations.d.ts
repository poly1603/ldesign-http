/**
 * HTTP 客户端文件操作模块
 *
 * 处理文件上传和下载相关功能
 */
import type { HttpClient } from './types';
import type { DownloadConfig, DownloadResult } from './utils/download';
import type { UploadConfig, UploadResult } from './utils/upload';
/**
 * 文件操作功能接口
 */
export interface FileOperations {
    /**
     * 上传文件
     */
    upload: <T = any>(url: string, file: File | File[] | FormData, config?: UploadConfig) => Promise<UploadResult<T>>;
    /**
     * 下载文件
     */
    download: (url: string, config?: DownloadConfig) => Promise<DownloadResult>;
}
/**
 * 文件操作处理器
 */
export declare class FileOperationHandler implements FileOperations {
    private client;
    constructor(client: HttpClient);
    /**
     * 上传文件（支持多文件和进度跟踪）
     */
    upload<T = any>(url: string, file: File | File[] | FormData, config?: UploadConfig): Promise<UploadResult<T>>;
    /**
     * 下载文件（支持进度跟踪和自动保存）
     */
    download(url: string, config?: DownloadConfig): Promise<DownloadResult>;
}
/**
 * 创建文件操作处理器
 */
export declare function createFileOperationHandler(client: HttpClient): FileOperationHandler;
