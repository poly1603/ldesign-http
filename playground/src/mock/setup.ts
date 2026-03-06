/**
 * Mock API Setup
 *
 * 使用 fetch 拦截器模拟 REST API，无需真实后端
 */

interface User {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
}

interface Todo {
  id: number
  title: string
  completed: boolean
  userId: number
}

interface TaskStatus {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
}

// 模拟数据库
let users: User[] = [
  { id: 1, name: 'Alice Chen', email: 'alice@example.com', role: 'admin', createdAt: '2024-01-15' },
  { id: 2, name: 'Bob Wang', email: 'bob@example.com', role: 'editor', createdAt: '2024-02-20' },
  { id: 3, name: 'Carol Liu', email: 'carol@example.com', role: 'viewer', createdAt: '2024-03-10' },
  { id: 4, name: 'David Zhang', email: 'david@example.com', role: 'editor', createdAt: '2024-04-05' },
  { id: 5, name: 'Eva Li', email: 'eva@example.com', role: 'admin', createdAt: '2024-05-12' },
]

let todos: Todo[] = [
  { id: 1, title: 'Complete documentation', completed: false, userId: 1 },
  { id: 2, title: 'Fix login bug', completed: true, userId: 2 },
  { id: 3, title: 'Add unit tests', completed: false, userId: 1 },
  { id: 4, title: 'Deploy to staging', completed: false, userId: 3 },
  { id: 5, title: 'Review pull requests', completed: true, userId: 2 },
]

interface Post {
  id: number
  title: string
  body: string
  userId: number
}

// 模拟文章数据（用于分页/无限滚动）
const posts: Post[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `文章标题 #${i + 1}`,
  body: `这是第 ${i + 1} 篇文章的内容。用于分页和无限滚动演示。`,
  userId: (i % 5) + 1,
}))

