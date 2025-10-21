/**
 * Vue 网络状态 Composable
 *
 * 响应式的网络状态监听
 */
import type { Ref } from 'vue';
import { type NetworkInfo, type NetworkMonitorConfig, type NetworkStatus } from '../utils/network';
/**
 * 网络状态 Composable 返回值
 */
export interface UseNetworkStatusReturn {
    /** 是否在线 */
    isOnline: Ref<boolean>;
    /** 是否离线 */
    isOffline: Ref<boolean>;
    /** 网络状态 */
    status: Ref<NetworkStatus>;
    /** 网络信息 */
    networkInfo: Ref<NetworkInfo>;
    /** 是否适合大文件传输 */
    isSuitableForLargeTransfer: Ref<boolean>;
    /** 是否是WiFi */
    isWifi: Ref<boolean>;
    /** 是否是移动网络 */
    isCellular: Ref<boolean>;
    /** 是否按流量计费 */
    isMetered: Ref<boolean>;
    /** 刷新网络信息 */
    refresh: () => void;
}
/**
 * 网络状态 Hook
 *
 * 响应式监听网络状态变化
 *
 * @example
 * ```vue
 * <script setup>
 * import { useNetworkStatus } from '@ldesign/http'
 *
 * const { isOnline, isOffline, networkInfo, isSuitableForLargeTransfer } = useNetworkStatus()
 * </script>
 *
 * <template>
 *  <div v-if="isOffline" class="offline-banner">
 *   您当前处于离线状态
 *  </div>
 *  <div v-if="!isSuitableForLargeTransfer">
 *   当前网络状况不佳，建议稍后上传文件
 *  </div>
 * </template>
 * ```
 */
export declare function useNetworkStatus(config?: NetworkMonitorConfig): UseNetworkStatusReturn;
