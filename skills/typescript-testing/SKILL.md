---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.spec.ts"
  - "**/*.test.ts"
---
# TypeScript 测试技巧

> 通用 TypeScript 测试模式，聚焦类型安全的测试编写。
> 测试流程见 `tdd-workflow`，E2E 见 `e2e-testing`。

## 类型级测试

### 使用 Vitest 的 expectTypeOf

```typescript
import { expectTypeOf, test } from 'vitest'
import { safeFetch } from '../utils/fetch'

test('safeFetch 返回正确类型', () => {
  expectTypeOf(safeFetch<string>).returns.resolves.toMatchTypeOf<
    { ok: true; data: string } | { ok: false; error: Error }
  >()
})
```

### 使用 tsd（独立类型测试工具）

```typescript
// types.test-d.ts
import { expectType, expectAssignable } from 'tsd'
import type { Result, UnwrapPromise } from '../types'

expectType<string>({} as UnwrapPromise<Promise<string>>)
expectAssignable<Result<number>>({ ok: true, data: 42 })
```

## 类型安全的 Mock 工厂

```typescript
// test/factories.ts
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T

function createUserMock(overrides: DeepPartial<User> = {}): User {
  return {
    id: 'test-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    ...overrides,
  } as User
}
```

## 类型安全的 Mock 函数

```typescript
import { vi } from 'vitest'
import type { MockedFunction } from 'vitest'

vi.mock('../services/userService', () => ({
  fetchUser: vi.fn<[string], Promise<User>>(),
  updateUser: vi.fn<[string, Partial<User>], Promise<User>>(),
}))

import { fetchUser } from '../services/userService'
const mockedFetchUser = fetchUser as MockedFunction<typeof fetchUser>
mockedFetchUser.mockResolvedValue(createUserMock())
```

## 测试辅助类型

```typescript
// test/types.ts
type AssertEqual<T, U> =
  (<V>() => V extends T ? 1 : 2) extends
  (<V>() => V extends U ? 1 : 2) ? true : false

type Resolved<T> = T extends Promise<infer U> ? U : T

type TestCase<Input, Expected> = {
  name: string
  input: Input
  expected: Expected
}
```

## 参数化类型测试

```typescript
const cases: TestCase<string, number>[] = [
  { name: 'empty string', input: '', expected: 0 },
  { name: 'single word', input: 'hello', expected: 5 },
]

test.each(cases)('$name', ({ input, expected }) => {
  expect(input.length).toBe(expected)
})
```

## 异步测试模式

```typescript
test('应拒绝无效输入', async () => {
  await expect(fetchUser('')).rejects.toThrow('Invalid user ID')
})

test('timeout 后应取消请求', async () => {
  vi.useFakeTimers()
  const promise = fetchWithTimeout('/api/slow', 5000)
  vi.advanceTimersByTime(5001)
  await expect(promise).rejects.toThrow('Timeout')
  vi.useRealTimers()
})
```

## 测试覆盖率配置（vitest）

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      exclude: ['**/*.d.ts', '**/types/**', '**/test/**'],
    },
  },
})
```