// 轮询任务状态模拟
const taskStates: Record<string, TaskStatus> = {}
let nextUserId = 6
let nextTodoId = 6

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function jsonResponse(data: any, status = 200, delayMs = 200): Promise<Response> {
  return delay(delayMs + Math.random() * 300).then(() =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function matchRoute(url: string, pattern: string): Record<string, string> | null {
  const urlPath = new URL(url, 'http://localhost').pathname
  const patternParts = pattern.split('/')
  const urlParts = urlPath.split('/')

  if (patternParts.length !== urlParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = urlParts[i]
    } else if (patternParts[i] !== urlParts[i]) {
      return null
    }
  }
  return params
}

/**
 * 安装 Mock 拦截器
 *
 * 拦截 fetch 请求并返回模拟数据
 */
export function installMock(): void {
  const originalFetch = window.fetch

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const method = (init?.method || 'GET').toUpperCase()
    const body = init?.body ? JSON.parse(init.body as string) : undefined

    // /api/users
    if (matchRoute(url, '/api/users') && method === 'GET') {
      const urlObj = new URL(url, 'http://localhost')
      const q = urlObj.searchParams.get('q')?.toLowerCase()
      const page = parseInt(urlObj.searchParams.get('page') || '1')
      const pageSize = parseInt(urlObj.searchParams.get('pageSize') || urlObj.searchParams.get('limit') || '10')
      let filtered = users
      if (q) {
        filtered = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      }
      const start = (page - 1) * pageSize
      const paged = filtered.slice(start, start + pageSize)
      return jsonResponse({
        data: paged,
        total: filtered.length,
        page,
        pageSize,
      })
    }

    // /api/users/:id GET
    const userGetParams = matchRoute(url, '/api/users/:id')
    if (userGetParams && method === 'GET') {
      const user = users.find(u => u.id === parseInt(userGetParams.id))
      if (!user) return jsonResponse({ message: 'User not found' }, 404)
      return jsonResponse(user)
    }

    // /api/users POST
    if (matchRoute(url, '/api/users') && method === 'POST') {
      const newUser: User = {
        id: nextUserId++,
        name: body.name || 'Unknown',
        email: body.email || '',
        role: body.role || 'viewer',
        createdAt: new Date().toISOString().split('T')[0],
      }
      users.push(newUser)
      return jsonResponse(newUser, 201)
    }

    // /api/users/:id PUT
    const userPutParams = matchRoute(url, '/api/users/:id')
    if (userPutParams && method === 'PUT') {
      const idx = users.findIndex(u => u.id === parseInt(userPutParams.id))
      if (idx === -1) return jsonResponse({ message: 'User not found' }, 404)
      users[idx] = { ...users[idx], ...body }
      return jsonResponse(users[idx])
    }

    // /api/users/:id DELETE
    const userDelParams = matchRoute(url, '/api/users/:id')
    if (userDelParams && method === 'DELETE') {
      const idx = users.findIndex(u => u.id === parseInt(userDelParams.id))
      if (idx === -1) return jsonResponse({ message: 'User not found' }, 404)
      users.splice(idx, 1)
      return jsonResponse({ message: 'Deleted' })
    }

    // /api/todos
    if (matchRoute(url, '/api/todos') && method === 'GET') {
      return jsonResponse(todos)
    }

    // /api/todos POST
    if (matchRoute(url, '/api/todos') && method === 'POST') {
      const newTodo: Todo = {
        id: nextTodoId++,
        title: body.title || '',
        completed: false,
        userId: body.userId || 1,
      }
      todos.push(newTodo)
      return jsonResponse(newTodo, 201)
    }

    // /api/todos/:id PATCH/PUT
    const todoPatchParams = matchRoute(url, '/api/todos/:id')
    if (todoPatchParams && (method === 'PATCH' || method === 'PUT')) {
      const idx = todos.findIndex(t => t.id === parseInt(todoPatchParams.id))
      if (idx === -1) return jsonResponse({ message: 'Todo not found' }, 404)
      todos[idx] = { ...todos[idx], ...body }
      return jsonResponse(todos[idx])
    }

    // /api/todos/:id DELETE
    const todoDelParams = matchRoute(url, '/api/todos/:id')
    if (todoDelParams && method === 'DELETE') {
      const idx = todos.findIndex(t => t.id === parseInt(todoDelParams.id))
      if (idx === -1) return jsonResponse({ message: 'Todo not found' }, 404)
      todos.splice(idx, 1)
      return jsonResponse({ message: 'Deleted' })
    }

    // /api/posts - 分页文章列表
    if (matchRoute(url, '/api/posts') && method === 'GET') {
      const urlObj = new URL(url, 'http://localhost')
      const page = parseInt(urlObj.searchParams.get('page') || '1')
      const pageSize = parseInt(urlObj.searchParams.get('pageSize') || '10')
      const start = (page - 1) * pageSize
      const paged = posts.slice(start, start + pageSize)
      return jsonResponse({
        data: paged,
        total: posts.length,
        page,
        pageSize,
      })
    }

    // /api/tasks/start POST - 启动一个异步任务
    if (matchRoute(url, '/api/tasks/start') && method === 'POST') {
      const taskId = `task_${Date.now()}`
      taskStates[taskId] = { id: taskId, status: 'pending', progress: 0 }

      // 模拟任务进度
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 25
        if (progress >= 100) {
          progress = 100
          taskStates[taskId] = { id: taskId, status: 'completed', progress: 100 }
          clearInterval(interval)
        } else {
          taskStates[taskId] = { id: taskId, status: 'running', progress: Math.round(progress) }
        }
      }, 1000)

      return jsonResponse({ id: taskId, status: 'pending', progress: 0 })
    }

    // /api/tasks/:id GET - 获取任务状态
    const taskParams = matchRoute(url, '/api/tasks/:id')
    if (taskParams && method === 'GET') {
      const task = taskStates[taskParams.id]
      if (!task) return jsonResponse({ message: 'Task not found' }, 404)
      return jsonResponse(task, 200, 100)
    }

    // /api/error - 模拟错误
    if (matchRoute(url, '/api/error') && method === 'GET') {
      const urlObj = new URL(url, 'http://localhost')
      const status = parseInt(urlObj.searchParams.get('status') || '500')
      return jsonResponse({ message: `Simulated ${status} error`, code: status }, status)
    }

    // /api/slow - 模拟慢请求
    if (matchRoute(url, '/api/slow') && method === 'GET') {
      return jsonResponse({ message: 'Slow response', timestamp: Date.now() }, 200, 3000)
    }

    // /api/random - 随机数据
    if (matchRoute(url, '/api/random') && method === 'GET') {
      return jsonResponse({
        value: Math.random(),
        timestamp: Date.now(),
      })
    }

    // /api/server-time - 服务器时间（用于轮询演示）
    if (matchRoute(url, '/api/server-time') && method === 'GET') {
      return jsonResponse({
        time: new Date().toISOString(),
        uptime: Math.floor(performance.now() / 1000),
      }, 200, 50)
    }

    // 非 mock 路由，使用原始 fetch
    return originalFetch(input, init)
  }
}
