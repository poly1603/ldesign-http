<script setup lang="ts">
import { ref, shallowRef, markRaw } from 'vue'
import {
  Send, Search, GitPullRequest, Database,
  Shield, Timer, Wifi, Plug, Activity,
  Cpu, FileCode, Layers, Zap, ListOrdered,
  FormInput, ChevronsDown, Clock, Component,
} from 'lucide-vue-next'

import CoreDemo from './demos/CoreDemo.vue'
import BasicRequestDemo from './demos/BasicRequestDemo.vue'
import BasicHooksDemo from './demos/BasicHooksDemo.vue'
import RequestDemo from './demos/RequestDemo.vue'
import QueryDemo from './demos/QueryDemo.vue'
import MutationDemo from './demos/MutationDemo.vue'
import ResourceDemo from './demos/ResourceDemo.vue'
import PollingDemo from './demos/PollingDemo.vue'
import NetworkStatusDemo from './demos/NetworkStatusDemo.vue'
import StatusMonitorDemo from './demos/StatusMonitorDemo.vue'
import PaginationDemo from './demos/PaginationDemo.vue'
import InfiniteScrollDemo from './demos/InfiniteScrollDemo.vue'
import FormDemo from './demos/FormDemo.vue'
import ThrottleDemo from './demos/ThrottleDemo.vue'
import OptimisticDemo from './demos/OptimisticDemo.vue'
import RequestQueueDemo from './demos/RequestQueueDemo.vue'
import ComponentsDemo from './demos/ComponentsDemo.vue'
import InterceptorDemo from './demos/InterceptorDemo.vue'
import PluginDemo from './demos/PluginDemo.vue'

interface NavItem {
  id: string
  label: string
  icon: any
  component: any
}

const sections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Core 核心',
    items: [
      { id: 'core', label: '原生 JS 用法', icon: markRaw(Cpu), component: markRaw(CoreDemo) },
    ],
  },
  {
    title: 'Hooks 组合式函数',
    items: [
      { id: 'basic', label: 'useHttp 基础请求', icon: markRaw(Send), component: markRaw(BasicRequestDemo) },
      { id: 'basic-hooks', label: 'useGet/Post/Put/Delete', icon: markRaw(Layers), component: markRaw(BasicHooksDemo) },
      { id: 'request', label: 'useRequest 注入式', icon: markRaw(FileCode), component: markRaw(RequestDemo) },
      { id: 'query', label: 'useQuery 查询缓存', icon: markRaw(Search), component: markRaw(QueryDemo) },
      { id: 'mutation', label: 'useMutation 变更', icon: markRaw(GitPullRequest), component: markRaw(MutationDemo) },
      { id: 'resource', label: 'useResource 资源', icon: markRaw(Database), component: markRaw(ResourceDemo) },
      { id: 'polling', label: 'usePolling 轮询', icon: markRaw(Timer), component: markRaw(PollingDemo) },
      { id: 'pagination', label: 'usePagination 分页', icon: markRaw(Layers), component: markRaw(PaginationDemo) },
      { id: 'infinite-scroll', label: 'useInfiniteScroll 无限滚动', icon: markRaw(ChevronsDown), component: markRaw(InfiniteScrollDemo) },
      { id: 'form', label: 'useForm 表单', icon: markRaw(FormInput), component: markRaw(FormDemo) },
      { id: 'throttle', label: '防抖/节流请求', icon: markRaw(Clock), component: markRaw(ThrottleDemo) },
      { id: 'optimistic', label: '乐观更新', icon: markRaw(Zap), component: markRaw(OptimisticDemo) },
      { id: 'queue', label: '请求队列', icon: markRaw(ListOrdered), component: markRaw(RequestQueueDemo) },
      { id: 'network', label: 'useNetworkStatus 网络', icon: markRaw(Wifi), component: markRaw(NetworkStatusDemo) },
      { id: 'monitor', label: 'useStatusMonitor 监控', icon: markRaw(Activity), component: markRaw(StatusMonitorDemo) },
    ],
  },
  {
    title: 'Components 组件',
    items: [
      { id: 'components', label: 'Vue 组件', icon: markRaw(Component), component: markRaw(ComponentsDemo) },
    ],
  },
  {
    title: 'Advanced 高级',
    items: [
      { id: 'interceptor', label: '拦截器', icon: markRaw(Shield), component: markRaw(InterceptorDemo) },
      { id: 'plugin', label: '插件系统', icon: markRaw(Plug), component: markRaw(PluginDemo) },
    ],
  },
]

const activeId = ref('core')
const activeComponent = shallowRef<any>(CoreDemo)

function navigate(item: NavItem) {
  activeId.value = item.id
  activeComponent.value = item.component
}
</script>

<template>
  <div class="app-layout">
    <aside class="app-sidebar">
      <div class="sidebar-header">
        <h1>@ldesign/http</h1>
        <p>演练场</p>
      </div>
      <nav class="sidebar-nav">
        <div v-for="section in sections" :key="section.title" class="nav-section">
          <div class="nav-section-title">{{ section.title }}</div>
          <button
            v-for="item in section.items"
            :key="item.id"
            class="nav-item"
            :class="{ active: activeId === item.id }"
            @click="navigate(item)"
          >
            <component :is="item.icon" />
            {{ item.label }}
          </button>
        </div>
      </nav>
    </aside>
    <main class="app-main">
      <component :is="activeComponent" />
    </main>
  </div>
</template>
