<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello HTTP Vue!')
</script>

<template>
  <div class="app">
    <h1>{{ message }}</h1>
    <p>Vue 3 集成演示</p>
    
    <div class="demo-section">
      <h2>演示区域</h2>
      <!-- TODO: 添加具体的演示内容 -->
      <p>功能演示即将推出...</p>
    </div>
  </div>
</template>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #42b983;
  margin-bottom: 1rem;
}

.demo-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
}
</style>
