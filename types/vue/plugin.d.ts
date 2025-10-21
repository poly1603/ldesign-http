import type { App, Plugin } from 'vue';
import type { HttpClient, RequestConfig } from '../types';
import type { HttpPluginOptions } from '../types/vue';
/**
 * Vue 3 HTTP 插件
 */
export declare const HttpPlugin: Plugin;
/**
 * 安装插件的便利函数
 */
export declare function install(app: App, options?: HttpPluginOptions): void;
/**
 * HTTP Provider 组件
 * 用于在组件树中提供 HTTP 客户端
 */
export declare const HttpProvider: {
    name: string;
    props: {
        client: {
            type: () => HttpClient;
            required: boolean;
        };
        config: {
            type: () => RequestConfig;
            required: boolean;
        };
    };
    setup(props: {
        client?: HttpClient;
        config?: RequestConfig;
    }, { slots }: any): () => any;
};
/**
 * 创建 HTTP 插件实例
 */
export declare function createHttpPlugin(options?: HttpPluginOptions): Plugin;
/**
 * 默认导出
 */
export default HttpPlugin;
declare module 'vue' {
    interface ComponentCustomProperties {
        $http: HttpClient;
    }
    interface GlobalComponents {
        HttpProvider: typeof HttpProvider;
    }
}
