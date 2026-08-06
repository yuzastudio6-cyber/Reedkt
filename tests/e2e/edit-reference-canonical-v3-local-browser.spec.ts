import { createHmac } from 'node:crypto'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import {
  EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS,
  materializeEditReferenceControlledMediaFixture,
} from '../../server/edit-references/edit-reference-controlled-media-fixtures'
import {
  buildLocalProjectHandoffStorageKey,
} from '../../src/lib/local-project-handoff'
import {
  createProjectPersistenceScopeFingerprint,
} from '../../src/lib/project-persistence-scope'
import {
  prepareCanonicalV3MountedEditReferenceApplyFixture,
} from './helpers/canonical-v3-edit-reference-apply-fixture'
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
const canonicalProjectId = 'aaaaaaaa-1000-4000-8000-000000000001'
const canonicalEditSessionId = 'aaaaaaaa-2000-4000-8000-000000000001'
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
      outputRoot: path.join(
        storageRoot,
        'controlled-mounted-v3-fixtures',
        `worker-${testInfo.workerIndex}`,
      ),
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

  test('prepares, recovers, applies, reloads, and removes exact-target guidance through canonical V3', async ({ page }, testInfo) => {
    test.setTimeout(240_000)
    page.setDefaultTimeout(25_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)
    await page.addInitScript((session) => {
      window.localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
    }, browserSession)
    await page.goto('/preferences')

    const stamp = Date.now()
    const preferenceName = `Mounted exact-target preference ${stamp}`
    await page.getByTestId('new-edit-reference').click()
    await page.getByTestId('edit-reference-name').fill(preferenceName)
    await page.getByTestId('save-edit-reference').click()
    const direction =
      'Preserve factual meaning, natural testimony, restrained captions, speech-safe audio, and evidence-led pacing.'
    await page.getByTestId('edit-reference-study-message').fill(direction)
    await page.getByTestId('send-edit-reference-study-message').click()
    await page.getByTestId('run-edit-reference-evidence-study').click()
    await page.getByTestId('generate-edit-reference-dna').click()
    await page.getByTestId('run-edit-reference-dna-qa').click()
    await approveCurrentGuidance(page)
    await expect(page.getByTestId('edit-reference-target-ready')).toBeVisible()

    const referenceId = new URL(page.url()).searchParams.get('reference')
    expect(referenceId).toBeTruthy()
    const detailResponse = await fetch(
      `${apiBaseUrl}/v1/edit-references/${encodeURIComponent(referenceId as string)}?${new URLSearchParams({ workspaceId })}`,
      { headers: { authorization: `Bearer ${ownerAccessToken}` } },
    )
    const detailBody = await detailResponse.json() as {
      data?: {
        detail?: {
          reference?: { id?: string }
          study?: { id?: string }
        }
      }
    }
    expect(detailResponse.ok, JSON.stringify(detailBody)).toBe(true)
    const studySessionId = detailBody.data?.detail?.study?.id
    expect(studySessionId).toBeTruthy()

    const storageRoot = String(
      testInfo.config.metadata.editReferenceCanonicalStorageRoot ?? '',
    )
    expect(path.isAbsolute(storageRoot)).toBe(true)
    const fixture = await prepareCanonicalV3MountedEditReferenceApplyFixture({
      endpointOrigin: localSupabaseUrl,
      anonKey: localSupabaseAnonKey,
      authenticatedAccessToken: ownerAccessToken,
      localInternalSigningSecret: localJwtSecret,
      localStorageRoot: storageRoot,
      ownerUserId,
      workspaceId,
      projectId: canonicalProjectId,
      editSessionId: canonicalEditSessionId,
      editReferenceId: referenceId as string,
      studySessionId: studySessionId as string,
      fixtureKey: `mounted-apply-${stamp}`,
    })
    expect(fixture.totalWorkItemCount).toBeGreaterThan(0)
    expect(fixture.targetPackageId).toMatch(/^[a-f0-9-]{36}$/)
    expect(fixture.targetPackageDigestSha256).toMatch(/^[a-f0-9]{64}$/)

    const projectScope = {
      authMode: 'supabase' as const,
      userId: ownerUserId,
      workspaceId,
    }
    await page.evaluate((input) => {
      window.localStorage.setItem(input.storageKey, JSON.stringify({
        recordVersion: 2,
        scope: input.scope,
        scopeFingerprint: input.scopeFingerprint,
        handoffs: [input.handoff],
        savedAt: input.handoff.updatedAt,
      }))
    }, {
      storageKey: buildLocalProjectHandoffStorageKey(projectScope),
      scope: projectScope,
      scopeFingerprint: createProjectPersistenceScopeFingerprint(projectScope),
      handoff: fixture.handoff,
    })

    const exactEditUrl = new URL(fixture.handoff.editorPath, 'http://reeditpro.local')
    exactEditUrl.searchParams.set('view', 'preferences')
    await page.goto(`${exactEditUrl.pathname}${exactEditUrl.search}`)
    await expect(page).toHaveURL(new RegExp(
      `/projects/${canonicalProjectId}/edits/${canonicalEditSessionId}.*view=preferences`,
    ))
    const referenceSelect = page.getByTestId('current-edit-reference-select')
    await expect(referenceSelect).toBeVisible()
    await referenceSelect.selectOption(referenceId as string)
    await expect(page.getByTestId('edit-reference-target-study')).toHaveAttribute(
      'data-state',
      'ready',
    )
    await expect(page.getByTestId('edit-reference-target-study')).toContainText(
      'This video is understood',
    )
    await expect(page.getByTestId('current-edit-reference-application')).toHaveAttribute(
      'data-state',
      'ready_to_apply',
    )

    const applyAttempts: Array<{
      body: string | null
      idempotencyKey: string | null
      responseBody: string
    }> = []
    await page.route(
      /\/v1\/projects\/[^/]+\/edit-sessions\/[^/]+\/edit-preferences\/apply$/,
      async (route) => {
        if (route.request().method() !== 'POST') return route.continue()
        const response = await route.fetch()
        applyAttempts.push({
          body: route.request().postData(),
          idempotencyKey: route.request().headers()['idempotency-key'] ?? null,
          responseBody: await response.text(),
        })
        if (applyAttempts.length === 1) {
          await route.abort('failed')
          return
        }
        await route.fulfill({ response })
      },
    )

    await page.getByRole('button', { name: /^Apply to this edit$/i }).click()
    await expect(page.getByTestId('current-edit-preferences-pending-apply')).toBeVisible()
    await page.getByRole('button', { name: /^Retry Apply$/i }).click()
    await expect(page.getByTestId('current-edit-preferences-pending-apply')).toHaveCount(0)
    await expect(page.getByTestId('current-edit-reference-application')).toHaveAttribute(
      'data-state',
      'applied',
    )
    expect(applyAttempts).toHaveLength(2)
    expect(applyAttempts[0]?.idempotencyKey).toBeTruthy()
    expect(applyAttempts[1]?.idempotencyKey).toBe(applyAttempts[0]?.idempotencyKey)
    expect(applyAttempts[1]?.body).toBe(applyAttempts[0]?.body)
    expect(JSON.parse(applyAttempts[1]?.responseBody ?? '{}')).toEqual(
      JSON.parse(applyAttempts[0]?.responseBody ?? '{}'),
    )

    const connected = await readExactApplyAuthority({
      accessToken: ownerAccessToken,
      projectId: canonicalProjectId,
      editSessionId: canonicalEditSessionId,
    })
    expect(connected.currentApplicationState).toBe('connected')
    expect(connected.currentApplicationId).toBeTruthy()

    await page.reload()
    await expect(page.getByTestId('current-edit-reference-select')).toHaveValue(
      referenceId as string,
    )
    await expect(page.getByTestId('current-edit-reference-application')).toHaveAttribute(
      'data-state',
      'applied',
    )
    await page.getByTestId('current-edit-reference-select').selectOption('')
    await expect(page.getByTestId('preference-material-change-warning')).toContainText(
      'remove this preference',
    )
    await page.getByRole('button', { name: /^Apply to this edit$/i }).click()
    await expect(page.getByTestId('current-edit-preferences-apply-error')).toHaveCount(0)
    await expect.poll(async () => (
      await readExactApplyAuthority({
        accessToken: ownerAccessToken,
        projectId: canonicalProjectId,
        editSessionId: canonicalEditSessionId,
      })
    ).currentApplicationState).toBe('cleared')

    await page.reload()
    await expect(page.getByTestId('current-edit-reference-select')).toHaveValue('')
    const denied = await fetch(
      `${apiBaseUrl}/v1/projects/${canonicalProjectId}/edit-sessions/${canonicalEditSessionId}/edit-preferences/apply-authority?${new URLSearchParams({ workspaceId })}`,
      { headers: { authorization: `Bearer ${otherOwnerAccessToken}` } },
    )
    expect([403, 404]).toContain(denied.status)
    await setViewport(page, 375, 812)
    await expectNoHorizontalOverflow(page)
  })

  test('creates, reloads, and reopens one signed-in Storytelling Director through private durable authority', async ({ page }) => {
    test.setTimeout(180_000)
    page.setDefaultTimeout(20_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setViewport(page, 1280, 900)
    await page.addInitScript((session) => {
      window.localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
    }, browserSession)

    await page.goto('/motion-studio')
    await expect(page.getByTestId('motion-studio-home')).toBeVisible()
    await page.getByRole('button', { name: 'Open Storytelling' }).click()
    await expect(page).toHaveURL(/\/motion-studio\/storytelling$/u)
    await expect(page.getByRole('heading', { name: 'Storytelling', level: 1 }))
      .toBeVisible()

    await page.getByRole('button', { name: 'Create storytelling' }).click()
    const storyName = `Canonical signed-in story ${Date.now()}`
    await page.getByLabel('Story name').fill(storyName)
    await page.getByRole('button', {
      name: 'Create and open Director Chat',
    }).click()

    await expect(page).toHaveURL(
      /\/motion-studio\/storytelling\/projects\/[a-f0-9-]{36}\/edits\/storytelling-edit-/u,
    )
    await expect(page.getByTestId('storytelling-director-workspace')).toBeVisible()
    await expect(page.getByTestId('editor-page')).toHaveCount(0)
    await expect(page.getByTestId('storytelling-director-start')).toBeVisible()
    await expect(page.getByTestId('editor-header')).toContainText(storyName)
    await expect(page.getByTestId('chat-composer-textarea')).toBeVisible()

    const directorUrl = page.url()
    await page.getByRole('button', { name: 'Start with an idea' }).click()
    await page.getByTestId('chat-composer-textarea')
      .fill('I want to tell a precise two-minute story about a community repair workshop.')
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByTestId('storytelling-director-start'))
      .toContainText('Your story direction is captured')

    await page.reload()
    await expect(page).toHaveURL(directorUrl)
    await expect(page.getByTestId('storytelling-director-workspace')).toBeVisible()
    await expect(page.getByTestId('storytelling-director-start'))
      .toContainText('Your story direction is captured')

    await page.goto('/motion-studio/storytelling')
    await expect(page.getByTestId('motion-studio-storytelling-library'))
      .toContainText(storyName)
    const storyRow = page.locator('[data-testid^="motion-studio-story-"]')
      .filter({ hasText: storyName })
    await expect(storyRow).toHaveCount(1)
    await storyRow.getByRole('button', {
      name: 'Continue in Director Chat',
    }).click()
    await expect(page).toHaveURL(directorUrl)
    await expect(page.getByTestId('storytelling-director-workspace')).toBeVisible()
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

async function readExactApplyAuthority(input: {
  readonly accessToken: string
  readonly projectId: string
  readonly editSessionId: string
}): Promise<{
  currentApplicationId: string | null
  currentApplicationState: string
}> {
  const response = await fetch(
    `${apiBaseUrl}/v1/projects/${encodeURIComponent(input.projectId)}/edit-sessions/${encodeURIComponent(input.editSessionId)}/edit-preferences/apply-authority?${new URLSearchParams({ workspaceId })}`,
    { headers: { authorization: `Bearer ${input.accessToken}` } },
  )
  const payload = await response.json() as {
    data?: {
      authority?: {
        currentApplicationId?: string | null
        currentApplicationState?: string
      }
    }
  }
  expect(response.ok, JSON.stringify(payload)).toBe(true)
  const authority = payload.data?.authority
  if (!authority || typeof authority.currentApplicationState !== 'string') {
    throw new Error('The canonical exact-edit Apply authority response is incomplete.')
  }
  return {
    currentApplicationId: authority.currentApplicationId ?? null,
    currentApplicationState: authority.currentApplicationState,
  }
}

function base64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}
