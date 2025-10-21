/**
 * 请求签名功能
 * 提供请求签名和验证，提高 API 安全性
 */
import type { RequestConfig } from '../types';
/**
 * 签名配置
 */
export interface SignatureConfig {
    /** 签名密钥 */
    secret: string;
    /** 签名算法 */
    algorithm?: 'sha256' | 'sha1' | 'md5';
    /** 签名头名称 */
    headerName?: string;
    /** 时间戳头名称 */
    timestampHeaderName?: string;
    /** 随机数头名称 */
    nonceHeaderName?: string;
    /** 签名有效期（秒） */
    expiresIn?: number;
    /** 是否包含请求体 */
    includeBody?: boolean;
    /** 是否包含查询参数 */
    includeParams?: boolean;
    /** 自定义签名生成器 */
    customGenerator?: (data: string, secret: string) => string | Promise<string>;
}
/**
 * 签名结果
 */
export interface SignatureResult {
    /** 签名值 */
    signature: string;
    /** 时间戳 */
    timestamp: number;
    /** 随机数 */
    nonce: string;
}
/**
 * 请求签名管理器
 *
 * 功能：
 * 1. 生成请求签名
 * 2. 验证请求签名
 * 3. 防重放攻击
 * 4. 支持多种签名算法
 */
export declare class SignatureManager {
    private config;
    private usedNonces;
    private nonceCleanupTimer?;
    constructor(config: SignatureConfig);
    /**
     * 为请求生成签名
     */
    sign(config: RequestConfig): Promise<RequestConfig>;
    /**
     * 验证请求签名
     */
    verify(config: RequestConfig): Promise<boolean>;
    /**
     * 构建签名数据
     */
    private buildSignData;
    /**
     * 生成签名
     */
    private generateSignature;
    /**
     * 哈希函数
     */
    private hash;
    /**
     * 简单哈希（不安全，仅用于开发）
     */
    private simpleHash;
    /**
     * 生成随机数
     */
    private generateNonce;
    /**
     * 对象排序（用于生成一致的签名）
     */
    private sortObject;
    /**
     * 启动随机数清理定时器
     */
    private startNonceCleanup;
    /**
     * 清空已使用的随机数
     */
    clearNonces(): void;
    /**
     * 销毁签名管理器
     */
    destroy(): void;
}
/**
 * 创建签名管理器
 */
export declare function createSignatureManager(config: SignatureConfig): SignatureManager;
/**
 * 创建签名拦截器
 */
export declare function createSignatureInterceptor(config: SignatureConfig): (requestConfig: RequestConfig) => Promise<RequestConfig>;
