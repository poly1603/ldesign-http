<script setup lang="ts">
import { Wifi, WifiOff, RefreshCw, Signal } from 'lucide-vue-next'
import { useNetworkStatus } from '@ldesign/http-vue'

const {
  isOnline, isOffline, status, networkInfo,
  isSuitableForLargeTransfer, isWifi, isCellular, isMetered,
  refresh,
} = useNetworkStatus()
</script>

<template>
  <div class="demo-page">
    <h2>useNetworkStatus 网络状态</h2>
    <p class="page-desc">
      响应式网络状态监听。检测在线/离线、连接类型和网络质量。
    </p>

    <div class="card">
      <h3>
        <Wifi v-if="isOnline" :size="18" />
        <WifiOff v-else :size="18" />
        网络状态
      </h3>

      <div class="flex items-center gap-2 mb-4">
        <span :class="['badge', isOnline ? 'badge-success' : 'badge-error']">
          {{ isOnline ? '在线' : '离线' }}
        </span>
        <button class="btn btn-sm" @click="refresh">
          <RefreshCw :size="12" /> 刷新
        </button>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value" style="font-size: 16px">{{ status }}</div>
          <div class="metric-label">状态</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="font-size: 16px">{{ networkInfo.connectionType || '未知' }}</div>
          <div class="metric-label">连接类型</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="font-size: 16px">
            {{ networkInfo.effectiveType || 'N/A' }}
          </div>
          <div class="metric-label">有效类型</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="font-size: 16px">
            {{ networkInfo.downlink ? `${networkInfo.downlink} Mbps` : 'N/A' }}
          </div>
          <div class="metric-label">下行速度</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="font-size: 16px">
            {{ networkInfo.rtt ? `${networkInfo.rtt}ms` : 'N/A' }}
          </div>
          <div class="metric-label">往返时间</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="font-size: 16px">
            {{ networkInfo.metered ? '是' : '否' }}
          </div>
          <div class="metric-label">按流量计费</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3><Signal :size="18" /> 连接标志</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>属性</th>
            <th>值</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>isOnline</code></td>
            <td><span :class="['badge', isOnline ? 'badge-success' : 'badge-error']">{{ isOnline }}</span></td>
            <td class="text-secondary">浏览器是否连接到网络</td>
          </tr>
          <tr>
            <td><code>isWifi</code></td>
            <td><span :class="['badge', isWifi ? 'badge-success' : 'badge-warning']">{{ isWifi }}</span></td>
            <td class="text-secondary">是否通过 WiFi 连接</td>
          </tr>
          <tr>
            <td><code>isCellular</code></td>
            <td><span :class="['badge', isCellular ? 'badge-warning' : 'badge-success']">{{ isCellular }}</span></td>
            <td class="text-secondary">是否通过移动网络连接 (2G/3G/4G)</td>
          </tr>
          <tr>
            <td><code>isMetered</code></td>
            <td><span class="badge badge-warning">{{ isMetered }}</span></td>
            <td class="text-secondary">是否按流量计费（有流量限制）</td>
          </tr>
          <tr>
            <td><code>isSuitableForLargeTransfer</code></td>
            <td><span :class="['badge', isSuitableForLargeTransfer ? 'badge-success' : 'badge-error']">{{ isSuitableForLargeTransfer }}</span></td>
            <td class="text-secondary">是否适合大文件传输</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>useNetworkStatus</code> 基于 <code>@ldesign/http-core</code> 的 <code>NetworkMonitor</code>，
        封装了浏览器的 <code>navigator.onLine</code> 和 <code>NetworkInformation API</code>，
        提供响应式的网络状态监听。当网络状态变化时，所有引用自动更新。
      </p>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { useNetworkStatus } from '@ldesign/http-vue'

const {
  isOnline,                    // Ref&lt;boolean&gt; - 是否在线
  isOffline,                   // ComputedRef&lt;boolean&gt; - 是否离线
  status,                      // Ref&lt;NetworkStatus&gt; - 状态字符串
  networkInfo,                 // Ref&lt;NetworkInfo&gt; - 详细网络信息
  isSuitableForLargeTransfer,  // ComputedRef&lt;boolean&gt; - 是否适合大文件传输
  isWifi,                      // ComputedRef&lt;boolean&gt; - 是否 WiFi
  isCellular,                  // ComputedRef&lt;boolean&gt; - 是否移动网络
  isMetered,                   // ComputedRef&lt;boolean&gt; - 是否按流量计费
  refresh,                     // () => void - 手动刷新状态
} = useNetworkStatus()</pre>
    </div>

    <div class="card">
      <h3>应用场景</h3>
      <pre class="code-block">// 场景一：条件性上传
if (isSuitableForLargeTransfer.value) {
  await uploadLargeFile(file)
} else {
  showWarning('网络过慢，不适合上传大文件')
}

// 场景二：离线提示
&lt;div v-if="isOffline" class="offline-banner"&gt;
  您当前处于离线状态，部分功能不可用
&lt;/div&gt;

// 场景三：根据网络质量调整图片质量
const imageQuality = computed(() => {
  if (isWifi.value) return 'high'
  if (isCellular.value) return 'low'
  return 'medium'
})</pre>
    </div>

    <div class="card">
      <h3>NetworkInfo 属性</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>属性</th>
            <th>类型</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>online</code></td>
            <td><code>boolean</code></td>
            <td>是否在线</td>
          </tr>
          <tr>
            <td><code>connectionType</code></td>
            <td><code>ConnectionType</code></td>
            <td>连接类型（wifi/cellular/ethernet）</td>
          </tr>
          <tr>
            <td><code>effectiveType</code></td>
            <td><code>string</code></td>
            <td>有效连接类型（slow-2g/2g/3g/4g）</td>
          </tr>
          <tr>
            <td><code>downlink</code></td>
            <td><code>number</code></td>
            <td>下行速度（Mbps）</td>
          </tr>
          <tr>
            <td><code>rtt</code></td>
            <td><code>number</code></td>
            <td>往返时间（ms）</td>
          </tr>
          <tr>
            <td><code>metered</code></td>
            <td><code>boolean</code></td>
            <td>是否按流量计费</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
