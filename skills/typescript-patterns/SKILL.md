---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---
# TypeScript 高级类型模式

> 通用 TypeScript 模式参考，不依赖具体框架。
> Vue 专项见 `frontend-patterns`，Node 服务端见 `node-backend-patterns`。

## 工具类型

### 常用内置工具类型

```typescript
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

// 全部可选
type UserUpdate = Partial<User>

// 全部必填
type RequiredUser = Required<User>

// 仅取部分字段
type UserSummary = Pick<User, 'id' | 'name'>

// 排除部分字段
type PublicUser = Omit<User, 'email'>

// 从函数提取返回类型
async function fetchUser(id: string): Promise<User> { /* ... */ return {} as User }
type FetchUserResult = Awaited<ReturnType<typeof fetchUser>> // User

// 从函数提取参数类型
type FetchUserParams = Parameters<typeof fetchUser> // [string]
```

### Record 与映射类型

```typescript
// 键值映射
type RolePermissions = Record<User['role'], string[]>

const permissions: RolePermissions = {
  admin: ['read', 'write', 'delete'],
  user: ['read'],
}

// 将所有属性变为只读
type ImmutableUser = Readonly<User>

// 自定义映射类型
type Nullable<T> = { [K in keyof T]: T[K] | null }
type Optional<T> = { [K in keyof T]?: T[K] }
```

## 判别联合与穷举检查

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number }

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2
    case 'rectangle':
      return shape.width * shape.height
    case 'triangle':
      return (shape.base * shape.height) / 2
    default: {
      // 穷举检查：若新增 Shape 未处理，编译报错
      const _exhaustive: never = shape
      throw new Error(`未处理的 shape: ${JSON.stringify(_exhaustive)}`)
    }
  }
}
```

## 类型守卫

```typescript
// is 谓词
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isErrorLike(value: unknown): value is { message: string; code?: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as Record<string, unknown>).message === 'string'
  )
}

// asserts 守卫（抛出而非返回布尔）
function assertDefined<T>(value: T | null | undefined, label: string): asserts value is T {
  if (value == null) throw new Error(`${label} must not be null/undefined`)
}

// 使用
function processError(err: unknown): string {
  if (isErrorLike(err)) return err.message
  if (isString(err)) return err
  return 'Unknown error'
}
```

## 泛型约束

```typescript
// 基础约束
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

// 多重约束
interface Identifiable { id: string }
interface Timestamped { createdAt: Date }

function logEntity<T extends Identifiable & Timestamped>(entity: T): void {
  console.log(`[${entity.createdAt.toISOString()}] Entity ${entity.id}`)
}

// 泛型工厂
function createRepository<T extends Identifiable>() {
  const store = new Map<string, T>()
  return {
    save: (entity: T) => store.set(entity.id, entity),
    findById: (id: string): T | undefined => store.get(id),
    findAll: (): T[] => Array.from(store.values()),
  }
}
```

## 条件类型与 infer

```typescript
// 基础条件类型
type IsArray<T> = T extends unknown[] ? true : false
type IsPromise<T> = T extends Promise<unknown> ? true : false

// infer 提取类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
type ArrayElement<T> = T extends (infer U)[] ? U : never
type FirstArgument<T> = T extends (first: infer U, ...rest: unknown[]) => unknown ? U : never

// 递归条件类型（深度解包）
type DeepUnwrapPromise<T> = T extends Promise<infer U> ? DeepUnwrapPromise<U> : T

// 使用
type A = UnwrapPromise<Promise<string>> // string
type B = ArrayElement<number[]>         // number
```

## Template Literal Types

```typescript
// 事件名称生成
type EventName<T extends string> = `on${Capitalize<T>}`
type ClickEvent = EventName<'click'> // 'onClick'

// CRUD 路由生成
type CrudRoutes<T extends string> =
  | `GET /api/${T}`
  | `POST /api/${T}`
  | `PUT /api/${T}/:id`
  | `DELETE /api/${T}/:id`

type UserRoutes = CrudRoutes<'users'>
// 'GET /api/users' | 'POST /api/users' | ...

// 深层路径访问
type DotPath<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends object
    ? DotPath<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`
}[keyof T & string]
```

## 错误处理模式

```typescript
// Result 类型（避免 throw 传播）
type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E }

async function safeFetch<T>(url: string): Promise<Result<T>> {
  try {
    const res = await fetch(url)
    if (!res.ok) return { ok: false, error: new Error(`HTTP ${res.status}`) }
    const data: T = await res.json()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

// 使用
const result = await safeFetch<User[]>('/api/users')
if (result.ok) {
  console.log(result.data)
} else {
  console.error(result.error.message)
}
```

## 模块类型声明

```typescript
// 为无类型第三方库补充声明
// types/some-lib.d.ts
declare module 'some-lib' {
  export function doSomething(input: string): Promise<void>
  export interface Config {
    timeout?: number
    retries?: number
  }
}

// 全局类型扩展
// types/globals.d.ts
declare global {
  interface Window {
    __APP_CONFIG__: { version: string; env: string }
  }
}

export {} // 确保此文件视为模块
```
