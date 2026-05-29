import { expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test'

export const BACKEND_URL = process.env.E2E_BACKEND_URL ?? 'http://127.0.0.1:8787'

const allowedLocalHosts = new Set(['127.0.0.1', 'localhost'])
export function collectPageDiagnostics(page: Page) {
  const pageErrors: string[] = []
  const blockedRequests: string[] = []

  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })

  page.on('console', (message) => {
    if (message.type() === 'error') {
      pageErrors.push(message.text())
    }
  })

  page.on('request', (request) => {
    const url = request.url()
    if (!isAllowedLocalUrl(url)) {
      blockedRequests.push(url)
    }
  })

  return {
    assertClean() {
      expect(pageErrors, `Unexpected browser page/console errors:\n${pageErrors.join('\n')}`).toEqual([])
      expect(blockedRequests, `Unexpected non-local browser requests:\n${blockedRequests.join('\n')}`).toEqual([])
    },
  }
}

export async function expectBackendHealth(request: APIRequestContext) {
  const response = await request.get(`${BACKEND_URL}/health`)
  expect(response.status()).toBe(200)
  const body = await response.json() as {
    ok?: boolean
    data?: {
      service?: string
      status?: string
      runtime?: {
        mode?: string
        mockOnly?: boolean
      }
    }
  }

  expect(body.ok).toBe(true)
  expect(body.data?.service).toBe('reeditpro-api')
  expect(body.data?.status).toBe('ok')
  expect(body.data?.runtime?.mode).toBe('mock')
  expect(body.data?.runtime?.mockOnly).toBe(true)
  expectNoSecretLikeValues(body)
}

export async function expectBackendReadiness(request: APIRequestContext) {
  const response = await request.get(`${BACKEND_URL}/health/readiness`)
  expect(response.status()).toBe(200)
  const body = await response.json() as {
    ok?: boolean
    data?: {
      envLoaded?: boolean
      providerRealCallsEnabled?: boolean
      runtime?: {
        mockOnly?: boolean
        allowMockWithoutSupabase?: boolean
        storageMode?: string
      }
    }
  }

  expect(body.ok).toBe(true)
  expect(body.data?.envLoaded).toBe(true)
  expect(body.data?.providerRealCallsEnabled).toBe(false)
  expect(body.data?.runtime?.mockOnly).toBe(true)
  expect(body.data?.runtime?.allowMockWithoutSupabase).toBe(true)
  expect(body.data?.runtime?.storageMode).toBe('local')
  expectNoSecretLikeValues(body)
}

export async function expectSafeApiError(response: APIResponse, status: number, code: string) {
  expect(response.status()).toBe(status)
  const body = await response.json() as {
    error?: {
      code?: string
      message?: string
      status?: number
      request_id?: string
    }
    stack?: unknown
  }

  expect(body.error?.code).toBe(code)
  expect(body.error?.status).toBe(status)
  expect(body.error?.request_id).toBeTruthy()
  expect(body.stack).toBeUndefined()
  expectNoSecretLikeValues(body)
}

export function expectNoSecretLikeValues(value: unknown) {
  const text = JSON.stringify(value)
  expect(text).not.toMatch(/sk-[a-z0-9]/i)
  expect(text).not.toMatch(/AIza[0-9A-Za-z_-]/)
  expect(text).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/)
  expect(text).not.toMatch(/service-role-key/i)
  expect(text).not.toMatch(/service_role_key/i)
  expect(text).not.toMatch(/provider_api_key/i)
  expect(text).not.toMatch(/BEGIN PRIVATE KEY/)
}

function isAllowedLocalUrl(value: string): boolean {
  const url = new URL(value)
  if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol)) return true

  return allowedLocalHosts.has(url.hostname)
}
