<script setup lang="ts">
import { provide, ref, onUnmounted, watch } from 'vue'
import type { HttpProviderProps, HttpProviderContext } from './types'
import { HTTP_PROVIDER_KEY } from './types'

/**
 * HttpProvider 组件
 * 
 * 提供全局 HTTP 客户端配置和上下文注入
 * 
 * @example
 * ```vue
 * <HttpProvider :client="httpClient">
 *   <RouterView />
 * </HttpProvider>
 * ```
 */

const props = withDefaults(defineProps<HttpProviderProps>(), {
  config: () => ({}),
  devtools: false,
  inherit: true,
})

// 响应式配置
const configRef = ref(props.config || {})
const devtoolsRef = ref(props.devtools)

// HttpClient 可选，但推荐传入
const httpClient = props.client

// 监听配置变化 - 简化处理，只更新本地配置引用
// 实际的配置更新由使用者在创建 client 时处理
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      configRef.value = newConfig
    }
  },
  { deep: true }
)

// 监听 devtools 配置变化
watch(
  () => props.devtools,
  (newValue) => {
    devtoolsRef.value = newValue
  }
)

// 提供上下文
const context: HttpProviderContext = {
  client: httpClient,
  config: configRef,
  devtools: devtoolsRef,
}

provide(HTTP_PROVIDER_KEY, context)

// 清理资源 - HttpProvider 不负责销毁客户端
// 客户端的生命周期应由创建它的地方管理
onUnmounted(() => {
  // 组件卸载时不做任何清理
  // 让客户端继续存在，由应用层面控制其生命周期
})
</script>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'HttpProvider',
})
</script>

<template>
  <slot></slot>
</template>