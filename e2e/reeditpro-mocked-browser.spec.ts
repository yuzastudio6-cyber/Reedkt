import { expect, test } from '@playwright/test'
import {
  BACKEND_URL,
  collectPageDiagnostics,
  expectBackendHealth,
  expectBackendReadiness,
  expectSafeApiError,
} from './helpers/e2e-helpers'

test.describe('ReeditPro mocked browser runtime', () => {
  test('app shell loads with safe mocked runtime status', async ({ page }) => {
    const diagnostics = collectPageDiagnostics(page)

    await page.goto('/')

    await expect(page.getByRole('heading', { name: /AI-powered editing/i })).toBeVisible()
    await expect(page.getByText('ReeditPro plans the edit before spending credits')).toBeVisible()

    const runtimeStatus = page.getByTestId('e2e-runtime-status')
    await expect(runtimeStatus).toHaveAttribute('data-api-mode', 'mock')
    await expect(runtimeStatus).toHaveAttribute('data-mock-only', 'true')
    await expect(runtimeStatus).toHaveAttribute('data-has-backend-url', 'true')
    await expect(runtimeStatus).toHaveAttribute('data-backend-origin', BACKEND_URL)

    diagnostics.assertClean()
  })

  test('main frontend routes render without crashing', async ({ page }) => {
    const diagnostics = collectPageDiagnostics(page)
    const routes = [
      { path: '/dashboard', heading: /Welcome back, Tommy/i },
      { path: '/projects', heading: /^Projects$/i },
      { path: '/editor', heading: /Chat-native editor/i },
      { path: '/pricing', heading: /Software access is weekly/i },
      { path: '/brand-kit', heading: /Brand Kit placeholder/i },
      { path: '/exports', heading: /^Exports$/i },
    ]

    for (const route of routes) {
      await page.goto(route.path)
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible()
    }

    diagnostics.assertClean()
  })

  test('backend health and readiness stay mocked and provider-disabled', async ({ request }) => {
    await expectBackendHealth(request)
    await expectBackendReadiness(request)
  })

  test('protected and provider routes stay mock-safe without real auth or execution', async ({ request }) => {
    const projectResponse = await request.get(`${BACKEND_URL}/v1/projects/project-smoke`)
    expect(projectResponse.status()).toBe(200)
    const projectBody = await projectResponse.json() as {
      ok?: boolean
      data?: {
        project?: {
          id?: string
          mockOnly?: boolean
        }
      }
    }
    expect(projectBody.ok).toBe(true)
    expect(projectBody.data?.project?.id).toBe('project-smoke')
    expect(projectBody.data?.project?.mockOnly).toBe(true)

    const providerResponse = await request.post(`${BACKEND_URL}/v1/provider-gateway/requests`, {
      data: {
        workspaceId: 'workspace-smoke',
        providerRoute: 'mock-provider-route',
        requestPayload: { prompt: 'mock only' },
        mockOnly: true,
      },
      headers: {
        'Idempotency-Key': 'provider-smoke-idempotency-key',
      },
    })
    expect(providerResponse.status()).toBe(202)
    const providerBody = await providerResponse.json() as {
      ok?: boolean
      data?: {
        providerRequestAttempt?: {
          attemptStatus?: string
          normalizedErrorCode?: string
          mockOnly?: boolean
        }
      }
      warnings?: string[]
    }
    expect(providerBody.ok).toBe(true)
    expect(providerBody.data?.providerRequestAttempt?.attemptStatus).toBe('blocked')
    expect(providerBody.data?.providerRequestAttempt?.normalizedErrorCode).toBe('REAL_PROVIDER_CALLS_DISABLED')
    expect(providerBody.data?.providerRequestAttempt?.mockOnly).toBe(true)
    expect(providerBody.warnings?.join(' ')).toContain('No OpenAI')

    const realProviderResponse = await request.post(`${BACKEND_URL}/v1/provider-gateway/requests`, {
      data: {
        workspaceId: 'workspace-smoke',
        providerRoute: 'real-provider-route',
        requestPayload: { prompt: 'must remain blocked' },
      },
      headers: {
        'Idempotency-Key': 'provider-real-blocked-idempotency-key',
      },
    })
    await expectSafeApiError(realProviderResponse, 403, 'REAL_PROVIDER_CALLS_DISABLED')
  })

  test('invalid backend routes return safe JSON errors', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/v1/not-a-real-route`)
    await expectSafeApiError(response, 404, 'ROUTE_NOT_FOUND')
  })
})
