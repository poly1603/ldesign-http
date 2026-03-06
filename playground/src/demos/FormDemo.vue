<script setup lang="ts">
import { ref } from 'vue'
import { FileText, Send, RotateCcw } from 'lucide-vue-next'
import { useForm } from '@ldesign/http-vue'

const submitLog = ref<string[]>([])

const form = useForm<{ name: string; email: string; age: string }>({
  initialData: { name: '', email: '', age: '' },
  onSuccess: (data) => {
    submitLog.value.push(`[成功] 服务器返回: ${JSON.stringify(data)}`)
  },
  onError: (err) => {
    submitLog.value.push(`[失败] ${err.message}`)
  },
  onValidationError: (errors) => {
    submitLog.value.push(`[验证失败] ${JSON.stringify(errors)}`)
  },
})

// 设置验证规则
;(form as any).setValidationRules({
  name: [
    { required: true, message: '姓名不能为空' },
    { min: 2, message: '姓名至少 2 个字符' },
  ],
  email: [
    { required: true, message: '邮箱不能为空' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' },
  ],
  age: [
    { validator: (v: string) => !v || (Number(v) >= 1 && Number(v) <= 150) || '年龄须在 1-150 之间' },
  ],
})

async function handleSubmit() {
  try {
    await form.submit('/api/users')
  } catch {}
}

function handleReset() {
  form.reset()
  submitLog.value = []
}
</script>

<template>
  <div class="demo-page">
    <h2>useForm 表单管理</h2>
    <p class="page-desc">
      表单数据管理、验证和提交一体化 Hook。支持 required/min/max/pattern/自定义验证规则。
    </p>

    <div class="card">
      <h3><FileText :size="18" /> 用户注册表单</h3>
      <div class="form-group">
        <label>姓名 *</label>
        <input v-model="form.data.name" class="input" placeholder="请输入姓名" />
        <span v-if="form.errors.value.name" class="text-xs" style="color: var(--color-error)">{{ form.errors.value.name }}</span>
      </div>
      <div class="form-group">
        <label>邮箱 *</label>
        <input v-model="form.data.email" class="input" placeholder="请输入邮箱" />
        <span v-if="form.errors.value.email" class="text-xs" style="color: var(--color-error)">{{ form.errors.value.email }}</span>
      </div>
      <div class="form-group">
        <label>年龄</label>
        <input v-model="form.data.age" class="input" placeholder="可选，1-150" type="number" />
        <span v-if="form.errors.value.age" class="text-xs" style="color: var(--color-error)">{{ form.errors.value.age }}</span>
      </div>

      <div class="btn-group">
        <button class="btn btn-primary" :disabled="form.submitting.value" @click="handleSubmit">
          <Send :size="14" /> 提交
        </button>
        <button class="btn" @click="handleReset">
          <RotateCcw :size="14" /> 重置
        </button>
      </div>

      <div class="flex items-center gap-2 mb-2">
        <span v-if="form.submitting.value" class="badge badge-loading"><span class="spinner" /> 提交中...</span>
        <span v-if="form.hasValidationErrors.value" class="badge badge-error">验证未通过</span>
        <span v-if="form.error.value" class="badge badge-error">提交失败</span>
      </div>

      <div v-if="submitLog.length" class="result-panel">
        <div class="result-label">日志</div>
        <div class="code-block">
          <div v-for="(entry, i) in submitLog" :key="i">{{ entry }}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>核心概念</h3>
      <p class="text-sm text-secondary mb-2">
        <code>useForm</code> 将表单数据管理、客户端验证和 HTTP 提交整合在一个 hook 中。
        它自动创建 HTTP 客户端，组件卸载时取消未完成的请求。
        验证规则支持 <code>required</code>、<code>min/max</code> 长度、<code>pattern</code> 正则和自定义 <code>validator</code> 函数。
      </p>
    </div>

    <div class="card">
      <h3>基础用法</h3>
      <pre class="code-block">import { useForm } from '@ldesign/http-vue'

const form = useForm&lt;{ name: string; email: string }&gt;({
  initialData: { name: '', email: '' },
  onSuccess: (data) => console.log('提交成功:', data),
  onError: (err) => console.error('提交失败:', err),
  onValidationError: (errors) => console.warn('验证失败:', errors),
})

// 设置验证规则
form.setValidationRules({
  name: [{ required: true, message: '姓名不能为空' }],
  email: [
    { required: true, message: '邮箱不能为空' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '格式不正确' },
  ],
})

// 手动验证
form.validate()           // 验证所有字段
form.validateField('name') // 验证单个字段

// 提交（内部自动验证 → POST 请求）
await form.submit('/api/users')

// 操作
form.reset()               // 重置表单
form.setField('name', 'Alice')  // 设置字段值
form.setFieldError('name', '自定义错误')
form.clearErrors()         // 清除提交错误
form.clearValidationErrors() // 清除验证错误</pre>
    </div>

    <div class="card">
      <h3>返回值 API</h3>
      <table class="data-table">
        <thead>
          <tr><th>属性/方法</th><th>类型</th><th>说明</th></tr>
        </thead>
        <tbody>
          <tr><td><code>data</code></td><td><code>Reactive&lt;T&gt;</code></td><td>响应式表单数据</td></tr>
          <tr><td><code>submitting</code></td><td><code>Ref&lt;boolean&gt;</code></td><td>是否正在提交</td></tr>
          <tr><td><code>error</code></td><td><code>Ref&lt;Error | null&gt;</code></td><td>提交错误</td></tr>
          <tr><td><code>errors</code></td><td><code>Ref&lt;Record&lt;string, string&gt;&gt;</code></td><td>验证错误字典</td></tr>
          <tr><td><code>hasValidationErrors</code></td><td><code>ComputedRef&lt;boolean&gt;</code></td><td>是否有验证错误</td></tr>
          <tr><td><code>isValid</code></td><td><code>ComputedRef&lt;boolean&gt;</code></td><td>表单是否有效</td></tr>
          <tr><td><code>submit(url)</code></td><td><code>Promise&lt;any&gt;</code></td><td>验证并提交</td></tr>
          <tr><td><code>validate()</code></td><td><code>boolean</code></td><td>验证所有字段</td></tr>
          <tr><td><code>validateField(field)</code></td><td><code>boolean</code></td><td>验证单个字段</td></tr>
          <tr><td><code>reset()</code></td><td><code>void</code></td><td>重置表单</td></tr>
          <tr><td><code>setField(field, value)</code></td><td><code>void</code></td><td>设置字段值</td></tr>
          <tr><td><code>setFieldError(field, msg)</code></td><td><code>void</code></td><td>设置字段错误</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>验证规则</h3>
      <pre class="code-block">// 验证规则接口
interface ValidationRule {
  required?: boolean          // 必填
  min?: number                // 最小长度
  max?: number                // 最大长度
  pattern?: RegExp            // 正则匹配
  validator?: (value) => boolean | string  // 自定义验证
  message?: string            // 错误提示
}

// 示例
{
  name: [
    { required: true, message: '必填' },
    { min: 2, max: 20, message: '2-20 个字符' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
  ],
  password: [
    { validator: (v) => v.length >= 8 || '密码至少 8 位' },
    { validator: (v) => /[A-Z]/.test(v) || '需要包含大写字母' },
  ],
}</pre>
    </div>
  </div>
</template>
