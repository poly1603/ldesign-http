import type { Ref } from 'vue';
import type { HttpClientConfig, RequestConfig } from '../types';
/**
 * 表单验证规则
 */
export interface ValidationRule<T = any> {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    validator?: (value: T) => boolean | string;
    message?: string;
}
/**
 * 表单字段配置
 */
export interface FormField<T = any> {
    value: T;
    rules?: ValidationRule<T>[];
    error?: string;
}
/**
 * 表单选项
 */
export interface FormOptions<T> {
    /** 初始数据 */
    initialData?: Partial<T>;
    /** 是否在组件卸载时取消请求 */
    cancelOnUnmount?: boolean;
    /** 提交成功回调 */
    onSuccess?: (data: any, response: any) => void;
    /** 提交失败回调 */
    onError?: (error: Error) => void;
    /** 验证失败回调 */
    onValidationError?: (errors: Record<string, string>) => void;
    /** HTTP客户端配置 */
    clientConfig?: HttpClientConfig;
}
/**
 * 表单返回值
 */
export interface FormReturn<T> {
    /** 表单数据 */
    data: T;
    /** 提交状态 */
    submitting: Ref<boolean>;
    /** 错误信息 */
    error: Ref<Error | null>;
    /** 验证错误 */
    errors: Ref<Record<string, string>>;
    /** 是否有错误 */
    hasError: Ref<boolean>;
    /** 是否有验证错误 */
    hasValidationErrors: Ref<boolean>;
    /** 是否有任何错误 */
    hasAnyError: Ref<boolean>;
    /** 表单是否有效 */
    isValid: Ref<boolean>;
    /** 提交表单 */
    submit: (url: string, config?: RequestConfig) => Promise<any>;
    /** 验证表单 */
    validate: () => boolean;
    /** 验证单个字段 */
    validateField: (field: keyof T) => boolean;
    /** 重置表单 */
    reset: () => void;
    /** 清除错误 */
    clearErrors: () => void;
    /** 清除验证错误 */
    clearValidationErrors: () => void;
    /** 设置字段值 */
    setField: (field: keyof T, value: any) => void;
    /** 设置字段错误 */
    setFieldError: (field: keyof T, error: string) => void;
}
/**
 * 表单管理hook
 * 提供表单数据管理、验证和提交功能
 *
 * @example
 * ```ts
 * const { data, submitting, errors, submit, validate } = useForm<User>({
 *   initialData: { name: '', email: '' }
 * })
 *
 * // 设置验证规则
 * const rules = {
 *   name: [{ required: true, message: '姓名不能为空' }],
 *   email: [
 *     { required: true, message: '邮箱不能为空' },
 *     { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' }
 *   ]
 * }
 *
 * // 提交表单
 * const handleSubmit = async () => {
 *   if (validate()) {
 *     await submit('/api/users')
 *   }
 * }
 * ```
 */
export declare function useForm<T extends Record<string, any>>(options?: FormOptions<T>): FormReturn<T>;
