import { createHmac } from 'node:crypto'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import {
  EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS,
  materializeEditReferenceControlledMediaFixture,
} from '../../server/edit-references/edit-reference-controlled-media-fixtures'
import { expectNoHorizontalOverflow, setViewport } from './helpers/layout'

const localSupabaseUrl = requiredLocalEnvironment(
  'REEDITPRO_CANONICAL_V3_API_URL',
  'http://127.0.0.1:57431',
)
const localSupabaseAnonKey = requiredEnvironment('REEDITPRO_CANONICAL_V3_ANON_KEY')
const localJwtSecret = requiredEnvironment('REEDITPRO_CANONICAL_V3_JWT_SECRET')
const ownerUserId = '11111111-1111-4111-8111-111111111111'
const ownerEmail = 'owner-a@example.test'
const otherOwnerUserId = '22222222-2222-4222-8222-222222222222'
const otherOwnerEmail = 'owner-b@example.test'
const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const apiPort = Number(process.env.PLAYWRIGHT_EDIT_REFERENCE_V3_API_PORT ?? 9017)
const apiBaseUrl = `http://127.0.0.1:${apiPort}`
let browserSession: Record<string, unknown>
let ownerAccessToken = ''
let otherOwnerAccessToken = ''
let fixturePath = ''

test.describe('canonical V3 local Edit Preference browser lifecycle', () => {
  test.beforeAll(async ({ browserName }, testInfo) => {
    expect(browserName).toBe('chromium')
    expect(localSupabaseUrl).toBe('http://127.0.0.1:57431')
    expect(ownerUserId).toMatch(/^[a-f0-9-]{36}$/)
    const storageRoot = String(
      testInfo.config.metadata.editReferenceCanonicalStorageRoot ?? '',
    )
    expect(path.isAbsolute(storageRoot)).toBe(true)
    const fixtureDefinition = EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS.find(
      (definition) => definition.fixtureId === 'target_a_educational_product_demo',
    )
    if (!fixtureDefinition) throw new Error('The controlled reference-video fixture is unavailable.')
    const fixture = await materializeEditReferenceControlledMediaFixture({
      outputRoot: path.join(storageRoot, 'controlled-mounted-v3-fixtures'),
      definition: fixtureDefinition,
      timeoutMs: 60_000,
    })
    fixturePath = fixture.videoPath
    const now = Math.floor(Date.now() / 1_000)
    ownerAccessToken = createLocalAuthenticatedJwt({
      email: ownerEmail,
      issuedAt: now,
      secret: localJwtSecret,
      subject: ownerUserId,
    })
    otherOwnerAccessToken = createLocalAuthenticatedJwt({
      email: otherOwnerEmail,
      issuedAt: now,
      secret: localJwtSecret,
      subject: otherOwnerUserId,
    })
    const response = await fetch(`${localSupabaseUrl}/auth/v1/user`, {
      headers: {
        accept: 'application/json',
        apikey: localSupabaseAnonKey,
        authorization: `Bearer ${ownerAccessToken}`,
      },
      signal: AbortSignal.timeout(15_000),
    })
    const user = await response.json() as Record<string, unknown>
    expect(response.ok, JSON.stringify(user)).toBe(true)
    expect(user.id).toBe(ownerUserId)
    browserSession = {
      access_token: ownerAccessToken,
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

  test('mounts signed-in private upload and durable long-form RLS authority per request', async ({ page }) => {
    test.setTimeout(180_000)
    page.setDefaultTimeout(20_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)
    await page.addInitScript((session) => {
      window.localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
    }, browserSession)
    await page.goto('/preferences')

    const preferenceName = `Mounted V3 reference ${Date.now()}`
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(preferenceName)
    await page.getByTestId('save-edit-reference').click()
    await page.getByRole('button', { name: 'Upload video' }).click()
    await page.getByTestId('edit-reference-video-file').setInputFiles(fixturePath)
    await page.getByTestId('save-edit-reference-evidence').click()

    const studyCard = page.locator('[data-testid^="edit-reference-long-form-study-"]').first()
    await expect(studyCard).toBeVisible()
    await expect(studyCard).toContainText('fixture.mp4')
    await studyCard.getByRole('button', { name: 'Start whole-video study' }).click()
    await expect(studyCard).toContainText('checkpointed section')
    await expect(studyCard.locator('progress')).toBeVisible()

    const referenceId = new URL(page.url()).searchParams.get('reference')
    expect(referenceId).toBeTruthy()
    const detailResponse = await fetch(
      `${apiBaseUrl}/v1/edit-references/${encodeURIComponent(referenceId as string)}?${new URLSearchParams({ workspaceId })}`,
      { headers: { authorization: `Bearer ${ownerAccessToken}` } },
    )
    expect(detailResponse.ok).toBe(true)
    const detailBody = await detailResponse.json() as {
      data?: { detail?: { study?: { id?: string }; assets?: Array<{ id?: string }> } }
    }
    const studyId = detailBody.data?.detail?.study?.id
    const studyCardTestId = await studyCard.getAttribute('data-testid')
    const referenceAssetId = studyCardTestId?.replace(
      'edit-reference-long-form-study-',
      '',
    )
    expect(studyId).toBeTruthy()
    expect(referenceAssetId).toBeTruthy()

    const ownerRead = await fetch(longFormStatusUrl(studyId!, referenceAssetId!), {
      headers: { authorization: `Bearer ${ownerAccessToken}` },
    })
    const ownerReadText = await ownerRead.text()
    expect(ownerRead.ok, ownerReadText).toBe(true)
    expect(ownerReadText).not.toContain(ownerAccessToken)
    expect(ownerReadText).not.toContain(otherOwnerAccessToken)
    const ownerStatus = JSON.parse(ownerReadText) as {
      data?: { study?: { runRevision?: number; state?: string } }
    }
    expect(ownerStatus.data?.study?.runRevision).toBeGreaterThan(0)

    const deniedRead = await fetch(longFormStatusUrl(studyId!, referenceAssetId!), {
      headers: { authorization: `Bearer ${otherOwnerAccessToken}` },
    })
    expect([403, 404]).toContain(deniedRead.status)
    expect(await deniedRead.text()).not.toContain(ownerAccessToken)
    const deniedControl = await fetch(
      `${apiBaseUrl}/v1/edit-reference-studies/${encodeURIComponent(studyId!)}/assets/${encodeURIComponent(referenceAssetId!)}/long-form-study/control`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${otherOwnerAccessToken}`,
          'content-type': 'application/json',
          'idempotency-key': `cross-tenant-control-${Date.now()}`,
        },
        body: JSON.stringify({
          workspaceId,
          expectedRunRevision: ownerStatus.data?.study?.runRevision,
          action: 'pause',
        }),
      },
    )
    expect([403, 404]).toContain(deniedControl.status)

    await studyCard.getByRole('button', { name: 'Pause safely' }).click()
    await expect(studyCard.getByRole('button', { name: 'Resume study' })).toBeVisible()
    const progressBeforeReload = await studyCard.locator('progress').getAttribute('value')
    await page.reload()
    await expect(page.getByRole('heading', { name: preferenceName })).toBeVisible()
    const restoredCard = page.locator('[data-testid^="edit-reference-long-form-study-"]').first()
    await expect(restoredCard.getByRole('button', { name: 'Resume study' })).toBeVisible()
    await expect(restoredCard.locator('progress')).toHaveAttribute(
      'value',
      progressBeforeReload ?? '0',
    )
    await restoredCard.getByRole('button', { name: 'Resume study' }).click()
    await expect(restoredCard).toContainText('Study resumed from the last verified checkpoint.')
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
  readonly email: string
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
    email: input.email,
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

function longFormStatusUrl(studyId: string, referenceAssetId: string): string {
  return `${apiBaseUrl}/v1/edit-reference-studies/${encodeURIComponent(studyId)}/assets/${encodeURIComponent(referenceAssetId)}/long-form-study?${new URLSearchParams({ workspaceId })}`
}

function base64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}
