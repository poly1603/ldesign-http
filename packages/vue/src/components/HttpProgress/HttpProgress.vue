<template>
  <div :class="['http-progress', `http-progress--${type}`, `http-progress--${size}`]">
    <!-- 文件信息 -->
    <div v-if="fileName" class="http-progress__header">
      <span class="http-progress__filename" :title="fileName">{{ fileName }}</span>
      <div class="http-progress__actions">
        <button
          v-if="pausable && !paused && currentPercent < 100"
          class="http-progress__btn"
          @click="handlePause"
          title="暂停"
        >
          ⏸
        </button>
        <button
          v-if="pausable && paused"
          class="http-progress__btn"
          @click="handleResume"
          title="继续"
        >
          ▶
        </button>
        <button
          v-if="cancellable && currentPercent < 100"
          class="http-progress__btn http-progress__btn--danger"
          @click="handleCancel"
          title="取消"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 线形进度条 -->
    <div v-if="type === 'line'" class="http-progress__line">
      <div class="http-progress__outer" :style="{ height: `${strokeWidth}px` }">
        <div
          class="http-progress__inner"
          :class="{
            'http-progress__inner--animated': animated,
            'http-progress__inner--striped': striped,
            'http-progress__inner--active': status === 'active',
          }"
          :style="lineStyle"
        />
      </div>
      <div v-if="showText" class="http-progress__text">
        <slot name="text" :percent="currentPercent">
          {{ formattedText }}
        </slot>
      </div>
    </div>

    <!-- 圆形/仪表盘进度条 -->
    <div v-else-if="type === 'circle' || type === 'dashboard'" class="http-progress__circle">
      <svg :width="circleSize" :height="circleSize" viewBox="0 0 100 100">
        <!-- 背景圆 -->
        <path
          :d="circlePath.path"
          :stroke="trailColor || '#e5e7eb'"
          :stroke-width="relativeStrokeWidth"
          fill="none"
          class="http-progress__trail"
        />
        <!-- 进度圆 -->
        <path
          :d="circlePath.path"
          :stroke="currentColor"
          :stroke-width="relativeStrokeWidth"
          :stroke-dasharray="circlePath.perimeter"
          :stroke-dashoffset="circlePath.offset"
          stroke-linecap="round"
          fill="none"
          :class="{
            'http-progress__stroke': true,
            'http-progress__stroke--animated': animated,
          }"
        />
      </svg>
      <div v-if="showText" class="http-progress__circle-text">
        <slot name="text" :percent="currentPercent">
          {{ formattedText }}
        </slot>
      </div>
    </div>

    <!-- 详细信息 -->
    <div v-if="showSpeed || showRemaining || (loaded !== undefined && total !== undefined)" class="http-progress__details">
      <div v-if="loaded !== undefined && total !== undefined" class="http-progress__size">
        {{ formatFileSize(loaded) }} / {{ formatFileSize(total) }}
      </div>
      <div v-if="showSpeed && speed !== undefined" class="http-progress__speed">
        {{ formatSpeed(speed) }}
      </div>
      <div v-if="showRemaining && remaining !== undefined && remaining > 0" class="http-progress__remaining">
        剩余 {{ formatProgressTime(remaining) }}
      </div>
    </div>

    <!-- 状态图标 -->
    <div v-if="statusIcon" class="http-progress__status-icon" :style="{ color: currentColor }">
      {{ statusIcon }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { HttpProgressProps, HttpProgressEmits } from './types'
import {
  formatFileSize,
  formatSpeed,
  formatProgressTime,
  getProgressColor,
  getCirclePath,
} from './types'

const props = withDefaults(defineProps<HttpProgressProps>(), {
  percent: 0,
  type: 'line',
  status: 'normal',
  strokeWidth: 6,
  showText: true,
  showSpeed: false,
  showRemaining: false,
  cancellable: false,
  pausable: false,
  paused: false,
  size: 'medium',
  animated: true,
  striped: false,
})

const emit = defineEmits<HttpProgressEmits>()

// 响应式进度值（支持动画过渡）
const currentPercent = ref(props.percent)

watch(
  () => props.percent,
  (newVal) => {
    if (newVal !== undefined) {
      currentPercent.value = Math.min(Math.max(newVal, 0), 100)
    }
  },
  { immediate: true }
)

// 当前颜色
const currentColor = computed(() => {
  return getProgressColor(currentPercent.value, props.color, props.status)
})

// 线形进度条样式
const lineStyle = computed(() => {
  return {
    width: `${currentPercent.value}%`,
    backgroundColor: currentColor.value,
  }
})

// 圆形尺寸
const circleSize = computed(() => {
  if (typeof props.size === 'number') {
    return props.size
  }
  const sizes = {
    small: 80,
    medium: 120,
    large: 160,
  }
  return sizes[props.size]
})

// 相对笔画宽度
const relativeStrokeWidth = computed(() => {
  return ((props.strokeWidth / circleSize.value) * 100).toFixed(1)
})

// 圆形路径
const circlePath = computed(() => {
  return getCirclePath(50, Number(relativeStrokeWidth.value), currentPercent.value)
})

// 格式化文本
const formattedText = computed(() => {
  if (props.format) {
    return props.format(currentPercent.value)
  }
  return `${currentPercent.value.toFixed(0)}%`
})

// 状态图标
const statusIcon = computed(() => {
  if (props.status === 'success') return '✓'
  if (props.status === 'error') return '✕'
  if (props.status === 'warning') return '⚠'
  if (props.paused) return '⏸'
  return ''
})

// 事件处理
const handleCancel = () => {
  emit('cancel')
}

const handlePause = () => {
  emit('pause')
}

const handleResume = () => {
  emit('resume')
}

// 导出方法
defineExpose({
  percent: currentPercent,
})
</script>

<style scoped>
.http-progress {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 尺寸 */
.http-progress--small {
  font-size: 12px;
}

.http-progress--medium {
  font-size: 14px;
}

.http-progress--large {
  font-size: 16px;
}

/* 头部 */
.http-progress__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.http-progress__filename {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: #303133;
}

.http-progress__actions {
  display: flex;
  gap: 4px;
}

.http-progress__btn {
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.http-progress__btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.http-progress__btn--danger:hover {
  border-color: #f56c6c;
  color: #f56c6c;
}

/* 线形进度条 */
.http-progress__line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.http-progress__outer {
  flex: 1;
  background-color: #f5f7fa;
  border-radius: 100px;
  overflow: hidden;
}

.http-progress__inner {
  height: 100%;
  border-radius: 100px;
  transition: width 0.3s ease;
  position: relative;
}

.http-progress__inner--animated {
  transition: width 0.6s ease;
}

.http-progress__inner--striped {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 20px 20px;
}

.http-progress__inner--active {
  animation: progress-active 2s linear infinite;
}

@keyframes progress-active {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 20px;
  }
}

.http-progress__text {
  min-width: 50px;
  text-align: right;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

/* 圆形进度条 */
.http-progress__circle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.http-progress__trail {
  transition: stroke-dashoffset 0.3s ease;
}

.http-progress__stroke {
  transition: stroke-dashoffset 0.6s ease, stroke 0.3s ease;
}

.http-progress__stroke--animated {
  transition: stroke-dashoffset 1s ease, stroke 0.3s ease;
}

.http-progress__circle-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

/* 详细信息 */
.http-progress__details {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.http-progress__size,
.http-progress__speed,
.http-progress__remaining {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 状态图标 */
.http-progress__status-icon {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  font-weight: bold;
}

/* 响应式 */
@media (max-width: 640px) {
  .http-progress__details {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>