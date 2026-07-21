import { createHmac } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

const localSupabaseUrl = requiredLocalEnvironment(
  'REEDITPRO_CANONICAL_V3_API_URL',
  'http://127.0.0.1:57431',
)
const localSupabaseAnonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const localJwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')
const ownerUserId = '11111111-1111-4111-8111-111111111111'
const ownerEmail = 'owner-a@example.test'
const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
let browserSession: Record<string, unknown>

test.describe('canonical V3 local Edit Preference browser lifecycle', () => {
  test.beforeAll(async ({ browserName }) => {
    expect(browserName).toBe('chromium')
    expect(localSupabaseUrl).toBe('http://127.0.0.1:57431')
    expect(ownerUserId).toMatch(/^[a-f0-9-]{36}$/)
    const now = Math.floor(Date.now() / 1_000)
    const accessToken = createLocalAuthenticatedJwt({
      issuedAt: now,
      secret: localJwtSecret,
      subject: ownerUserId,
    })
    const response = await fetch(`${localSupabaseUrl}/auth/v1/user`, {
      headers: {
        accept: 'application/json',
        apikey: localSupabaseAnonKey,
        authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(15_000),
    })
    const user = await response.json() as Record<string, unknown>
    expect(response.ok, JSON.stringify(user)).toBe(true)
    expect(user.id).toBe(ownerUserId)
    browserSession = {
      access_token: accessToken,
      expires_at: now + 1_800,
      expires_in: 1_800,
      refresh_token: 'canonical-v3-local-no-refresh',
      token_type: 'bearer',
      user,
    }
  })

  test('persists signed-in library, Study Chat, DNA, QA, approval, correction, and recovery', async ({ page }) => {
    test.setTimeout(180_000)
    page.setDefaultTimeout(20_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)

    await page.addInitScript((session) => {
      window.localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
    }, browserSession)
    await page.goto('/preferences')
    await expect(page).toHaveURL(/\/preferences(?:\?|$)/)
    const preferencesPage = page.getByTestId('edit-preferences-page')
    await expect(preferencesPage).toHaveAttribute('data-workspace-id', workspaceId)

    const stamp = Date.now()
    const preferenceName = `Canonical V3 documentary ${stamp}`
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(preferenceName)
    await page.getByTestId('save-edit-reference').click()
    await expect(page.getByRole('heading', { name: preferenceName })).toBeVisible()

    const firstDirection =
      'Preserve testimony and meaning. Use measured pacing, restrained captions, purposeful B-roll, speech-safe audio, and original evidence graphics.'
    await page.getByTestId('edit-reference-study-message').fill(firstDirection)
    await page.getByTestId('send-edit-reference-study-message').click()
    await expect(page.getByTestId('edit-reference-study-chat')).toContainText(firstDirection)

    await page.getByTestId('run-edit-reference-evidence-study').click()
    await expect(page.getByTestId('edit-reference-study-findings')).toBeVisible()
    await page.getByTestId('generate-edit-reference-dna').click()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText(
      'Ready for quality review',
    )
    await page.getByTestId('run-edit-reference-dna-qa').click()
    await expect(page.getByTestId('edit-reference-dna-qa-review')).toBeVisible()

    let approvalRequests = 0
    let loseFirstApprovalResponse = true
    await page.route('**/v1/edit-reference-studies/*/preference-dna/*/approve', async (route) => {
      if (route.request().method() !== 'POST') return route.continue()
      approvalRequests += 1
      if (!loseFirstApprovalResponse) return route.continue()
      loseFirstApprovalResponse = false
      const committed = await route.fetch()
      expect(committed.ok()).toBe(true)
      await route.abort('failed')
    })
    await approveCurrentGuidance(page)
    await expect(page.getByTestId('edit-reference-target-ready')).toBeVisible()
    expect(approvalRequests).toBe(1)

    const approvedUrl = page.url()
    expect(approvedUrl).toMatch(/\/preferences\?reference=/)
    await page.reload()
    await expect(page.getByRole('heading', { name: preferenceName })).toBeVisible()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText(
      'Approved reusable guidance',
    )

    const correction =
      'Correction: keep natural pauses around decisive facts and reduce decorative motion further.'
    await page.getByTestId('edit-reference-study-message').fill(correction)
    await page.getByTestId('send-edit-reference-study-message').click()
    await expect(page.getByTestId('edit-reference-study-chat')).toContainText(correction)
    await expect(page.getByTestId('edit-reference-target-ready')).toHaveCount(0)
    await expect(page.getByTestId('run-edit-reference-evidence-study')).toHaveText('Start study')

    await page.getByTestId('run-edit-reference-evidence-study').click()
    await page.getByTestId('generate-edit-reference-dna').click()
    await page.getByTestId('run-edit-reference-dna-qa').click()
    await approveCurrentGuidance(page)
    await expect(page.getByTestId('edit-reference-target-ready')).toBeVisible()

    await page.reload()
    await expect(preferencesPage).toHaveAttribute('data-workspace-id', workspaceId)
    await expect(page.getByRole('heading', { name: preferenceName })).toBeVisible()
    await expect(page.getByTestId('edit-reference-dna-review')).toContainText(
      'Approved reusable guidance',
    )
    await expect(page.getByTestId('edit-reference-study-chat')).toContainText(correction)
    await expectNoHorizontalOverflow(page)
  })
})

async function approveCurrentGuidance(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByTestId('edit-reference-dna-approval')).toBeVisible()
  await page.getByTestId('acknowledge-edit-reference-dna-approval').check()
  const reasoningReview = page.getByTestId(
    'acknowledge-edit-reference-dna-reasoning-review',
  )
  if (await reasoningReview.count()) await reasoningReview.check()
  await page.getByTestId('approve-edit-reference-dna').click()
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required local browser environment: ${name}`)
  return value
}

function requiredLocalEnvironment(name: string, expected: string): string {
  const value = requiredEnvironment(name)
  if (value !== expected) {
    throw new Error(`${name} must target the isolated canonical V3 loopback stack.`)
  }
  return value
}

function createLocalAuthenticatedJwt(input: {
  readonly issuedAt: number
  readonly secret: string
  readonly subject: string
}): string {
  const header = base64Url({ alg: 'HS256', typ: 'JWT' })
  const payload = base64Url({
    aal: 'aal1',
    amr: [{ method: 'password', timestamp: input.issuedAt }],
    app_metadata: { provider: 'email', providers: ['email'] },
    aud: 'authenticated',
    email: ownerEmail,
    exp: input.issuedAt + 1_800,
    iat: input.issuedAt,
    iss: `${localSupabaseUrl}/auth/v1`,
    role: 'authenticated',
    sub: input.subject,
    user_metadata: { display_name: 'Owner A' },
  })
  const unsigned = `${header}.${payload}`
  const signature = createHmac('sha256', input.secret)
    .update(unsigned)
    .digest('base64url')
  return `${unsigned}.${signature}`
}

function base64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}
