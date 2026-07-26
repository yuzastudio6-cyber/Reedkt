import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { chromium, expect, type BrowserContext, type Locator, type Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServer as createViteServer, type ViteDevServer } from 'vite'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { clearApprovedEditExecutionPrivateDownloadMemoryForSmoke } from '../services/approved-edit-execution-package-service'
import { clearInternalEditStateMemoryForSmoke } from '../services/internal-edit-state-service'
import { clearLocalProjectMemoryForSmoke } from '../services/project-service'
import {
  readPrivateAuthorityJsonBlob,
  readPrivateEditAuthorityAggregate,
} from '../services/private-edit-authority-store'
import { readPrivateEditBriefAuthorityAggregate } from '../services/private-edit-brief-authority-store'
import { activatePrivateOfflineLibassCaptionRuntime } from '../tool-execution/libass-caption-execution'
import { activatePrivateOfflineMediaBinaryRuntime } from '../tool-execution/media-binary-execution'
import {
  activatePrivateOfflineRemotionRenderRuntime,
  prepareOfflineRemotionDockerRuntime,
} from '../tool-execution/remotion-render-execution'
import type { RuntimeClients } from '../types'
import { resolvedPlanningInputAuthorityBindingSchema } from '../validation/planning-input-authority-binding-schemas'
import {
  getLocalProjectHandoffStorageKey as getScopedLocalProjectHandoffStorageKey,
  type LocalInternalProjectHandoff,
} from '../../src/lib/local-project-handoff'
import {
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
} from '../../src/types/canonical-private-composition-capacity'

const execFileAsync = promisify(execFile)
const localStorageRoot = '/tmp/reeditpro-editor-full-stack-private-review-smoke'
await rm(localStorageRoot, { force: true, recursive: true })

const verifiedToken = 'browser-full-stack-private-review-supabase-token'
const otherUserToken = 'browser-full-stack-private-review-other-user-token'
const privateCanonicalInternalServiceToken =
  'rp-browser-private-pipeline-lease-7Gk2Wm9Qx4Nb8Lv5'
const browserProjectScope = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}
const getLocalProjectHandoffStorageKey = () => getScopedLocalProjectHandoffStorageKey(browserProjectScope)
const editorBootTimeoutMs = 12_000
const privateUploadTimeoutMs = 30_000
const approvedEditBriefGoal = 'Create a clean internal review edit from the uploaded source proof, keep the speaker clear, and make the first beat more direct.'
const approvedEditBriefMarker = {
  startSeconds: 0.5,
  title: 'Protect the opening explanation',
  note: 'Keep the complete opening explanation, add a restrained caption, and do not cover or cut the speaker.',
} as const
const canonicalSourceFixtureDefinitions = [
  { fileName: 'browser-upload-source.mp4', width: 160, height: 90, audioFrequencyHz: 440, videoPattern: 'solid_red' },
  { fileName: 'browser-upload-source-b.mp4', width: 176, height: 100, audioFrequencyHz: 660, videoPattern: 'solid_dark_red' },
  { fileName: 'browser-upload-source-c.mp4', width: 192, height: 108, audioFrequencyHz: 880, videoPattern: 'solid_dark_red' },
  { fileName: 'browser-upload-source-d.mp4', width: 208, height: 118, audioFrequencyHz: 1_000, videoPattern: 'solid_dark_red' },
  { fileName: 'browser-upload-source-e.mp4', width: 224, height: 126, audioFrequencyHz: 1_200, videoPattern: 'solid_dark_red' },
  { fileName: 'browser-upload-source-f.mp4', width: 240, height: 136, audioFrequencyHz: 1_400, videoPattern: 'solid_dark_red' },
  { fileName: 'browser-upload-source-g.mp4', width: 256, height: 144, audioFrequencyHz: 1_600, videoPattern: 'solid_dark_red' },
  { fileName: 'browser-upload-source-h.mp4', width: 272, height: 154, audioFrequencyHz: 1_800, videoPattern: 'solid_dark_red' },
] as const
const canonicalSourceCount = canonicalSourceFixtureDefinitions.length
const canonicalSourceDurationSeconds = 2
const canonicalSourceDurationLabel = `00:${String(canonicalSourceDurationSeconds).padStart(2, '0')}`
const canonicalReviewDurationSeconds = canonicalSourceCount * canonicalSourceDurationSeconds
assert.equal(
  canonicalReviewDurationSeconds * 30,
  CANONICAL_PRIVATE_SOURCE_SEQUENCE_MAXIMUM_FRAMES,
  'The signed-in maximum-source fixture must exercise the exact 30fps sequence ceiling.',
)
const canonicalCaptionCount = Math.min(canonicalSourceCount, 7)
const canonicalWorkItemAndJobCount = 4 + canonicalCaptionCount + canonicalSourceCount * 2
const canonicalSourceOrders = canonicalSourceFixtureDefinitions.map((_, index) => index + 1)
const canonicalSourceDimensions = canonicalSourceFixtureDefinitions.map(({ width, height }) => `${width}x${height}`)
const hiddenDemoStoryPattern = /couple starts happy|pregnan(?:t|cy)|walks away/i
let authVerificationCount = 0
let adminPersistenceAttemptCount = 0
const workspaceMemberships = new Map<string, string>([
  ['workspace-internal-testing\u0000supabase-user-browser-full-stack', 'owner'],
  ['workspace-internal-testing\u0000supabase-user-browser-full-stack-other', 'editor'],
])
const internalToolNameCopyPattern =
  /(?:\bD3\b|\bECharts\b|\bVega(?:-Lite)?\b|\bMapLibre\b|\bTurf\b|\bRemotion\b|\bFFmpeg\b|\bFFprobe\b|\bAudioFlux\b|\bSignalsmith\b|\bVapourSynth\b|\bSharp \+ libvips\b|\bEssentia\b|\bRubber Band\b|\blibrosa\b|\bOpenColorIO\b|\bOpenImageIO\b|\bGPAC\b|\bMP4Box\b|\bMKVToolNix\b|\bGStreamer\b|\btorch\b|\btransformers\b)/i
assert.doesNotMatch(
  'Marker inspectorChoose a marker',
  internalToolNameCopyPattern,
  'Adjacent customer-facing words must not be mistaken for the internal torch tool name.',
)
assert.match(
  'Internal worker: torch',
  internalToolNameCopyPattern,
  'An actual internal tool name must remain blocked from customer-facing copy.',
)

type SmokeSourceMediaAsset = {
  storageBucket?: string
  sourceMetadata?: {
    probeStatus?: string
    durationSeconds?: number
    width?: number
    height?: number
    hasVideo?: boolean
    hasAudio?: boolean
  }
}

type ProjectReadbackResponse = {
  data?: {
    project?: {
      id?: string
      name?: string
      createdByUserId?: string
    }
  }
  error?: unknown
}

type ProjectListReadbackResponse = {
  data?: {
    projects?: Array<{ id?: string; workspaceId?: string }>
  }
  error?: unknown
}

type InternalEditStateReadbackResponse = {
  data?: {
    internalEditState?: {
      workspaceId?: string
      handoff?: LocalInternalProjectHandoff
    }
  }
  error?: unknown
}

type InternalEditStateListReadbackResponse = {
  data?: {
    internalEditStates?: Array<{ handoff?: LocalInternalProjectHandoff }>
  }
  error?: unknown
}

type CanonicalJourneyReadbackResponse = {
  data?: {
    canonicalEditJourney?: {
      stage?: string
      plan?: {
        planVersion?: number
        status?: string
        estimateStatus?: string
        approvedMaximumCredits?: number
        workItemCount?: number
      }
      approval?: {
        reservationStatus?: string
        jobCount?: number
      }
      workGraph?: {
        totalJobCount?: number
        completedJobCount?: number
        requiredBlockedJobCount?: number
        allRequiredJobsCompleted?: boolean
      }
      permissions?: Record<string, unknown>
    }
  }
  error?: unknown
}

function assertUploadedSourceMetadataPreserved(
  sourceMediaAssets: SmokeSourceMediaAsset[] | undefined,
  label: string,
  expectedDimensions = canonicalSourceDimensions,
): void {
  assert.deepEqual(
    sourceMediaAssets?.map((asset) => asset.sourceMetadata?.probeStatus),
    expectedDimensions.map(() => 'probed'),
    `${label} should preserve probed upload-time source metadata.`,
  )
  assert.deepEqual(
    sourceMediaAssets?.map((asset) => `${asset.sourceMetadata?.width}x${asset.sourceMetadata?.height}`),
    expectedDimensions,
    `${label} should preserve uploaded private source dimensions.`,
  )
  assert.equal(
    sourceMediaAssets?.every((asset) =>
      (asset.sourceMetadata?.durationSeconds ?? 0) > 0 &&
      asset.sourceMetadata?.hasVideo === true &&
      typeof asset.sourceMetadata?.hasAudio === 'boolean'
    ),
    true,
    `${label} should preserve bounded duration and stream facts.`,
  )
}

function assertPrivateSourceStorageBucketsPreserved(
  sourceMediaAssets: unknown[] | undefined,
  label: string,
  expectedBucket = 'source-media',
): void {
  const assets = sourceMediaAssets as Array<{ storageBucket?: unknown }> | undefined

  assert.equal(
    assets?.length ? assets.every((asset) => asset.storageBucket === expectedBucket) : false,
    true,
    `${label} should preserve the exact private source storage bucket.`,
  )
}

const fakeClients: RuntimeClients = {
  public: {
    auth: {
      async getUser(token: string) {
        authVerificationCount += 1
        if (token === otherUserToken) {
          return {
            data: {
              user: {
                id: 'supabase-user-browser-full-stack-other',
                email: 'browser-full-stack-other@reeditpro.local',
                app_metadata: {},
                user_metadata: { display_name: 'Browser Full Stack Other Tester' },
                aud: 'authenticated',
                created_at: new Date(0).toISOString(),
              },
            },
            error: null,
          }
        }
        if (token !== verifiedToken) {
          return {
            data: { user: null },
            error: { message: 'Invalid browser full-stack auth token.' },
          }
        }

        return {
          data: {
            user: {
              id: 'supabase-user-browser-full-stack',
              email: 'browser-full-stack@reeditpro.local',
              app_metadata: {},
              user_metadata: { display_name: 'Browser Full Stack Tester' },
              aud: 'authenticated',
              created_at: new Date(0).toISOString(),
            },
          },
          error: null,
        }
      },
    },
  } as unknown as SupabaseClient,
  admin: {
    from(tableName: string) {
      if (tableName === 'workspace_members') {
        const filters = new Map<string, string>()
        const query = {
          select() {
            return query
          },
          eq(column: string, value: string) {
            filters.set(column, value)
            return query
          },
          async maybeSingle() {
            const workspaceId = filters.get('workspace_id') ?? ''
            const userId = filters.get('user_id') ?? ''
            const role = workspaceMemberships.get(`${workspaceId}\u0000${userId}`)
            return {
              data: role ? { workspace_id: workspaceId, user_id: userId, role } : null,
              error: null,
            }
          },
        }
        return query
      }
      adminPersistenceAttemptCount += 1
      throw new Error(`Unexpected Supabase admin persistence attempt against ${tableName}.`)
    },
  } as unknown as SupabaseClient,
}

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_PORT: '8787',
  STORAGE_MODE: 'local',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  SUPABASE_URL: 'https://browser-full-stack-auth.reeditpro.local',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: privateCanonicalInternalServiceToken,
  API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE: 'true',
})
assert.equal(env.mockOnly, false, 'Browser full-stack smoke should run with Supabase configured.')
assert.equal(env.allowInternalTestExecutionWithSupabase, true)

const canonicalSourceFixtures = await Promise.all(canonicalSourceFixtureDefinitions.map(async (definition, index) => {
  const fixture = await createSyntheticMp4Fixture({
    localStorageRoot,
    outputPath: join(localStorageRoot, 'fixtures', definition.fileName),
    durationSeconds: canonicalSourceDurationSeconds,
    width: definition.width,
    height: definition.height,
    includeAudio: true,
    audioFrequencyHz: definition.audioFrequencyHz,
    videoPattern: definition.videoPattern,
  })
  assert.equal(
    fixture.available,
    true,
    `Synthetic source fixture ${index + 1} should be available: ${fixture.warnings.join('; ')}`,
  )
  assert.ok(fixture.outputPath, `Synthetic source fixture ${index + 1} should expose a path.`)
  assert.equal(
    fixture.hasAudio,
    true,
    `Synthetic source fixture ${index + 1} should include the audio stream required by the approved voice-delivery plan.`,
  )
  assert.equal(fixture.width, definition.width)
  assert.equal(fixture.height, definition.height)
  return {
    ...fixture,
    available: true as const,
    outputPath: fixture.outputPath,
    width: definition.width,
    height: definition.height,
    hasAudio: true as const,
  }
}))
const sourceFixture = canonicalSourceFixtures[0]!
const secondSourceFixture = canonicalSourceFixtures[1]!

// This smoke is a standalone signed-in execution proof. Refresh every exact
// runtime authority it consumes instead of relying on an earlier smoke's
// process-external /tmp side effect or a mutable Docker tag remaining stable.
await activatePrivateOfflineMediaBinaryRuntime()
await activatePrivateOfflineLibassCaptionRuntime()
await prepareOfflineRemotionDockerRuntime()
await activatePrivateOfflineRemotionRenderRuntime()

const apiServer = await listen(createServer(createReeditProApiApp(env, { clients: fakeClients })))
const apiBaseUrl = `http://127.0.0.1:${addressPort(apiServer)}`

process.env.NODE_ENV = 'test'
process.env.E2E_RUNTIME_MODE = 'local'
process.env.WORKER_RUNTIME_MODE = 'mock'
process.env.STORAGE_MODE = 'local'
process.env.VITE_REEDITPRO_E2E = 'true'
process.env.VITE_REEDITPRO_AUTH_MODE = 'local_test'
process.env.VITE_REEDITPRO_E2E_AUTH_TOKEN = verifiedToken
process.env.VITE_REEDITPRO_E2E_AUTH_USER_ID = 'supabase-user-browser-full-stack'
process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = apiBaseUrl
process.env.VITE_SUPABASE_URL = 'https://browser-full-stack-auth.reeditpro.local'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

let viteServer: ViteDevServer | undefined
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
let browserContext: BrowserContext | undefined
let canonicalPrivateReviewAccepted = false

try {
  viteServer = await createViteServer({
    clearScreen: false,
    logLevel: 'error',
    server: {
      host: '127.0.0.1',
      port: 0,
      strictPort: false,
    },
  })
  await viteServer.listen()
  const viteUrl = viteServer.resolvedUrls?.local[0]
  assert.ok(viteUrl, 'Vite dev server should expose a local URL.')

  browser = await chromium.launch()
  browserContext = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 900 },
  })
  const page = await browserContext.newPage()
  const consoleMessages: string[] = []
  const editExecutionResponses: string[] = []
  const creditGateResponses: string[] = []
  const approvedSnapshotResponses: string[] = []
  const canonicalPlanningResponses: string[] = []
  const projectRouteResponses: string[] = []
  const failedBrowserRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      consoleMessages.push(`${message.type()}: ${message.text()}`)
    }
  })
  page.on('response', async (response) => {
    if (/\/v1\/projects(?:\/|\?|$)/.test(response.url())) {
      const body = await response.text().catch(() => '')
      projectRouteResponses.push(`${response.status()} ${response.request().method()} ${response.url()}${body ? ` body=${body.slice(0, 2500)}` : ''}`)
    }
    if (response.url().includes('/v1/edit-executions/')) {
      const body = response.ok() ? '' : await response.text().catch(() => '')
      editExecutionResponses.push(`${response.status()} ${response.request().method()} ${response.url()}${body ? ` body=${body}` : ''}`)
    }
    if (response.url().includes('/v1/credit-estimates/')) {
      const body = response.ok() ? '' : await response.text().catch(() => '')
      creditGateResponses.push(`${response.status()} ${response.request().method()} ${response.url()}${body ? ` body=${body}` : ''}`)
    }
    if (response.url().includes('/v1/approved-snapshots/') || response.url().includes('/approved-snapshots')) {
      const body = await response.text().catch(() => '')
      approvedSnapshotResponses.push(`${response.status()} ${response.request().method()} ${response.url()}${body ? ` body=${body.slice(0, 2500)}` : ''}`)
    }
    if (
      response.url().startsWith(apiBaseUrl)
      && /canonical-(?:journey|planning|approval)|publication-requests|edit-preferences\/planning-authority/.test(response.url())
    ) {
      const body = await response.text().catch(() => '')
      canonicalPlanningResponses.push(`${response.status()} ${response.request().method()} ${response.url()}${body ? ` body=${body.slice(0, 4000)}` : ''}`)
    }
  })
  page.on('requestfailed', (request) => {
    failedBrowserRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? 'unknown failure'}`)
  })
  await page.goto(`${viteUrl}projects/new`)
  await expect(page).toHaveURL(/\/sign-in\?returnTo=/)
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Pick up exactly where you left off.',
  })).toBeVisible()
  await page.getByTestId('local-test-sign-in').click()
  await expect(page).toHaveURL(/\/projects\/new$/)
  await expect(page.getByTestId('app-session-identity')).toContainText('Local test user')
  const browserTestSession = await page.evaluate(() => ({
    localSession: window.sessionStorage.getItem('reeditpro.auth.localTestSession.v1'),
    sessionStorageText: JSON.stringify(window.sessionStorage),
  }))
  assert.ok(browserTestSession.localSession, 'Full-stack browser path should enter through the loopback-only local test sign-in surface.')
  assert.doesNotMatch(browserTestSession.sessionStorageText, /bearer|access[_-]?token|jwt/i, 'Frontend local test sign-in must not place the backend E2E bearer in browser session storage.')
  await expect(page.getByRole('heading', { level: 1, name: 'New project' })).toBeVisible()
  await page.getByLabel('Project name').fill('Internal upload review smoke')
  await page.getByRole('button', { name: /^Create project$/i }).first().click()
  await expect(page).toHaveURL(/\/projects\/[^/]+$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Internal upload review smoke' })).toBeVisible()
  await page.getByRole('button', { name: /^New video edit$/i }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel(/Edit name/i).fill('Launch edit v1')
  await page.getByRole('button', { name: /^Create edit$/i }).first().click()
  await expect(page).toHaveURL(/\/projects\/[^/]+\/edits\/[^?]+\?/)
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: editorBootTimeoutMs })
  await expect(page.getByTestId('editor-header')).toContainText('Launch edit v1')
  const handoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      projectId?: string
      editSessionId?: string
      projectName?: string
      editorPath?: string
      persistence?: string
      stage?: string
      setup?: {
        customInstructions?: string
        userInstructionHistory?: string[]
        editLevel?: string
        editLevelConfirmed?: boolean
        workflowType?: string
        cleanupPreference?: string
        cleanupPreferenceConfirmed?: boolean
        visualPreference?: string
        visualPreferenceConfirmed?: boolean
        preferenceDefaultsApplied?: boolean
        preferenceSnapshotId?: string
      }
      sourceFileCount?: number
      sourceMediaAssets?: unknown[]
      privateReview?: { manifestVerified?: boolean; byteSize?: number }
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(handoffs[0]?.projectName, 'Internal upload review smoke')
  assert.equal(handoffs[0]?.persistence, 'browser_local_internal_testing')
  assert.equal(handoffs[0]?.stage, 'created')
  assert.equal(handoffs[0]?.setup?.editLevel, 'pro', 'Project-created edit should preserve the local edit preference default for planning.')
  assert.equal(handoffs[0]?.setup?.editLevelConfirmed, true, 'Local edit preference defaults should be confirmed in the editor handoff.')
  assert.equal(handoffs[0]?.setup?.workflowType, 'custom_let_ai_decide')
  assert.equal(handoffs[0]?.setup?.cleanupPreference, 'balanced_cleanup')
  assert.equal(handoffs[0]?.setup?.cleanupPreferenceConfirmed, true)
  assert.equal(handoffs[0]?.setup?.visualPreference, 'balanced_visual_mix')
  assert.equal(handoffs[0]?.setup?.visualPreferenceConfirmed, true)
  assert.equal(handoffs[0]?.setup?.preferenceDefaultsApplied, true)
  assert.equal(handoffs[0]?.setup?.preferenceSnapshotId, 'local-edit-preferences-default')
  assert.equal(handoffs[0]?.setup?.customInstructions ?? '', '', 'A real project edit must not inherit the hidden demo scenario prompt.')
  assert.deepEqual(handoffs[0]?.setup?.userInstructionHistory ?? [], [], 'A real project edit must start with empty chat instruction history until the user supplies direction.')
  assert.equal(handoffs[0]?.sourceFileCount, 0)
  assert.equal(handoffs[0]?.sourceMediaAssets, undefined, 'New internal project handoff should not start with executable demo source assets.')
  assert.match(
    handoffs[0]?.projectId ?? '',
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    `Browser project creation must use the backend project record. responses=${JSON.stringify(projectRouteResponses)} failures=${JSON.stringify(failedBrowserRequests)}`,
  )
  assert.match(handoffs[0]?.editSessionId ?? '', new RegExp(`^${handoffs[0]?.projectId}-launch-edit-v1-\\d+$`))
  assert.equal(
    (handoffs[0]?.editorPath ?? '').split('?')[0],
    `/projects/${handoffs[0]?.projectId}/edits/${handoffs[0]?.editSessionId}`,
    'The browser editor route must bind the exact backend project and named-edit identities.',
  )
  clearLocalProjectMemoryForSmoke()
  const projectReadback = await fetchProjectReadback(apiBaseUrl, handoffs[0]?.projectId ?? '', verifiedToken)
  assert.equal(projectReadback.status, 200, `Backend project readback should survive cleared project memory: ${JSON.stringify(projectReadback.json)}`)
  assert.equal(projectReadback.json.data?.project?.id, handoffs[0]?.projectId)
  assert.equal(projectReadback.json.data?.project?.name, 'Internal upload review smoke')
  assert.equal(projectReadback.json.data?.project?.createdByUserId, 'supabase-user-browser-full-stack')
  const otherUserProjectReadback = await fetchProjectReadback(apiBaseUrl, handoffs[0]?.projectId ?? '', otherUserToken)
  assert.equal(otherUserProjectReadback.status, 404, 'Backend project readback should reject cross-user access without leaking the project.')
  const otherUserProjectList = await fetchProjectListReadback(apiBaseUrl, otherUserToken)
  assert.equal(otherUserProjectList.status, 200)
  assert.deepEqual(otherUserProjectList.json.data?.projects ?? [], [], 'Backend project list must not expose another member\'s local internal-test project registry.')
  const initialInternalEditState = await fetchInternalEditStateReadback(apiBaseUrl, handoffs[0]?.projectId ?? '', verifiedToken)
  assert.equal(initialInternalEditState.status, 200, `Backend internal edit state should be saved before editor handoff: ${JSON.stringify(initialInternalEditState.json)}`)
  assert.equal(initialInternalEditState.json.data?.internalEditState?.handoff?.stage, 'created')
  assert.equal(initialInternalEditState.json.data?.internalEditState?.handoff?.projectName, 'Internal upload review smoke')
  const otherUserInternalEditState = await fetchInternalEditStateReadback(apiBaseUrl, handoffs[0]?.projectId ?? '', otherUserToken)
  assert.equal(otherUserInternalEditState.status, 404, 'Backend internal edit state readback should reject cross-user access without leaking the project.')
  const otherUserInternalEditStateList = await fetchInternalEditStateListReadback(apiBaseUrl, otherUserToken)
  assert.equal(otherUserInternalEditStateList.status, 200)
  assert.deepEqual(otherUserInternalEditStateList.json.data?.internalEditStates ?? [], [], 'Backend internal edit state list must not expose another member\'s private edit trace.')
  const otherUserInternalEditStateSave = await saveInternalEditStateReadback({
    apiBaseUrl,
    projectId: handoffs[0]?.projectId ?? '',
    bearerToken: otherUserToken,
    workspaceId: initialInternalEditState.json.data?.internalEditState?.workspaceId,
    editSessionId: handoffs[0]?.editSessionId ?? '',
    handoff: initialInternalEditState.json.data?.internalEditState?.handoff,
    idempotencyKey: `internal-edit-state-cross-user-overwrite:${Date.now()}`,
  })
  assert.equal(otherUserInternalEditStateSave.status, 404, 'Backend internal edit state save should reject cross-user overwrite attempts.')
  const missingProjectInternalEditStateSave = await saveInternalEditStateReadback({
    apiBaseUrl,
    projectId: 'project_missing_internal_edit_state_smoke',
    bearerToken: verifiedToken,
    workspaceId: initialInternalEditState.json.data?.internalEditState?.workspaceId,
    editSessionId: 'project_missing_internal_edit_state_smoke-edit-001',
    handoff: {
      workspaceId: 'workspace-internal-testing',
      projectId: 'project_missing_internal_edit_state_smoke',
      editSessionId: 'project_missing_internal_edit_state_smoke-edit-001',
      persistence: 'browser_local_internal_testing',
      stage: 'created',
      projectName: 'Missing project internal edit state smoke',
    },
    idempotencyKey: `internal-edit-state-missing-project:${Date.now()}`,
  })
  assert.equal(missingProjectInternalEditStateSave.status, 404, 'Backend internal edit state save should require an owned project record.')

  await page.goto(`${viteUrl}projects`)
  const localProjectCard = page.locator('.projects-card').filter({ hasText: 'Internal upload review smoke' })
  await expect(localProjectCard).toBeVisible()
  await expect(localProjectCard).toContainText(/Ready for upload|No edits/i)
  await localProjectCard.getByRole('link', { name: /Open project/i }).click()
  await expect(page).toHaveURL(/\/projects\/[^/]+$/)
  const projectEditCard = page.locator('.project-edit-card').filter({ hasText: 'Launch edit v1' })
  await expect(projectEditCard).toBeVisible()
  await projectEditCard.getByRole('link', { name: /Upload source/i }).click()
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: editorBootTimeoutMs })
  await expect(page.getByTestId('editor-header')).toContainText('Launch edit v1')
  await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
  await expect(page.getByTestId('source-sequence-card')).toHaveCount(0)
  await expect(page.getByTestId('chat-composer-textarea')).toBeDisabled()
  await expect(page.getByTestId('editor-utility-strip')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Demo scenario$/i })).toHaveCount(0)
  const realProjectHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      sourceFileCount?: number
      sourceMediaAssets?: unknown[]
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(realProjectHandoffs[0]?.sourceFileCount, 0)
  assert.equal(realProjectHandoffs[0]?.sourceMediaAssets, undefined, 'Project handoff should not create executable source assets from demo state.')

  const canonicalSourceBytes = await Promise.all(
    canonicalSourceFixtures.map((fixture) => readFile(fixture.outputPath)),
  )
  const canonicalSourceSha256s = canonicalSourceBytes.map(sha256Hex)
  const canonicalSourceMeanVolumesDb = await Promise.all(
    canonicalSourceFixtures.map((fixture) => probeAudioMeanVolume(fixture.outputPath)),
  )
  canonicalSourceMeanVolumesDb.forEach((meanVolumeDb, index) => {
    assert.ok(
      meanVolumeDb > -70,
      `Browser-upload source fixture ${index + 1} should be audibly non-silent, got ${meanVolumeDb} dB.`,
    )
  })
  const canonicalSourceAudioTones = await Promise.all(
    canonicalSourceFixtures.map((fixture, index) => probeAudioTone(fixture.outputPath, {
      targetFrequencyHz: canonicalSourceFixtureDefinitions[index]!.audioFrequencyHz,
    })),
  )
  canonicalSourceAudioTones.forEach((sample, index) => {
    assertSourceAudioTone(sample, `Browser-upload source fixture ${index + 1}`)
  })
  const sourceBytes = canonicalSourceBytes[0]!
  const secondSourceBytes = canonicalSourceBytes[1]!
  const sourceSha256 = canonicalSourceSha256s[0]!
  const secondSourceSha256 = canonicalSourceSha256s[1]!
  const secondSourceMeanVolumeDb = canonicalSourceMeanVolumesDb[1]!
  const secondSourceAudioTone = canonicalSourceAudioTones[1]!
  await page.getByTestId('edit-upload-gate-input').setInputFiles({
    name: 'browser-upload-source.mp4',
    mimeType: 'video/mp4',
    buffer: sourceBytes,
  })
  const sourceSetup = page.getByTestId('source-summary')
  await expect(sourceSetup).toBeVisible({ timeout: privateUploadTimeoutMs })
  await expect(page.getByTestId('chat-composer-textarea')).toBeEnabled()
  await sourceSetup.locator('input[type="file"]').setInputFiles(
    canonicalSourceFixtureDefinitions.slice(1).map((definition, index) => ({
      name: definition.fileName,
      mimeType: 'video/mp4',
      buffer: canonicalSourceBytes[index + 1]!,
    })),
  )

  for (const definition of canonicalSourceFixtureDefinitions) {
    await expect(sourceSetup).toContainText(definition.fileName, { timeout: privateUploadTimeoutMs })
  }
  await expect(page.getByTestId('source-summary')).toHaveCount(1)
  await expect(sourceSetup).toContainText(canonicalSourceDurationLabel)
  const uploadedHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      stage?: string
      sourceFileCount?: number
      sourceMediaAssets?: Array<{
        privateArtifact?: boolean
        publicUrl?: string | null
        signedUrl?: string | null
        storageProvider?: string
        checksumSha256?: string
        uploadedOrder?: number
        sourceMetadata?: {
          probeStatus?: string
          durationSeconds?: number
          width?: number
          height?: number
          hasVideo?: boolean
          hasAudio?: boolean
        }
      }>
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(uploadedHandoffs[0]?.stage, 'source_uploaded')
  assert.equal(uploadedHandoffs[0]?.sourceFileCount, canonicalSourceCount)
  assert.deepEqual(
    uploadedHandoffs[0]?.sourceMediaAssets?.map((asset) => asset.uploadedOrder),
    canonicalSourceOrders,
  )
  assert.deepEqual(new Set(uploadedHandoffs[0]?.sourceMediaAssets?.map((asset) => asset.storageProvider)), new Set(['local_private']))
  assertPrivateSourceStorageBucketsPreserved(uploadedHandoffs[0]?.sourceMediaAssets, 'Uploaded local handoff')
  assert.equal(uploadedHandoffs[0]?.sourceMediaAssets?.every((asset) => asset.privateArtifact === true), true)
  assert.equal(uploadedHandoffs[0]?.sourceMediaAssets?.every((asset) => asset.publicUrl === null && asset.signedUrl === null), true)
  assert.equal(uploadedHandoffs[0]?.sourceMediaAssets?.every((asset) => /^[a-f0-9]{64}$/i.test(asset.checksumSha256 ?? '')), true)
  assertUploadedSourceMetadataPreserved(uploadedHandoffs[0]?.sourceMediaAssets, 'Uploaded local handoff')

  await clickWhenReady(page.getByRole('button', { name: /Confirm order|Use this source/i }).first())
  await clickWhenReady(page.getByRole('radio', { name: /16:9/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm frame/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm cleanup/i }).first())
  await maybeClickWhenReady(page.getByRole('button', { name: /Use (Normal|Premium|Ultra Premium)/i }).first())
  await maybeClickWhenReady(page.getByRole('button', { name: /Confirm direction/i }).first())
  await maybeClickWhenReady(page.getByRole('button', { name: /Skip reference/i }).first())

  const intentButton = page.getByRole('button', { name: /Looks right/i }).first()
  if (await intentButton.count()) {
    await clickWhenReady(intentButton)
  }

  await expect(page.getByTestId('plan-review-approve')).toHaveCount(0)
  await expect(page.getByTestId('private-internal-test-run-card')).toHaveCount(0)
  await expect(page.getByText(/Placeholder or stale source records cannot become edit context/i)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Prepare source/i }).first()).toBeVisible({ timeout: 12_000 })
  await expect(page.getByRole('button', { name: /Prepare source/i }).first()).toBeEnabled()

  await clickWhenReady(page.getByRole('button', { name: /Prepare source/i }).first())
  await expect(page.getByText(
    new RegExp(`Source prep is ready for ${canonicalSourceCount} uploaded source files in this edit`, 'i'),
  )).toBeVisible({ timeout: 12_000 })
  await expect(page.getByText(/Ready to create the plan/i)).toBeVisible({ timeout: 12_000 })
  await openEditBriefWorkspace(page)
  const approvedEditBriefMarkerId = await createCanonicalEditBriefMarkerBeforeBrief(page, {
    projectId: handoffs[0]?.projectId ?? '',
    editSessionId: handoffs[0]?.editSessionId ?? '',
  })
  await page
    .getByTestId('editor-edit-brief-canvas')
    .getByTestId('edit-brief-goal-input')
    .fill('Create a clean internal review edit that opens with the uploaded source proof and keeps the speaker clear.')
  await clickEditBriefReadyButton(page)
  await confirmCanonicalEditBriefMarker(page, {
    projectId: handoffs[0]?.projectId ?? '',
    editSessionId: handoffs[0]?.editSessionId ?? '',
    markerId: approvedEditBriefMarkerId,
  })
  await openChatWorkspace(page)
  await waitForCanonicalBriefPlanAction(page)
  const settledBriefWriteCount = countCanonicalBriefWrites(projectRouteResponses)
  await page.waitForTimeout(900)
  assert.equal(
    countCanonicalBriefWrites(projectRouteResponses),
    settledBriefWriteCount,
    'A canonically saved Edit Brief must not continue PATCHing equivalent reordered fields.',
  )
  await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
  await expect(page.getByTestId('plan-review-card')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByText(/Plan updated from your source assembly/i)).toBeVisible()
  const constrainedRunnerStatus = page.getByTestId('canonical-planning-save-handoff-saved-waiting-for-compiler')
  const exactRunnerStatus = page.getByTestId('canonical-planning-save-plan-published-waiting-for-approval')
  await expect(constrainedRunnerStatus.or(exactRunnerStatus)).toBeVisible({ timeout: 12_000 })
  assert.equal(
    canonicalPlanningResponses.some((entry) =>
      entry.includes('/edit-preferences/planning-authority')
      && entry.includes('"frameConfirmation":{"status":"not_confirmed"')
    ),
    true,
    'The first canonical planning read should preserve the unconfirmed server frame state until the handoff verifies and promotes the explicit user choice.',
  )
  assert.equal(
    canonicalPlanningResponses.some((entry) =>
      entry.includes('/canonical-planning-handoff')
      && /^20[01] POST /.test(entry)
    ),
    true,
    'The browser-confirmed frame must reach the server handoff instead of being rejected by a circular pre-publication frame check.',
  )
  const constrainedByExactRunner = await constrainedRunnerStatus.isVisible()
  if (constrainedByExactRunner) {
    const exactRunnerBlockerText = (await constrainedRunnerStatus.innerText())
      .replace(/\s+/g, ' ')
      .trim()
    await expect(page.getByTestId('plan-review-approve')).toBeDisabled()
    await expect(page.getByTestId('plan-review-approve')).toHaveText('Approval not ready')
    await expect(constrainedRunnerStatus).toContainText('Planning inputs saved')
    await expect(page.getByTestId('canonical-journey-status')).toHaveAttribute(
      'data-journey-stage',
      'publication_request_required',
    )
    assert.equal(editExecutionResponses.length, 0, 'A multi-source rich plan must not start legacy execution when exact work items are unavailable.')
    assert.equal(creditGateResponses.length, 0, 'A multi-source rich plan must not call the legacy standalone credit route.')
    assert.equal(approvedSnapshotResponses.length, 0, 'A multi-source rich plan must not create an approved snapshot.')
    console.log(JSON.stringify({
      ok: true,
      status: 'blocked_by_exact_multi_source_and_rich_work_item_compilation',
      checks: [
        'browser_project_and_named_edit_created',
        'maximum_eight_private_source_uploads_and_metadata_readback_verified',
        'incremental_source_sequence_identities_are_unique',
        'finalized_media_asset_authority_is_preserved',
        'exact_edit_preferences_initialized_and_synchronized',
        'verified_planning_evidence_promoted_server_side',
        'canonical_planning_handoff_persisted',
        'approval_credit_snapshot_and_execution_remain_blocked',
      ],
      skippedLegacyAssertions: true,
      skippedReason: 'The exact private runner did not compile this maximum eight-source plan into complete canonical work items, so approval correctly stayed locked.',
      nextRequiredGate: 'canonical_multi_source_and_rich_work_item_compilation',
      exactRunnerBlockerText,
      canonicalPlanningResponseCount: canonicalPlanningResponses.length,
    }))
  } else {
  await expect(page.getByTestId('plan-review-approve')).toBeEnabled({ timeout: 12_000 })
  await expect(page.locator('body')).not.toContainText(internalToolNameCopyPattern)
  await openEditBriefWorkspace(page)
  const approvedBriefGoalInput = page
    .getByTestId('editor-edit-brief-canvas')
    .getByTestId('edit-brief-goal-input')
  await expect(approvedBriefGoalInput).toBeVisible()
  await approvedBriefGoalInput.fill(approvedEditBriefGoal)
  await expect(page.getByTestId('edit-brief-plan-impact')).toContainText(
    /Changes here require a fresh plan and credit approval/i,
    { timeout: 12_000 },
  )
  await expect(page.getByTestId('plan-review-approve')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Create edit plan/i })).toHaveCount(0)
  await clickEditBriefReadyButton(page)
  await openChatWorkspace(page)
  await waitForCanonicalBriefPlanAction(page)
  await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
  await expect(page.getByTestId('plan-review-card')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByText(/Plan updated from your source assembly/i)).toBeVisible()
  const deliveryCeiling = page.getByTestId('plan-review-4k-delivery-ceiling')
  await expect(deliveryCeiling).toContainText(/4K UHD render and export ceiling/i)
  await expect(deliveryCeiling).toContainText(/1080p, 2K, or 4K/i)
  await expect(deliveryCeiling).toContainText(/no second export estimate or charge/i)
  const revisedCanonicalSaveStatus = page.getByLabel('Canonical plan save status')
  await expect(revisedCanonicalSaveStatus).toBeVisible({ timeout: 12_000 })
  await expect(revisedCanonicalSaveStatus).not.toContainText('Saving this exact plan', {
    timeout: 12_000,
  })
  const revisedCanonicalSaveStatusText = (await revisedCanonicalSaveStatus.innerText())
    .replace(/\s+/g, ' ')
    .trim()
  assert.match(
    revisedCanonicalSaveStatusText,
    /Exact plan saved/,
    `The revised Edit Brief and confirmed marker must publish a fresh canonical plan before approval. status=${revisedCanonicalSaveStatusText} responses=${JSON.stringify(canonicalPlanningResponses.slice(-8))}`,
  )
  await expect(page.getByTestId('plan-review-approve')).toBeEnabled({ timeout: 12_000 })
  assert.equal(
    canonicalPlanningResponses.some((entry) =>
      entry.includes('/edit-preferences/planning-authority')
      && entry.includes('"sourcePreparation":{"status":"ready"')
      && entry.includes('"frameConfirmation":{"status":"confirmed"')
      && entry.includes('"aspectRatio":"16:9"')
    ),
    true,
    'A later plan must read back the same server-owned source-preparation and confirmed-frame authority before approval.',
  )
  await clickWhenReady(page.getByTestId('plan-review-approve'))
  const canonicalApprovalGateMessage = page.getByText(
    /Standalone credit approval and reservation are disabled\. Canonical plan approval performs both in one authority transaction\./i,
  ).first()
  const canonicalApprovedJourney = page.locator(
    '[data-testid="canonical-journey-status"][data-journey-stage="approved_snapshot_available"]',
  )
  const approvalOutcome = page.getByTestId('private-internal-test-run-card')
    .or(canonicalApprovalGateMessage)
    .or(canonicalApprovedJourney)
  await expect(approvalOutcome).toBeVisible({ timeout: 45_000 })
  const approvedThroughCanonicalAuthority = await canonicalApprovedJourney.isVisible()
  const approvalBlockedByCanonicalGate = await canonicalApprovalGateMessage.isVisible()

  if (approvedThroughCanonicalAuthority) {
    const canonicalJourneyStatus = page.getByTestId('canonical-journey-status')
    await expect(canonicalJourneyStatus).toContainText('Approval is safely recorded')
    await expect(page.getByTestId('private-internal-test-run-card')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText(internalToolNameCopyPattern)

    await clickWhenReady(page.getByTestId('canonical-execution-package-request-submit'))
    await expect(canonicalJourneyStatus).toHaveAttribute(
      'data-journey-stage',
      'execution_in_progress',
      { timeout: 45_000 },
    )
    await expect(canonicalJourneyStatus).toContainText('Private preparation handoff is ready')
    await expect(page.getByTestId('canonical-execution-package-request-submit')).toHaveCount(0)

    await clickWhenReady(page.getByTestId('canonical-private-edit-preparation-submit'))
    const canonicalPrivateReviewReady = page.locator(
      '[data-testid="canonical-journey-status"][data-journey-stage="private_review_ready"]',
    )
    const canonicalPreparationBlocked = page.getByTestId('canonical-private-edit-preparation-blocked')
    await expect(canonicalPrivateReviewReady.or(canonicalPreparationBlocked)).toBeVisible({ timeout: 900_000 })
    if (await canonicalPreparationBlocked.isVisible()) {
      throw new Error(
        `Canonical private preparation failed closed: ${(await canonicalPreparationBlocked.innerText()).replace(/\s+/g, ' ').trim()}`,
      )
    }
    await expect(canonicalJourneyStatus).toHaveAttribute(
      'data-journey-stage',
      'private_review_ready',
    )
    await expect(canonicalJourneyStatus).toContainText('Private review ready')
    await expect(page.getByTestId('canonical-private-review')).toBeVisible()
    await expect(page.locator('body')).not.toContainText(internalToolNameCopyPattern)

    await clickWhenReady(page.getByTestId('canonical-private-review-load'))
    const canonicalReviewPlayer = page.getByTestId('canonical-private-review-player')
    await expect(canonicalReviewPlayer).toBeVisible({ timeout: 30_000 })
    const canonicalVideoSrc = await canonicalReviewPlayer.locator('video').evaluate(
      (node) => (node as HTMLVideoElement).currentSrc || (node as HTMLVideoElement).src,
    )
    assert.match(canonicalVideoSrc, /^blob:/, 'Canonical private review playback must use a browser object URL.')

    const [canonicalReviewDownload] = await Promise.all([
      page.waitForEvent('download'),
      clickWhenReady(page.getByRole('button', { name: /Download review/i })),
    ])
    assert.match(canonicalReviewDownload.suggestedFilename(), /\.mp4$/i)
    const canonicalReviewDownloadPath = await canonicalReviewDownload.path()
    assert.ok(canonicalReviewDownloadPath, 'Canonical private review download should resolve to a local file path.')
    const canonicalReviewBytes = await readFile(canonicalReviewDownloadPath)
    assert.ok(canonicalReviewBytes.byteLength > 0, 'Canonical private review download should contain MP4 bytes.')
    const canonicalReviewSha256 = sha256Hex(canonicalReviewBytes)
    canonicalSourceSha256s.forEach((sourceChecksum, index) => {
      assert.notEqual(
        canonicalReviewSha256,
        sourceChecksum,
        `Canonical private review must not be source ${index + 1} passthrough.`,
      )
    })
    const canonicalReviewMediaProbe = await probeMedia(canonicalReviewDownloadPath)
    assert.equal(canonicalReviewMediaProbe.video?.width, 3840)
    assert.equal(canonicalReviewMediaProbe.video?.height, 2160)
    assert.ok(
      Math.abs(
        (canonicalReviewMediaProbe.video?.durationSeconds ?? 0) - canonicalReviewDurationSeconds,
      ) <= 0.25,
      `Canonical ${canonicalSourceCount}-source review should preserve the approved ${canonicalReviewDurationSeconds}-second source sequence, got ${canonicalReviewMediaProbe.video?.durationSeconds ?? 0}s.`,
    )
    assert.equal(canonicalReviewMediaProbe.hasAudio, true)
    assertRenderedDownloadIsNotSourcePassthrough(
      canonicalReviewSha256,
      canonicalReviewMediaProbe,
      canonicalSourceFixtures.map((fixture, index) => ({
        label: `browser-uploaded source ${index + 1}`,
        sha256: canonicalSourceSha256s[index]!,
        width: fixture.width,
        height: fixture.height,
      })),
      `Canonical ${canonicalSourceCount}-source private review browser download`,
    )
    const canonicalReviewAudioToneSamples = await Promise.all(
      canonicalSourceFixtureDefinitions.map((definition, index) => probeAudioTone(
        canonicalReviewDownloadPath,
        {
          startSeconds: index * canonicalSourceDurationSeconds + 0.2,
          durationSeconds: 0.5,
          targetFrequencyHz: definition.audioFrequencyHz,
        },
      )),
    )
    canonicalReviewAudioToneSamples.forEach((sample, index) => {
      assertSourceAudioTone(sample, `Canonical private review source-bound audio segment ${index + 1}`)
    })

    await clickWhenReady(page.getByTestId('canonical-private-review-accept'))
    await expect(canonicalJourneyStatus).toHaveAttribute(
      'data-journey-stage',
      'private_review_accepted',
      { timeout: 45_000 },
    )
    await expect(canonicalJourneyStatus).toContainText('Private review approved')
    await expect(canonicalJourneyStatus).toContainText('Public delivery is still a separate release step')
    await expect(page.getByText(/Save needs retry/i)).toHaveCount(0)
    const canonicalAcceptedHandoffs = await page.evaluate((storageKey) => {
      return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
        sourceFileCount?: number
        sourceMediaAssets?: Array<{
          uploadedOrder?: number
          fileName?: string
          storageBucket?: string
          checksumSha256?: string
          sourceMetadata?: SmokeSourceMediaAsset['sourceMetadata']
        }>
      }>
    }, getLocalProjectHandoffStorageKey())
    assert.equal(canonicalAcceptedHandoffs[0]?.sourceFileCount, canonicalSourceCount)
    assert.deepEqual(
      canonicalAcceptedHandoffs[0]?.sourceMediaAssets?.map((asset) => asset.uploadedOrder),
      canonicalSourceOrders,
    )
    assert.deepEqual(
      canonicalAcceptedHandoffs[0]?.sourceMediaAssets?.map((asset) => asset.fileName),
      canonicalSourceFixtureDefinitions.map((definition) => definition.fileName),
    )
    assertPrivateSourceStorageBucketsPreserved(
      canonicalAcceptedHandoffs[0]?.sourceMediaAssets,
      'Canonical accepted browser handoff',
    )
    assertUploadedSourceMetadataPreserved(
      canonicalAcceptedHandoffs[0]?.sourceMediaAssets,
      'Canonical accepted browser handoff',
    )
    assert.equal(
      canonicalAcceptedHandoffs[0]?.sourceMediaAssets?.every((asset) =>
        /^[a-f0-9]{64}$/i.test(asset.checksumSha256 ?? '')),
      true,
    )
    const canonicalJourneyReadback = await fetchCanonicalJourneyReadback({
      apiBaseUrl,
      bearerToken: verifiedToken,
      projectId: handoffs[0]?.projectId ?? '',
      editSessionId: handoffs[0]?.editSessionId ?? '',
    })
    assert.equal(
      canonicalJourneyReadback.status,
      200,
      `Accepted canonical journey should be recoverable: ${JSON.stringify(canonicalJourneyReadback.json)}`,
    )
    const acceptedJourney = canonicalJourneyReadback.json.data?.canonicalEditJourney
    assert.equal(acceptedJourney?.stage, 'private_review_accepted')
    assert.equal(acceptedJourney?.plan?.planVersion, 2)
    assert.equal(acceptedJourney?.plan?.status, 'approved')
    assert.equal(acceptedJourney?.plan?.estimateStatus, 'approved')
    assert.ok((acceptedJourney?.plan?.approvedMaximumCredits ?? 0) > 0)
    assert.equal(acceptedJourney?.plan?.workItemCount, canonicalWorkItemAndJobCount)
    assert.equal(acceptedJourney?.approval?.jobCount, canonicalWorkItemAndJobCount)
    assert.equal(acceptedJourney?.workGraph?.totalJobCount, canonicalWorkItemAndJobCount)
    assert.equal(acceptedJourney?.workGraph?.completedJobCount, canonicalWorkItemAndJobCount)
    assert.equal(acceptedJourney?.workGraph?.requiredBlockedJobCount, 0)
    assert.equal(acceptedJourney?.workGraph?.allRequiredJobsCompleted, true)
    assert.deepEqual(acceptedJourney?.permissions, {
      inspectionOnly: true,
      rawPlanInputsReturned: false,
      filesystemPathReturned: false,
      credentialReturned: false,
      snapshotMutation: false,
      creditMutation: false,
      toolExecution: false,
      providerCall: false,
      render: false,
    })
    assertCanonicalJourneyDoesNotExposePrivateExecutionAuthority(acceptedJourney)
    assert.doesNotMatch(
      projectRouteResponses.join('\n'),
      /IDEMPOTENCY_REPLAY_UNAVAILABLE/,
      'Canonical approval must not make browser recovery persistence replay an obsolete exact-edit initialization.',
    )
    assert.equal(adminPersistenceAttemptCount, 0)
    canonicalPrivateReviewAccepted = true

    console.log(JSON.stringify({
      ok: true,
      status: 'canonical_private_review_accepted',
      checks: [
        'signed_in_project_and_named_edit_created',
        'maximum_eight_private_sources_uploaded_and_backend_probed',
        'edit_preferences_and_edit_brief_compiled',
        'confirmed_frame_preserved_across_brief_platform_context',
        'brief_revision_invalidated_and_republished_plan_v2',
        'canonical_plan_and_4k_ceiling_estimate_approved_once',
        'immutable_private_execution_handoff_requested_separately',
        'server_derived_private_work_graph_completed',
        'maximum_source_work_items_and_snapshot_validation_completed_without_browser_execution_authority',
        'eight_source_bound_voice_tones_preserved_in_approved_order',
        'private_4k_master_preserved_sixteen_second_approved_sequence',
        'private_review_loaded_through_authenticated_no_store_bytes',
        'private_review_download_is_not_source_passthrough',
        'private_review_decision_persisted',
        'public_delivery_billing_providers_and_deployment_remain_blocked',
      ],
      canonicalReviewByteLength: canonicalReviewBytes.byteLength,
      canonicalReviewSha256,
      canonicalReviewFrame: `${canonicalReviewMediaProbe.video?.width}x${canonicalReviewMediaProbe.video?.height}`,
      canonicalReviewDurationSeconds: canonicalReviewMediaProbe.video?.durationSeconds,
      canonicalReviewAudioToneSamples: canonicalReviewAudioToneSamples.map(formatAudioToneSample),
      canonicalWorkItemCount: acceptedJourney?.plan?.workItemCount,
      canonicalJobCount: acceptedJourney?.approval?.jobCount,
      canonicalVideoSrcScheme: canonicalVideoSrc.split(':')[0],
      authVerificationCount,
      uploadedByteCount: canonicalSourceBytes.reduce((total, bytes) => total + bytes.byteLength, 0),
    }))
  } else if (approvalBlockedByCanonicalGate) {
    assert.match(
      creditGateResponses.join('\n'),
      /"requiredGate":"atomic_plan_approval_and_funded_credit_reservation"/,
      'The browser approval path must identify the exact future atomic approval and funded-reservation gate.',
    )
    assert.equal(editExecutionResponses.length, 0, 'No edit execution request may start after the canonical approval gate blocks approval.')
    assert.equal(approvedSnapshotResponses.length, 0, 'The blocked legacy approval path must not create an approved snapshot.')
    await expect(page.getByTestId('private-internal-test-run-card')).toHaveCount(0)
    console.log(JSON.stringify({
      ok: true,
      status: 'blocked_by_atomic_plan_approval_and_funded_credit_reservation',
      checks: [
        'browser_project_and_named_edit_created',
        'private_source_upload_and_metadata_readback_verified',
        'clean_editor_setup_and_source_prep_verified',
        'edit_brief_and_plan_review_verified',
        'legacy_standalone_credit_approval_fails_closed',
        'no_approved_snapshot_or_edit_execution_side_effect',
      ],
      skippedLegacyAssertions: true,
      skippedReason: 'This backend-only slice changes no frontend or browser-safe shared contract. The remaining historical browser execution assertions require the future atomic canonical plan-approval and funded-credit-reservation route.',
      nextRequiredGate: 'atomic_plan_approval_and_funded_credit_reservation',
    }))
  } else {
  try {
    await expect(page.getByTestId('private-internal-test-run-card')).toBeVisible({ timeout: 45_000 })
  } catch (error) {
    const blockerText = await page.locator('text=/Internal review output is blocked:/i').allTextContents()
    const approvalErrorText = [
      ...await page.locator('article[data-message-type="assistant_error"]').allTextContents(),
      ...await page.locator('[data-testid="approval-error-message"]').allTextContents(),
      ...await page.getByText(/No credits were approved or used/i).allTextContents(),
    ]
    const visibleBodyText = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 4000)
    throw new Error([
      error instanceof Error ? error.message : 'Private internal test run card did not appear.',
      `blockerText=${JSON.stringify(blockerText)}`,
      `approvalErrorText=${JSON.stringify(approvalErrorText)}`,
      `visibleBodyText=${JSON.stringify(visibleBodyText)}`,
      `editExecutionResponses=${JSON.stringify(editExecutionResponses)}`,
      `creditGateResponses=${JSON.stringify(creditGateResponses)}`,
      `approvedSnapshotResponses=${JSON.stringify(approvedSnapshotResponses)}`,
      `consoleMessages=${JSON.stringify(consoleMessages.slice(-10))}`,
    ].join('\n'), { cause: error })
  }
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Review edit ready/i)
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Plan decisions were checked/i)
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Readiness details/i)
  await expect(page.getByTestId('private-internal-test-run-card')).not.toContainText(internalToolNameCopyPattern)
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Final QA passed with/i)
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Private review file/i)

  const interruptedPlanApprovedHandoff = await page.evaluate((storageKey) => {
    const envelope = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[]; savedAt?: string }
    const handoffs = (envelope.handoffs ?? []) as Array<{
      editorPath?: string
      stage?: string
      approvedSnapshotId?: string
      approvedCreditReservationId?: string
      privateReview?: { creditReservationId?: string }
      updatedAt?: string
    }>
    const current = handoffs[0]
    if (!current) {
      throw new Error('Expected a local handoff before simulating interrupted plan-approved recovery.')
    }
    const approvedCreditReservationId = current.approvedCreditReservationId ?? current.privateReview?.creditReservationId
    handoffs[0] = {
      ...current,
      stage: 'plan_approved',
      approvedCreditReservationId,
      privateReview: undefined,
      updatedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(storageKey, JSON.stringify({
      ...envelope,
      handoffs,
      savedAt: new Date().toISOString(),
    }))
    return handoffs[0]
  }, getLocalProjectHandoffStorageKey())
  assert.equal(
    (interruptedPlanApprovedHandoff.editorPath ?? '').split('?')[0],
    `/projects/${handoffs[0]?.projectId}/edits/${handoffs[0]?.editSessionId}`,
    'Interrupted plan recovery must retain the exact backend project and named-edit route.',
  )
  assert.match(interruptedPlanApprovedHandoff.approvedSnapshotId ?? '', /^approved[-_]snapshot[-_]/, 'Interrupted plan-approved handoff should preserve the approved snapshot id.')
  assert.match(interruptedPlanApprovedHandoff.approvedCreditReservationId ?? '', /^credit_reservation_/, 'Interrupted plan-approved handoff should preserve the credit reservation id.')

  await page.goto(new URL(interruptedPlanApprovedHandoff.editorPath ?? '/editor', viteUrl).toString())
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: editorBootTimeoutMs })
  try {
    await expect(page.getByText(/Approved plan saved/i)).toBeVisible({ timeout: 12_000 })
  } catch (error) {
    const handoffReadback = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), getLocalProjectHandoffStorageKey())
    throw new Error([
      error instanceof Error ? error.message : 'Approved plan snapshot was not restored after reload.',
      `approvedSnapshotResponses=${JSON.stringify(approvedSnapshotResponses)}`,
      `handoffReadback=${handoffReadback}`,
      `consoleMessages=${JSON.stringify(consoleMessages.slice(-10))}`,
    ].join('\n'), { cause: error })
  }
  await clickWhenReady(page.getByRole('button', { name: /Resume private review/i }))
  try {
    await expect(page.getByTestId('private-internal-test-run-card')).toBeVisible({ timeout: 45_000 })
  } catch (error) {
    const blockerText = await page.locator('text=/Review output is blocked:/i').allTextContents()
    const handoffReadback = await page.evaluate((storageKey) => window.localStorage.getItem(storageKey), getLocalProjectHandoffStorageKey())
    throw new Error([
      error instanceof Error ? error.message : 'Private internal test run card did not appear after resume.',
      `blockerText=${JSON.stringify(blockerText)}`,
      `editExecutionResponses=${JSON.stringify(editExecutionResponses)}`,
      `creditGateResponses=${JSON.stringify(creditGateResponses)}`,
      `handoffReadback=${handoffReadback}`,
      `consoleMessages=${JSON.stringify(consoleMessages.slice(-10))}`,
    ].join('\n'), { cause: error })
  }
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Review edit ready/i)
  const resumedHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      stage?: string
      approvedCreditReservationId?: string
      privateReview?: { creditReservationId?: string }
      sourceMediaAssets?: Array<{
        sourceMetadata?: {
          probeStatus?: string
          durationSeconds?: number
          width?: number
          height?: number
          hasVideo?: boolean
        }
      }>
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(resumedHandoffs[0]?.stage, 'private_review_ready')
  assert.equal(resumedHandoffs[0]?.approvedCreditReservationId, interruptedPlanApprovedHandoff.approvedCreditReservationId)
  assert.equal(resumedHandoffs[0]?.privateReview?.creditReservationId, interruptedPlanApprovedHandoff.approvedCreditReservationId)
  assertPrivateSourceStorageBucketsPreserved(resumedHandoffs[0]?.sourceMediaAssets, 'Restored local handoff')
  assertUploadedSourceMetadataPreserved(resumedHandoffs[0]?.sourceMediaAssets, 'Restored local handoff')

  await clickWhenReady(page.getByRole('button', { name: /Load review video/i }))
  const reviewVideo = page.getByTestId('private-internal-review-video')
  await expect(reviewVideo).toBeVisible({ timeout: 12_000 })
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Playback check complete:/i)
  await expect(page.getByRole('button', { name: /Download MP4/i })).toBeEnabled()
  await expect(page.getByRole('button', { name: /Download review record/i })).toBeEnabled()
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Review QA record verified/i)
  const [initialDownload] = await Promise.all([
    page.waitForEvent('download'),
    clickWhenReady(page.getByRole('button', { name: /Download MP4/i })),
  ])
  assert.match(initialDownload.suggestedFilename(), /\.mp4$/i, 'Private review download should suggest an MP4 filename.')
  const initialDownloadPath = await initialDownload.path()
  assert.ok(initialDownloadPath, 'Private review browser download should resolve to a local file path.')
  const initialDownloadBytes = await readFile(initialDownloadPath)
  assert.ok(initialDownloadBytes.byteLength > 0, 'Private review browser download should save non-empty MP4 bytes.')
  const initialDownloadSha256 = sha256Hex(initialDownloadBytes)
  const initialDownloadMediaProbe = await probeMedia(initialDownloadPath)
  const [initialManifestDownload] = await Promise.all([
    page.waitForEvent('download'),
    clickWhenReady(page.getByRole('button', { name: /Download review record/i })),
  ])
  assert.match(initialManifestDownload.suggestedFilename(), /\.json$/i, 'Private review edit trace download should suggest a JSON filename.')
  const initialManifestDownloadPath = await initialManifestDownload.path()
  assert.ok(initialManifestDownloadPath, 'Private review edit trace browser download should resolve to a local file path.')
  const initialManifestDownloadText = await readFile(initialManifestDownloadPath, 'utf8')
  const initialManifestDownloadJson = JSON.parse(initialManifestDownloadText) as {
    manifestVersion?: string
    approvedEditContext?: {
      goalSummary?: string
      professionalSkillTrace?: {
        selectedSkillCount?: number
      } | null
    }
  }
  assert.equal(initialManifestDownloadJson.manifestVersion, 'private-internal-edit-decision-manifest-v1', 'Private review edit trace download should preserve the private edit-decision manifest.')
  assert.equal(
    initialManifestDownloadJson.approvedEditContext?.goalSummary,
    approvedEditBriefGoal,
    'Private review edit trace should preserve the user-approved Edit Brief goal as its decision source of truth.',
  )
  assert.doesNotMatch(
    initialManifestDownloadText,
    hiddenDemoStoryPattern,
    'Private review edit trace must not contain hidden demo-story instructions for a real project edit.',
  )
  assert.doesNotMatch(
    approvedSnapshotResponses.join('\n'),
    hiddenDemoStoryPattern,
    'Approved snapshot responses must not contain hidden demo-story instructions for a real project edit.',
  )
  assert.match(
    approvedSnapshotResponses.join('\n'),
    /"approvedBy":"supabase-user-browser-full-stack"/,
    'Named-edit approved snapshots must preserve the trusted authenticated backend user identity.',
  )
  assert.doesNotMatch(
    approvedSnapshotResponses.join('\n'),
    /"approvedBy":"mock-user"/,
    'Named-edit approved snapshots must not retain the compatibility editor demo identity.',
  )
  assert.ok(
    (initialManifestDownloadJson.approvedEditContext?.professionalSkillTrace?.selectedSkillCount ?? 0) > 0 &&
      (initialManifestDownloadJson.approvedEditContext?.professionalSkillTrace?.selectedSkillCount ?? 0) < 20,
    'Private review should preserve a bounded edit-specific professional skill selection instead of claiming the full registry.',
  )
  assertRenderedDownloadIsNotSourcePassthrough(
    initialDownloadSha256,
    initialDownloadMediaProbe,
    [
      { label: 'first browser-uploaded source', sha256: sourceSha256, width: sourceFixture.width, height: sourceFixture.height },
      { label: 'second browser-uploaded source', sha256: secondSourceSha256, width: secondSourceFixture.width, height: secondSourceFixture.height },
    ],
    'Private review browser download',
  )
  const initialVisualSamples = await assertRenderedVisualSourceOrder(
    initialDownloadPath,
    initialDownloadMediaProbe,
    ['red', 'blue'],
    'Private review browser download',
  )
  assert.equal(initialDownloadMediaProbe.hasAudio, true, 'Private review browser download should include the uploaded-source audio stream.')
  const initialPrivateReviewMeanVolumeDb = await probeAudioMeanVolume(initialDownloadPath)
  assert.ok(
    initialPrivateReviewMeanVolumeDb > -70,
    `Browser-triggered private review download should preserve audible uploaded-source audio, got ${initialPrivateReviewMeanVolumeDb} dB.`,
  )
  const initialPrivateReviewAudioTone = await probeAudioTone(initialDownloadPath)
  assertSourceAudioTone(initialPrivateReviewAudioTone, 'Browser-triggered private review download')

  const videoSrc = await reviewVideo.evaluate((node) => (node as HTMLVideoElement).currentSrc || (node as HTMLVideoElement).src)
  assert.match(videoSrc, /^blob:/, 'Private review video should use a browser object URL, not a public or signed URL.')
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Sharing and billing remain off until you explicitly approve a release path/i)
  const verifiedHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      stage?: string
      sourceFileCount?: number
      sourceSetFingerprint?: string
      sourceMediaAssets?: Array<{ mediaAssetId?: string; uploadedOrder?: number; fileName?: string; checksumSha256?: string }>
      privateReview?: {
        manifestVerified?: boolean
        sourceSetFingerprint?: string
        byteSize?: number
        creditReservationId?: string
        privateInternalDownloadPath?: string
        privateInternalManifestPath?: string
        finalRenderSha256?: string
        reviewDecision?: string
        editDecisionManifestVerification?: {
          approvedPlanSnapshotId?: string
          finalRenderArtifactId?: string
          approvedEditContextReady?: boolean
          approvedEditContext?: {
            projectId?: string
            editSessionId?: string
            goalSummary?: string
            creditEstimateTotalCredits?: number
            segmentCount?: number
            operationCount?: number
            professionalSkillTrace?: {
              source?: string
              status?: string
              selectedSkillCount?: number
              selectedFamilies?: string[]
              activityGroups?: Array<{
                id?: string
                label?: string
                selectedActivityCount?: number
                readyActivityCount?: number
                reviewActivityCount?: number
                blockedActivityCount?: number
                status?: string
                userFacingSummary?: string
              }>
              selectionEvidence?: Array<{
                skillId?: string
                userFacingActivity?: string
                sources?: string[]
                summaries?: string[]
              }>
              qaGateCount?: number
              userFacingActivities?: string[]
              warnings?: string[]
              blockers?: string[]
              modelRoleTrace?: {
                ok?: boolean
                roles?: Array<{
                  modelRoleId?: string
                  canonicalProviderModel?: string
                  requestedUses?: string[]
                  userReasoningAllowed?: boolean
                  editPlanningAllowed?: boolean
                  visualUnderstandingAllowed?: boolean
                  toolCodeAllowed?: boolean
                }>
              }
              editBriefOptional?: boolean
              promptFirstPlanning?: boolean
              noUserVisibleToolNames?: boolean
            } | null
            planningContextTrace?: {
              source?: string
              editBriefReady?: boolean
              editBriefDirectionCount?: number
              cueUsageCount?: number
              readyCueUsageCount?: number
              sourceAssetCount?: number
            } | null
          }
          sourceMediaAssetCount?: number
          clipDecisionCount?: number
          sourceOrderPreserved?: boolean
          sourceMediaCoverageComplete?: boolean
          sourceStorageIdentityCoverageComplete?: boolean
          processedPrivateArtifactTraceComplete?: boolean
          processedArtifactCount?: number
          firstAppearanceSourceMediaAssetIds?: string[]
          firstAppearanceUploadedOrders?: number[]
          privateCaptionPackageAttached?: boolean
        }
        expectedReviewVideoMetadata?: {
          durationSeconds?: number
          width?: number
          height?: number
        }
        reviewVideoMetadata?: {
          playable?: boolean
          durationSeconds?: number
          width?: number
          height?: number
        }
      }
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(verifiedHandoffs[0]?.stage, 'private_review_verified')
  assert.equal(verifiedHandoffs[0]?.sourceFileCount, 2)
  assert.ok(verifiedHandoffs[0]?.sourceSetFingerprint, 'Verified local handoff should record the current source-set fingerprint.')
  assert.equal(verifiedHandoffs[0]?.privateReview?.sourceSetFingerprint, verifiedHandoffs[0]?.sourceSetFingerprint, 'Verified private review should be bound to the current source set.')
  assert.equal(verifiedHandoffs[0]?.sourceMediaAssets?.length, 2)
  assert.deepEqual(verifiedHandoffs[0]?.sourceMediaAssets?.map((asset) => asset.uploadedOrder), [1, 2])
  assert.deepEqual(verifiedHandoffs[0]?.sourceMediaAssets?.map((asset) => asset.fileName), ['browser-upload-source.mp4', 'browser-upload-source-b.mp4'])
  assertPrivateSourceStorageBucketsPreserved(verifiedHandoffs[0]?.sourceMediaAssets, 'Verified local handoff')
  assert.equal(verifiedHandoffs[0]?.sourceMediaAssets?.every((asset) => /^[a-f0-9]{64}$/i.test(asset.checksumSha256 ?? '')), true)
  assert.equal(verifiedHandoffs[0]?.privateReview?.manifestVerified, true)
  assert.match(verifiedHandoffs[0]?.privateReview?.creditReservationId ?? '', /^credit_reservation_/, 'Verified private review should preserve backend credit reservation id.')
  assert.ok((verifiedHandoffs[0]?.privateReview?.byteSize ?? 0) > 0, 'Verified local handoff should record private review byte size.')
  assert.match(verifiedHandoffs[0]?.privateReview?.privateInternalManifestPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/manifest$/, 'Verified local handoff should record the private edit-decision manifest route.')
  assert.match(verifiedHandoffs[0]?.privateReview?.finalRenderSha256 ?? '', /^[a-f0-9]{64}$/i, 'Verified local handoff should record the private final-render sha256.')
  assert.equal(initialDownloadSha256, verifiedHandoffs[0]?.privateReview?.finalRenderSha256, 'Private review browser download bytes should match the recorded final-render sha256.')
  assert.match(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedPlanSnapshotId ?? '', /^approved[-_]snapshot[-_]/, 'Verified local handoff should record the manifest approved snapshot id.')
  assert.match(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.finalRenderArtifactId ?? '', /^final-render-/, 'Verified local handoff should record the manifest final artifact id.')
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContextReady, true)
  assert.equal(
    verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.projectId,
    handoffs[0]?.projectId,
    'Verified review context must retain the exact backend project identity.',
  )
  assert.equal(
    verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.editSessionId,
    handoffs[0]?.editSessionId,
    'Verified review context must retain the exact named-edit identity.',
  )
  assert.equal(
    verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.goalSummary,
    approvedEditBriefGoal,
    'Verified private review should preserve the exact user-approved Edit Brief goal.',
  )
  assert.ok((verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.creditEstimateTotalCredits ?? 0) > 0)
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.source, 'professional_skill_plan')
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.noUserVisibleToolNames, true)
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.editBriefOptional, true)
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.promptFirstPlanning, true)
  assert.equal(
    verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.modelRoleTrace?.ok,
    true,
    'Verified private review should preserve a valid model-role trace from the approved professional skill plan.',
  )
  const verifiedModelRoleTrace = verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.modelRoleTrace
  assert.ok(
    (verifiedModelRoleTrace?.roles ?? []).some((role) =>
      role.modelRoleId === 'qwen_3_7_main_edit_agent' &&
      role.canonicalProviderModel === 'qwen-3.7-max' &&
      (role.requestedUses ?? []).includes('edit_planning') &&
      role.userReasoningAllowed &&
      role.editPlanningAllowed &&
      !role.toolCodeAllowed
    ),
    'Verified private review should preserve Qwen 3.7 as the main edit planning role.',
  )
  assert.ok(
    (verifiedModelRoleTrace?.roles ?? []).some((role) =>
      role.modelRoleId === 'qwen2_5_vl_visual_understanding' &&
      role.canonicalProviderModel === 'qwen2.5-vl-7b-instruct' &&
      (role.requestedUses ?? []).includes('visual_understanding') &&
      role.visualUnderstandingAllowed &&
      !role.userReasoningAllowed &&
      !role.editPlanningAllowed
    ),
    'Verified private review should preserve Qwen2.5-VL as visual-understanding only.',
  )
  assert.ok(
    Array.isArray(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.warnings),
    'Verified private review should preserve professional skill warnings as sanitized copy.',
  )
  assert.ok(
    Array.isArray(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.blockers),
    'Verified private review should preserve professional skill blockers as sanitized copy.',
  )
  assert.ok(
    (verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.selectedSkillCount ?? 0) > 0,
    'Verified private review should preserve the approved professional skill count.',
  )
  assert.ok(
    (verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.selectedFamilies?.length ?? 0) > 0,
    'Verified private review should preserve approved professional skill families.',
  )
  assert.ok(
    (verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.activityGroups?.length ?? 0) > 0,
    'Verified private review should preserve grouped professional skill activity areas.',
  )
  assert.ok(
    verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace?.activityGroups?.some((group) =>
      typeof group.label === 'string' && group.label.trim().length > 0
    ),
    'Verified private review skill activity groups should keep user-facing labels.',
  )
  const verifiedProfessionalSkillTrace = verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.professionalSkillTrace
  const verifiedProfessionalSkillUserFacingTrace = {
    activityGroups: verifiedProfessionalSkillTrace?.activityGroups,
    blockers: verifiedProfessionalSkillTrace?.blockers,
    selectionEvidence: verifiedProfessionalSkillTrace?.selectionEvidence,
    userFacingActivities: verifiedProfessionalSkillTrace?.userFacingActivities,
    warnings: verifiedProfessionalSkillTrace?.warnings,
  }
  assert.equal(
    internalToolNameCopyPattern.test(JSON.stringify(verifiedProfessionalSkillUserFacingTrace)),
    false,
    'Verified private review user-facing skill trace must not expose internal tool/package names.',
  )
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.planningContextTrace?.source, 'planning_context')
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.planningContextTrace?.editBriefReady, true)
  assert.ok(
    (verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.planningContextTrace?.editBriefDirectionCount ?? 0) > 0,
    'Verified private review should prove the approved plan carried Edit Brief direction.',
  )
  assert.ok(
    (verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.planningContextTrace?.cueUsageCount ?? 0) > 0,
    'Verified private review should prove the approved plan carried Edit Cue context.',
  )
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceMediaAssetCount, 2)
  assert.ok((verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.clipDecisionCount ?? 0) > 0, 'Verified local handoff should record manifest clip decisions.')
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceOrderPreserved, true)
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceMediaCoverageComplete, true)
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceStorageIdentityCoverageComplete, true)
  assert.deepEqual(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.firstAppearanceUploadedOrders, [1, 2])
  assert.deepEqual(
    new Set(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.firstAppearanceSourceMediaAssetIds),
    new Set(verifiedHandoffs[0]?.sourceMediaAssets?.map((asset) => asset.mediaAssetId)),
  )
  assert.equal(verifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.privateCaptionPackageAttached, true)
  assert.equal(verifiedHandoffs[0]?.privateReview?.reviewVideoMetadata?.playable, true)
  assert.ok((verifiedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.durationSeconds ?? 0) > 0, 'Verified local handoff should record expected final-render duration.')
  assert.ok((verifiedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.width ?? 0) > 0, 'Verified local handoff should record expected final-render width.')
  assert.ok((verifiedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.height ?? 0) > 0, 'Verified local handoff should record expected final-render height.')
  assert.equal(verifiedHandoffs[0]?.privateReview?.reviewVideoMetadata?.width, verifiedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.width)
  assert.equal(verifiedHandoffs[0]?.privateReview?.reviewVideoMetadata?.height, verifiedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.height)
  assert.ok(
    Math.abs((verifiedHandoffs[0]?.privateReview?.reviewVideoMetadata?.durationSeconds ?? 0) - (verifiedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.durationSeconds ?? 0)) <= 0.5,
    'Verified browser metadata duration should match the final-render artifact duration.',
  )
  assert.ok((verifiedHandoffs[0]?.privateReview?.reviewVideoMetadata?.durationSeconds ?? 0) > 0, 'Verified local handoff should record playable review video duration.')
  assert.ok((verifiedHandoffs[0]?.privateReview?.reviewVideoMetadata?.width ?? 0) > 0, 'Verified local handoff should record playable review video width.')
  assert.ok((verifiedHandoffs[0]?.privateReview?.reviewVideoMetadata?.height ?? 0) > 0, 'Verified local handoff should record playable review video height.')
  assertDownloadedReviewMediaMatchesExpected(initialDownloadMediaProbe, verifiedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata, 'Private review browser download')
  await assertPrivateReviewRoutesRejectAnonymousAccess(
    apiBaseUrl,
    verifiedHandoffs[0]?.privateReview?.privateInternalDownloadPath,
    verifiedHandoffs[0]?.privateReview?.privateInternalManifestPath,
    'Private review',
  )
  await assertPrivateReviewRoutesUseNoStoreCache(
    apiBaseUrl,
    verifiedHandoffs[0]?.privateReview?.privateInternalDownloadPath,
    verifiedHandoffs[0]?.privateReview?.privateInternalManifestPath,
    verifiedToken,
    'Private review',
  )
  const initialPrivateManifest = await fetchPrivateEditDecisionManifest(
    apiBaseUrl,
    verifiedHandoffs[0]?.privateReview?.privateInternalManifestPath,
    verifiedToken,
    'Private review',
  )
  assertDownloadedPrivateManifestMatchesHandoff(initialPrivateManifest.manifest, verifiedHandoffs[0], 'Private review')
  const initialManifestTimelineVisualSamples = await assertManifestTimelineMatchesDownloadedVisuals(
    initialDownloadPath,
    initialPrivateManifest.manifest,
    { 1: 'red', 2: 'blue' },
    'Private review',
  )
  const initialManifestOverlaySamples = await assertManifestTimelineBurnsApprovedOverlayBand(
    initialDownloadPath,
    initialPrivateManifest.manifest,
    'Private review',
  )
  const initialManifestOverlayTextSamples = await assertManifestTimelineBurnsApprovedOverlayText(
    initialDownloadPath,
    initialPrivateManifest.manifest,
    'Private review',
  )
  const initialManifestTransitionFadeSamples = await assertManifestTimelineBurnsApprovedTransitionPolish(
    initialDownloadPath,
    initialPrivateManifest.manifest,
    'Private review',
  )
  const initialManifestAudioToneSamples = await assertManifestTimelinePreservesUploadedSourceAudioTone(
    initialDownloadPath,
    initialPrivateManifest.manifest,
    { 2: true },
    'Private review',
  )
  await clickWhenReady(page.getByRole('button', { name: /Approve edit/i }))
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Edit approved and recorded/i)
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Review decision record is attached to this edit/i)
  assert.ok(authVerificationCount > 0, 'Browser full-stack edit flow should authenticate backend calls with the E2E Supabase bearer token.')
  assert.ok(creditGateResponses.some((entry) => entry.includes('/approve')), 'Browser full-stack edit flow should call the backend credit approval route.')
  assert.ok(creditGateResponses.some((entry) => entry.includes('/reserve')), 'Browser full-stack edit flow should call the backend credit reservation route.')
  assert.equal(creditGateResponses.every((entry) => entry.startsWith('201 ')), true, `Credit gate backend calls should succeed: ${JSON.stringify(creditGateResponses)}`)
  assert.equal(adminPersistenceAttemptCount, 0, 'Browser full-stack internal test flow must not attempt Supabase admin persistence.')
  const acceptedHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      projectId?: string
      projectName?: string
      editorPath?: string
      approvedSnapshotId?: string
      stage?: string
      sourceFileCount?: number
      sourceSetFingerprint?: string
      sourceMediaAssets?: Array<{ mediaAssetId?: string; uploadedOrder?: number; fileName?: string; checksumSha256?: string }>
      setup?: {
        sourceOrderConfirmed?: boolean
        cleanupPreferenceConfirmed?: boolean
        aspectRatioConfirmed?: boolean
        editLevelConfirmed?: boolean
        visualPreferenceConfirmed?: boolean
        sourceSequenceMode?: string
        customInstructions?: string
        userInstructionHistory?: string[]
      }
      privateReview?: {
        manifestVerified?: boolean
        sourceSetFingerprint?: string
        byteSize?: number
        reviewDecision?: string
        renderPreviewAssemblyId?: string
        creditReservationId?: string
        privateInternalDownloadPath?: string
        privateInternalManifestPath?: string
        privateInternalDownloadDeliveryId?: string
        finalDeliveryQaReviewId?: string
        finalRenderExecutionId?: string
        finalRenderReadinessReviewId?: string
        finalRenderArtifactId?: string
        finalRenderSha256?: string
        editDecisionManifestVerification?: {
          approvedPlanSnapshotId?: string
          finalRenderArtifactId?: string
          approvedEditContextReady?: boolean
          approvedEditContext?: {
            projectId?: string
            editSessionId?: string
            goalSummary?: string
            creditEstimateTotalCredits?: number
            segmentCount?: number
            operationCount?: number
            planningContextTrace?: {
              source?: string
              editBriefReady?: boolean
              editBriefDirectionCount?: number
              cueUsageCount?: number
              readyCueUsageCount?: number
              sourceAssetCount?: number
            } | null
          }
          sourceMediaAssetCount?: number
          sourceOrderPreserved?: boolean
          sourceMediaCoverageComplete?: boolean
          sourceStorageIdentityCoverageComplete?: boolean
          processedPrivateArtifactTraceComplete?: boolean
          processedArtifactCount?: number
          firstAppearanceSourceMediaAssetIds?: string[]
          firstAppearanceUploadedOrders?: number[]
	          professionalLayerCounts?: {
	            reviewOverlays?: number
	            captionOverlays?: number
	            finalTiming?: number
	            audioQa?: number
	            audioPolish?: number
	          }
	        }
        reviewVideoMetadata?: {
          playable?: boolean
          durationSeconds?: number
          width?: number
          height?: number
        }
        professionalEditQaSummary?: {
          privateInternalQaReady?: boolean
	          editDecisionManifestArtifactReady?: boolean
	          audioPolishApplied?: boolean
	          visualPolishApplied?: boolean
	          sourceAudioQaAttached?: boolean
	          sourceAudioQaReviewCount?: number
	          sourceAudioQaGateCount?: number
	          sourceAudioQaBlockingGateCount?: number
	          sourceAudioQaFinalMuxAllowed?: false
	          sourceAudioQaProductRuntimeExecuted?: false
	          sourceAudioQaPublicArtifact?: false
	          sourceAudioQaSignedUrl?: null
	          approvedReviewOverlayCount?: number
          approvedCaptionOverlayCount?: number
          approvedTransitionPolishCount?: number
          approvedVisualPolishCount?: number
          approvedFinalTimingCount?: number
          privateCaptionArtifactCount?: number
          privateCaptionFormats?: string[]
        }
        adapterGateSummary?: {
          status?: string
          executionMode?: string
          requestedActivityCount?: number
          resolvedActivityCount?: number
          readyActivityCount?: number
          blockedActivityCount?: number
          editActivityCount?: number
          readinessCheckCount?: number
          toolsExecutedCount?: number
          fullToolExecutionReady?: boolean
          privateFallbackReviewOnly?: boolean
          clientReadinessHintsTrusted?: boolean
          serverSourceTruthRequiredForFullExecution?: boolean
          frontendExecutionAllowed?: boolean
          productReady?: boolean
          userFacingSummary?: string
          activityGroups?: Array<{
            id?: string
            label?: string
            resolvedActivityCount?: number
            integratedActivityCount?: number
            pendingActivityCount?: number
            status?: string
            userFacingSummary?: string
          }>
        }
        expectedReviewVideoMetadata?: {
          durationSeconds?: number
          width?: number
          height?: number
        }
        serverReviewId?: string
        serverReviewStatus?: string
        serverNextRequiredGate?: string
      }
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(acceptedHandoffs[0]?.projectId, handoffs[0]?.projectId, 'Accepted private review should preserve the project id from project creation.')
  assert.equal(acceptedHandoffs[0]?.projectName, 'Internal upload review smoke')
  assert.equal(acceptedHandoffs[0]?.editorPath, handoffs[0]?.editorPath, 'Accepted private review should preserve the same editor route.')
  assert.match(acceptedHandoffs[0]?.approvedSnapshotId ?? '', /^approved[-_]snapshot[-_]/, 'Accepted private review should preserve the approved snapshot id.')
  assert.equal(acceptedHandoffs[0]?.stage, 'internal_edit_complete')
  assert.equal(acceptedHandoffs[0]?.sourceFileCount, 2)
  assert.ok(acceptedHandoffs[0]?.sourceSetFingerprint, 'Accepted local handoff should preserve the source-set fingerprint.')
  assert.equal(acceptedHandoffs[0]?.privateReview?.sourceSetFingerprint, acceptedHandoffs[0]?.sourceSetFingerprint, 'Accepted private review should stay bound to the accepted source set.')
  assert.equal(acceptedHandoffs[0]?.sourceMediaAssets?.length, 2)
  assert.deepEqual(acceptedHandoffs[0]?.sourceMediaAssets?.map((asset) => asset.uploadedOrder), [1, 2])
  assertPrivateSourceStorageBucketsPreserved(acceptedHandoffs[0]?.sourceMediaAssets, 'Accepted local handoff')
  assert.equal(acceptedHandoffs[0]?.sourceMediaAssets?.every((asset) => /^[a-f0-9]{64}$/i.test(asset.checksumSha256 ?? '')), true)
  assert.equal(acceptedHandoffs[0]?.setup?.sourceOrderConfirmed, true)
  assert.equal(acceptedHandoffs[0]?.setup?.cleanupPreferenceConfirmed, true)
  assert.equal(acceptedHandoffs[0]?.setup?.aspectRatioConfirmed, true)
  assert.equal(acceptedHandoffs[0]?.setup?.editLevelConfirmed, true)
  assert.equal(acceptedHandoffs[0]?.setup?.visualPreferenceConfirmed, true)
  assert.equal(acceptedHandoffs[0]?.setup?.sourceSequenceMode, 'multi_clip_story_order')
  assert.equal(
    acceptedHandoffs[0]?.setup?.customInstructions ?? '',
    '',
    'An Edit Brief-driven project must not fabricate a chat instruction after private review acceptance.',
  )
  assert.deepEqual(
    acceptedHandoffs[0]?.setup?.userInstructionHistory ?? [],
    [],
    'An Edit Brief-driven project must preserve its intentionally empty chat instruction history.',
  )
  assert.equal(acceptedHandoffs[0]?.privateReview?.manifestVerified, true)
  assert.equal(acceptedHandoffs[0]?.privateReview?.reviewDecision, 'accepted_for_internal_testing')
  assert.match(acceptedHandoffs[0]?.privateReview?.renderPreviewAssemblyId ?? '', /^render_preview_assembly_/, 'Accepted private review should persist the render preview assembly id.')
  assert.match(acceptedHandoffs[0]?.privateReview?.creditReservationId ?? '', /^credit_reservation_/, 'Accepted private review should persist the backend credit reservation id.')
  assert.match(acceptedHandoffs[0]?.privateReview?.privateInternalDownloadPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/file$/, 'Accepted private review should persist the private download route.')
  assert.match(acceptedHandoffs[0]?.privateReview?.privateInternalManifestPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/manifest$/, 'Accepted private review should persist the private manifest route.')
  assert.match(acceptedHandoffs[0]?.privateReview?.privateInternalDownloadDeliveryId ?? '', /^private_internal_download_delivery_/, 'Accepted private review should persist the private internal delivery id.')
  assert.match(acceptedHandoffs[0]?.privateReview?.finalDeliveryQaReviewId ?? '', /^final_delivery_qa_review_/, 'Accepted private review should persist the final delivery QA id.')
  assert.match(acceptedHandoffs[0]?.privateReview?.finalRenderExecutionId ?? '', /^final_render_execution_/, 'Accepted private review should persist the final render execution id.')
  assert.match(acceptedHandoffs[0]?.privateReview?.finalRenderReadinessReviewId ?? '', /^final_render_readiness_review_/, 'Accepted private review should persist the final render readiness id.')
  assert.match(acceptedHandoffs[0]?.privateReview?.finalRenderArtifactId ?? '', /^final-render-/, 'Accepted private review should persist the private final-render artifact id.')
  assert.match(acceptedHandoffs[0]?.privateReview?.finalRenderSha256 ?? '', /^[a-f0-9]{64}$/i, 'Accepted private review should persist the private final-render sha256.')
  assert.match(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedPlanSnapshotId ?? '', /^approved[-_]snapshot[-_]/, 'Accepted private review should preserve manifest verification approved snapshot id.')
  assert.equal(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContextReady, true)
  assert.equal(
    acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.goalSummary,
    approvedEditBriefGoal,
    'Accepted manifest verification should preserve the exact user-approved Edit Brief goal.',
  )
  assert.ok((acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.creditEstimateTotalCredits ?? 0) > 0)
  assert.equal(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.planningContextTrace?.source, 'planning_context')
  assert.equal(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.planningContextTrace?.editBriefReady, true)
  assert.ok((acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.approvedEditContext?.planningContextTrace?.cueUsageCount ?? 0) > 0)
  assert.equal(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.finalRenderArtifactId, acceptedHandoffs[0]?.privateReview?.finalRenderArtifactId)
  assert.equal(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceMediaAssetCount, 2)
  assert.equal(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceOrderPreserved, true)
  assert.equal(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceMediaCoverageComplete, true)
  assert.equal(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceStorageIdentityCoverageComplete, true)
  assert.equal(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.processedPrivateArtifactTraceComplete, true)
  assert.ok(
    (acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.processedArtifactCount ?? 0) > 0,
    'Accepted manifest verification should preserve processed private artifact count.',
  )
  assert.deepEqual(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.firstAppearanceUploadedOrders, [1, 2])
  assert.deepEqual(
    new Set(acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.firstAppearanceSourceMediaAssetIds),
    new Set(acceptedHandoffs[0]?.sourceMediaAssets?.map((asset) => asset.mediaAssetId)),
	  )
	  assert.ok((acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.professionalLayerCounts?.reviewOverlays ?? 0) > 0, 'Accepted manifest verification should preserve review overlay layer count.')
	  assert.ok((acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.professionalLayerCounts?.captionOverlays ?? 0) > 0, 'Accepted manifest verification should preserve caption overlay layer count.')
	  assert.ok((acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.professionalLayerCounts?.finalTiming ?? 0) > 0, 'Accepted manifest verification should preserve final timing layer count.')
	  assert.ok((acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.professionalLayerCounts?.audioQa ?? 0) > 0, 'Accepted manifest verification should preserve uploaded-source audio QA layer count.')
	  assert.ok((acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.professionalLayerCounts?.audioPolish ?? 0) > 0, 'Accepted manifest verification should preserve audio polish layer count.')
  assert.equal(acceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.playable, true)
  assert.equal(acceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.width, acceptedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.width)
  assert.equal(acceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.height, acceptedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.height)
  assert.ok(
    Math.abs((acceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.durationSeconds ?? 0) - (acceptedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.durationSeconds ?? 0)) <= 0.5,
    'Accepted browser metadata duration should match the final-render artifact duration.',
  )
  assert.ok((acceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.durationSeconds ?? 0) > 0, 'Accepted private review should preserve browser-playable review video duration.')
  assert.ok((acceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.width ?? 0) > 0, 'Accepted private review should preserve browser-playable review video width.')
	  assert.ok((acceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.height ?? 0) > 0, 'Accepted private review should preserve browser-playable review video height.')
	  assert.equal(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.privateInternalQaReady, true)
	  assert.equal(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.editDecisionManifestArtifactReady, true)
	  assert.equal(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.audioPolishApplied, true)
	  assert.equal(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.visualPolishApplied, true)
	  assert.equal(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.sourceAudioQaAttached, true)
	  assert.ok((acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.sourceAudioQaReviewCount ?? 0) > 0, 'Accepted private review should persist uploaded-source audio QA review count.')
	  assert.ok((acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.sourceAudioQaGateCount ?? 0) > 0, 'Accepted private review should persist uploaded-source audio QA gate count.')
	  assert.equal(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.sourceAudioQaBlockingGateCount, 0)
	  assert.equal(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.sourceAudioQaFinalMuxAllowed, false)
	  assert.equal(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.sourceAudioQaProductRuntimeExecuted, false)
	  assert.equal(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.sourceAudioQaPublicArtifact, false)
	  assert.equal(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.sourceAudioQaSignedUrl, null)
  assert.ok((acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.resolvedActivityCount ?? 0) > 0, 'Accepted private review should persist scoped edit-activity gate readiness.')
  assert.ok((acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.resolvedActivityCount ?? 0) < 36, 'Accepted private review should not claim every registered adapter for every edit.')
  assert.equal(acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.blockedActivityCount, 0)
  assert.equal(acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.executionMode, 'private_internal_dry_run_and_local_fallback')
  assert.ok(
    (acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.toolsExecutedCount ?? 0) <=
      (acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.resolvedActivityCount ?? 0),
    'Accepted private review should cap bounded adapter package checks to scoped edit activities.',
  )
  assert.equal(acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.fullToolExecutionReady, false)
  assert.equal(acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.privateFallbackReviewOnly, true)
  assert.equal(acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.clientReadinessHintsTrusted, false)
  assert.equal(acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.serverSourceTruthRequiredForFullExecution, true)
  assert.equal(acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.frontendExecutionAllowed, false)
  assert.equal(acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.productReady, false)
  assert.equal(acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.userFacingSummary?.toLowerCase().includes('librosa'), false)
  const acceptedActivityGroups = acceptedHandoffs[0]?.privateReview?.adapterGateSummary?.activityGroups ?? []
  assert.ok(acceptedActivityGroups.length > 0, 'Accepted private review should persist grouped user-facing edit activity readiness.')
  assert.ok(acceptedActivityGroups.some((group) => group.label === 'Audio preparation'), 'Accepted private review should preserve audio preparation readiness grouping.')
  assert.ok(acceptedActivityGroups.some((group) => group.label === 'Private review package'), 'Accepted private review should preserve private review package readiness grouping.')
  assert.equal(
    /librosa|audioflux|d3|three|gpac|mkvtoolnix|streamer_render_pipeline_support/i.test(JSON.stringify(acceptedActivityGroups)),
    false,
    'Accepted private review activity groups should not expose internal adapter/tool names.',
  )
  assert.ok((acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.approvedReviewOverlayCount ?? 0) > 0, 'Accepted private review should persist review overlay QA count.')
  assert.ok((acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.approvedCaptionOverlayCount ?? 0) > 0, 'Accepted private review should persist caption overlay QA count.')
  assert.ok((acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.approvedTransitionPolishCount ?? 0) > 0, 'Accepted private review should persist transition polish QA count.')
  assert.ok((acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.approvedVisualPolishCount ?? 0) > 0, 'Accepted private review should persist visual polish QA count.')
  assert.ok((acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.approvedFinalTimingCount ?? 0) > 0, 'Accepted private review should persist final timing QA count.')
  assert.equal(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.privateCaptionArtifactCount, 3)
  assert.deepEqual(new Set(acceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.privateCaptionFormats), new Set(['srt', 'webvtt', 'ass']))
  assert.match(acceptedHandoffs[0]?.privateReview?.serverReviewId ?? '', /^user_preview_review_/, 'Accepted private review should persist the server preview-review id.')
  assert.equal(acceptedHandoffs[0]?.privateReview?.serverReviewStatus, 'user_preview_review_approved_waiting_final_render_readiness')
  assert.equal(acceptedHandoffs[0]?.privateReview?.serverNextRequiredGate, 'final_render_readiness_review')
  const backendAcceptedState = await waitForInternalEditStateStage(
    apiBaseUrl,
    handoffs[0]?.projectId ?? '',
    verifiedToken,
    'internal_edit_complete',
  )
  assert.equal(backendAcceptedState?.privateReview?.manifestVerified, true, 'Backend internal edit state should be durable immediately after private review acceptance.')
  assert.equal(
    backendAcceptedState?.privateReview?.editDecisionManifestVerification?.sourceStorageIdentityCoverageComplete,
    true,
    'Backend accepted state should preserve source storage identity verification.',
  )
  assert.equal(
    backendAcceptedState?.privateReview?.editDecisionManifestVerification?.finalRenderArtifactId,
    acceptedHandoffs[0]?.privateReview?.finalRenderArtifactId,
    'Backend accepted state should preserve the manifest verification final-render artifact id.',
  )
  assert.equal(backendAcceptedState?.projectId, acceptedHandoffs[0]?.projectId, 'Backend accepted state should preserve the accepted project id.')
  assert.equal(backendAcceptedState?.projectName, acceptedHandoffs[0]?.projectName, 'Backend accepted state should preserve the accepted project name.')
  assert.equal(backendAcceptedState?.editorPath, acceptedHandoffs[0]?.editorPath, 'Backend accepted state should preserve the editor route.')
  assert.equal(backendAcceptedState?.approvedSnapshotId, acceptedHandoffs[0]?.approvedSnapshotId, 'Backend accepted state should preserve the approved snapshot id.')
  assertPrivateSourceStorageBucketsPreserved(backendAcceptedState?.sourceMediaAssets, 'Backend accepted internal edit state')
  assertUploadedSourceMetadataPreserved(backendAcceptedState?.sourceMediaAssets, 'Backend accepted internal edit state')
  assert.equal(backendAcceptedState?.privateReview?.reviewDecision, 'accepted_for_internal_testing')
  assert.equal(backendAcceptedState?.privateReview?.finalRenderArtifactId, acceptedHandoffs[0]?.privateReview?.finalRenderArtifactId, 'Backend accepted state should preserve the accepted final render artifact id.')
  assert.equal(backendAcceptedState?.privateReview?.finalRenderSha256, acceptedHandoffs[0]?.privateReview?.finalRenderSha256, 'Backend accepted state should preserve the accepted final render sha256.')
  assert.equal(backendAcceptedState?.privateReview?.privateInternalDownloadPath, acceptedHandoffs[0]?.privateReview?.privateInternalDownloadPath, 'Backend accepted state should preserve the private download route.')
  assert.equal(backendAcceptedState?.privateReview?.privateInternalManifestPath, acceptedHandoffs[0]?.privateReview?.privateInternalManifestPath, 'Backend accepted state should preserve the private manifest route.')
  assert.match(backendAcceptedState?.privateReview?.serverReviewId ?? '', /^user_preview_review_/, 'Backend accepted state should persist the server preview-review id.')
  assert.ok((backendAcceptedState?.privateReview?.adapterGateSummary?.resolvedActivityCount ?? 0) > 0, 'Backend accepted state should persist generic edit-activity gate readiness.')
  assert.ok((backendAcceptedState?.privateReview?.adapterGateSummary?.resolvedActivityCount ?? 0) < 36, 'Backend accepted state should not claim every registered adapter for every edit.')
  assert.ok(
    (backendAcceptedState?.privateReview?.adapterGateSummary?.toolsExecutedCount ?? 0) <=
      (backendAcceptedState?.privateReview?.adapterGateSummary?.resolvedActivityCount ?? 0),
    'Backend accepted state should preserve bounded adapter checks without claiming product-ready worker execution.',
  )
  assert.equal(backendAcceptedState?.privateReview?.adapterGateSummary?.privateFallbackReviewOnly, true, 'Backend accepted state should preserve private fallback execution scope.')
  assert.equal(backendAcceptedState?.privateReview?.adapterGateSummary?.clientReadinessHintsTrusted, false, 'Backend accepted state should preserve that client readiness hints are not trusted.')
  assert.equal(backendAcceptedState?.privateReview?.adapterGateSummary?.serverSourceTruthRequiredForFullExecution, true, 'Backend accepted state should preserve that full tool execution requires backend source truth.')
  assert.equal(backendAcceptedState?.privateReview?.adapterGateSummary?.productReady, false, 'Backend accepted state must not mark adapter gates product-ready.')

  await page.goto(`${viteUrl}projects`)
  const acceptedProjectCard = page.locator('.projects-card').filter({ hasText: 'Internal upload review smoke' })
  await expect(acceptedProjectCard).toBeVisible()
  await expect(acceptedProjectCard).toContainText('Edit complete')
  await expect(acceptedProjectCard).toContainText(/Internal review is complete\. Public release remains gated\./i)
  const acceptedProjectLink = acceptedProjectCard.getByRole('link', { name: /Open project/i })
  const acceptedProjectHref = await acceptedProjectLink.getAttribute('href')
  assert.equal(
    new URL(acceptedProjectHref ?? '', viteUrl).pathname,
    `/projects/${encodeURIComponent(acceptedHandoffs[0]?.projectId ?? '')}`,
    'Projects page should reopen the accepted project route.',
  )
  await acceptedProjectLink.click()
  const acceptedProjectEditorCard = page.locator('.project-edit-card').filter({ hasText: 'Launch edit v1' })
  await expect(acceptedProjectEditorCard).toBeVisible()
  const acceptedProjectEditorLink = acceptedProjectEditorCard.getByRole('link', { name: /Open edit/i })
  const acceptedProjectEditorHref = await acceptedProjectEditorLink.getAttribute('href')
  assert.equal(
    new URL(acceptedProjectEditorHref ?? '', viteUrl).pathname + new URL(acceptedProjectEditorHref ?? '', viteUrl).search,
    acceptedHandoffs[0]?.editorPath,
    'Projects page should reopen the exact accepted edit route.',
  )
  await acceptedProjectEditorLink.click()
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: editorBootTimeoutMs })
  await expect(page.getByTestId('editor-header')).toContainText('Launch edit v1')
  await expect(page.getByText(/Restored edit state: the review edit is complete/i)).toBeVisible()
  await expect(page.getByTestId('private-internal-test-run-card')).toBeVisible()
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Readiness details/i)
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Final QA passed with/i)
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Private review file/i)
  const reopenedAcceptedHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      projectId?: string
      editorPath?: string
      approvedSnapshotId?: string
      stage?: string
      sourceMediaAssets?: SmokeSourceMediaAsset[]
      privateReview?: {
        finalRenderArtifactId?: string
        finalRenderSha256?: string
        privateInternalDownloadPath?: string
        privateInternalManifestPath?: string
      }
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(reopenedAcceptedHandoffs[0]?.projectId, acceptedHandoffs[0]?.projectId, 'Reopened accepted edit should preserve the accepted project id.')
  assert.equal(reopenedAcceptedHandoffs[0]?.editorPath, acceptedHandoffs[0]?.editorPath, 'Reopened accepted edit should preserve the accepted editor route.')
  assert.equal(reopenedAcceptedHandoffs[0]?.approvedSnapshotId, acceptedHandoffs[0]?.approvedSnapshotId, 'Reopened accepted edit should preserve the approved snapshot id.')
  assert.equal(reopenedAcceptedHandoffs[0]?.stage, 'internal_edit_complete', 'Reopened accepted edit should preserve complete state.')
  assert.equal(reopenedAcceptedHandoffs[0]?.privateReview?.finalRenderArtifactId, acceptedHandoffs[0]?.privateReview?.finalRenderArtifactId, 'Reopened accepted edit should preserve the final render artifact id.')
  assert.equal(reopenedAcceptedHandoffs[0]?.privateReview?.finalRenderSha256, acceptedHandoffs[0]?.privateReview?.finalRenderSha256, 'Reopened accepted edit should preserve the final render sha256.')
  assert.equal(reopenedAcceptedHandoffs[0]?.privateReview?.privateInternalDownloadPath, acceptedHandoffs[0]?.privateReview?.privateInternalDownloadPath, 'Reopened accepted edit should preserve the private download route.')
  assert.equal(reopenedAcceptedHandoffs[0]?.privateReview?.privateInternalManifestPath, acceptedHandoffs[0]?.privateReview?.privateInternalManifestPath, 'Reopened accepted edit should preserve the private manifest route.')
  assertPrivateSourceStorageBucketsPreserved(reopenedAcceptedHandoffs[0]?.sourceMediaAssets, 'Reopened accepted edit')
  await clickWhenReady(page.getByRole('button', { name: /Load review video/i }))
  const restoredAcceptedReviewVideo = page.getByTestId('private-internal-review-video')
  await expect(restoredAcceptedReviewVideo).toBeVisible({ timeout: 12_000 })
  const restoredAcceptedVideoSrc = await restoredAcceptedReviewVideo.evaluate((node) => (node as HTMLVideoElement).currentSrc || (node as HTMLVideoElement).src)
  assert.match(restoredAcceptedVideoSrc, /^blob:/, 'Reopened accepted private review should reload through a browser object URL.')

  await page.getByTestId('chat-composer-attachment-actions').locator('input[type="file"]').setInputFiles({
    name: 'browser-upload-followup-source.mp4',
    mimeType: 'video/mp4',
    buffer: sourceBytes,
  })
  const restoredSourceCard = page.getByTestId('source-sequence-card')
  await expect(restoredSourceCard).toBeVisible()
  await expect(restoredSourceCard).toContainText('browser-upload-followup-source.mp4')
  await expect(page.getByText(/I added 1 source file to this edit in uploaded order/i)).toBeVisible()
  const sourceChangedHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      stage?: string
      approvedSnapshotId?: string
      sourceSetFingerprint?: string
      sourceFileCount?: number
      setup?: { sourceOrderConfirmed?: boolean; cleanupPreferenceConfirmed?: boolean }
      sourceMediaAssets?: Array<{
        uploadedOrder?: number
        fileName?: string
        storageProvider?: string
        privateArtifact?: boolean
        publicUrl?: string | null
        signedUrl?: string | null
        checksumSha256?: string
      }>
      privateReview?: unknown
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(sourceChangedHandoffs[0]?.stage, 'source_uploaded')
  assert.equal(sourceChangedHandoffs[0]?.approvedSnapshotId, undefined, 'Changing source footage must invalidate the previous approved snapshot id.')
  assert.equal(sourceChangedHandoffs[0]?.privateReview, undefined, 'Changing source footage must clear the previous private review trace.')
  assert.equal(sourceChangedHandoffs[0]?.setup?.sourceOrderConfirmed, false)
  assert.equal(sourceChangedHandoffs[0]?.setup?.cleanupPreferenceConfirmed, false)
  assert.equal(sourceChangedHandoffs[0]?.sourceFileCount, 3)
  assert.ok(sourceChangedHandoffs[0]?.sourceSetFingerprint, 'Changing source footage should record a new source-set fingerprint.')
  assert.notEqual(sourceChangedHandoffs[0]?.sourceSetFingerprint, acceptedHandoffs[0]?.sourceSetFingerprint, 'Changing source footage should change the source-set fingerprint.')
  assert.deepEqual(sourceChangedHandoffs[0]?.sourceMediaAssets?.map((asset) => asset.uploadedOrder), [1, 2, 3])
  assert.deepEqual(new Set(sourceChangedHandoffs[0]?.sourceMediaAssets?.map((asset) => asset.storageProvider)), new Set(['local_private']))
  assertPrivateSourceStorageBucketsPreserved(sourceChangedHandoffs[0]?.sourceMediaAssets, 'Changed-source local handoff')
  assert.equal(sourceChangedHandoffs[0]?.sourceMediaAssets?.every((asset) => asset.privateArtifact === true), true)
  assert.equal(sourceChangedHandoffs[0]?.sourceMediaAssets?.every((asset) => asset.publicUrl === null && asset.signedUrl === null), true)
  assert.equal(sourceChangedHandoffs[0]?.sourceMediaAssets?.every((asset) => /^[a-f0-9]{64}$/i.test(asset.checksumSha256 ?? '')), true)
  await page.evaluate(({ storageKey, stalePrivateReview }: { storageKey: string; stalePrivateReview: unknown }) => {
    const envelope = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[]; savedAt?: string }
    const handoffs = (envelope.handoffs ?? []) as Array<Record<string, unknown>>
    if (!handoffs[0]) return
    handoffs[0] = {
      ...handoffs[0],
      stage: 'internal_edit_complete',
      privateReview: stalePrivateReview,
    }
    window.localStorage.setItem(storageKey, JSON.stringify({
      ...envelope,
      handoffs,
      savedAt: new Date().toISOString(),
    }))
  }, {
    storageKey: getLocalProjectHandoffStorageKey(),
    stalePrivateReview: acceptedHandoffs[0]?.privateReview,
  })
  await page.goto(`${viteUrl}projects`)
  const staleReviewProjectCard = page.locator('.projects-card').filter({ hasText: 'Internal upload review smoke' })
  await expect(staleReviewProjectCard).toBeVisible()
  await expect(staleReviewProjectCard).toContainText('Sources attached')
  await expect(staleReviewProjectCard).not.toContainText('Review needs refresh')
  await expect(staleReviewProjectCard).not.toContainText(/Previous private review evidence is no longer trusted/i)
  await staleReviewProjectCard.getByRole('link', { name: /Open project/i }).click()
  const staleReviewEditCard = page.locator('.project-edit-card').filter({ hasText: 'Launch edit v1' })
  await expect(staleReviewEditCard).toBeVisible()
  await staleReviewEditCard.getByRole('link', { name: /Continue setup/i }).click()
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: editorBootTimeoutMs })
  await expect(page.getByText(/previous private review evidence is no longer trusted for the current source set/i)).toHaveCount(0)
  await expect(page.getByTestId('source-sequence-card')).toContainText('browser-upload-followup-source.mp4')

  await page.goto(`${viteUrl}projects/new`)
  await expect(page.getByRole('heading', { level: 1, name: 'New project' })).toBeVisible()
  await page.getByLabel('Project name').fill('Internal revision request smoke')
  await page.getByRole('button', { name: /^Create project$/i }).first().click()
  await expect(page).toHaveURL(/\/projects\/[^/]+$/)
  await page.getByRole('button', { name: /^New video edit$/i }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel(/Edit name/i).fill('Revision edit v1')
  await page.getByRole('button', { name: /^Create edit$/i }).first().click()
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: editorBootTimeoutMs })
  await expect(page.getByTestId('editor-header')).toContainText('Revision edit v1')

  await expect(page.getByTestId('edit-upload-gate')).toBeVisible()
  await expect(page.getByTestId('source-sequence-card')).toHaveCount(0)
  await page.getByTestId('edit-upload-gate-input').setInputFiles({
    name: 'browser-upload-revision-source-with-audio.mp4',
    mimeType: 'video/mp4',
    buffer: secondSourceBytes,
  })
  const revisionSourceSetup = page.getByTestId('source-summary')
  await expect(revisionSourceSetup).toBeVisible()
  await expect(revisionSourceSetup).toContainText('browser-upload-revision-source-with-audio.mp4')
  await expect(page.getByTestId('source-summary')).toHaveCount(1)
  await clickWhenReady(page.getByRole('button', { name: /Confirm order|Use this source/i }).first())
  await clickWhenReady(page.getByRole('radio', { name: /16:9/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm frame/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm cleanup/i }).first())
  await maybeClickWhenReady(page.getByRole('button', { name: /Use (Normal|Premium|Ultra Premium)/i }).first())
  await maybeClickWhenReady(page.getByRole('button', { name: /Confirm direction/i }).first())
  await maybeClickWhenReady(page.getByRole('button', { name: /Skip reference/i }).first())
  const revisionIntentButton = page.getByRole('button', { name: /Looks right/i }).first()
  if (await revisionIntentButton.count()) {
    await clickWhenReady(revisionIntentButton)
  }
  await expect(page.getByTestId('plan-review-approve')).toHaveCount(0)
  await expect(page.getByText(/Placeholder or stale source records cannot become edit context/i)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Prepare source/i }).first()).toBeEnabled()
  await clickWhenReady(page.getByRole('button', { name: /Prepare source/i }).first())
  await expect(page.getByText(/Source prep is ready for 1 uploaded source file in this edit/i)).toBeVisible({ timeout: 12_000 })
  await expect(page.getByText(/Ready to create the plan/i)).toBeVisible({ timeout: 12_000 })
  await openEditBriefWorkspace(page)
  await page
    .getByTestId('editor-edit-brief-canvas')
    .getByTestId('edit-brief-goal-input')
    .fill('Create a revised internal review edit from the uploaded source and keep the review trace clear.')
  await clickEditBriefReadyButton(page)
  await openChatWorkspace(page)
  await waitForCanonicalBriefPlanAction(page)
  await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
  await expect(page.getByTestId('plan-review-card')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByText(/Plan updated from your source assembly/i)).toBeVisible()
  await expect(page.getByTestId('plan-review-approve')).toBeEnabled()
  await clickWhenReady(page.getByTestId('plan-review-approve'))
  await expect(page.getByTestId('private-internal-test-run-card')).toBeVisible({ timeout: 45_000 })
  await clickWhenReady(page.getByRole('button', { name: /Load review video/i }))
  await expect(page.getByTestId('private-internal-review-video')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Playback check complete:/i)
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Review QA record verified/i)
  const [revisionDownload] = await Promise.all([
    page.waitForEvent('download'),
    clickWhenReady(page.getByRole('button', { name: /Download MP4/i })),
  ])
  assert.match(revisionDownload.suggestedFilename(), /\.mp4$/i, 'Revised private review download should suggest an MP4 filename.')
  const revisionDownloadPath = await revisionDownload.path()
  assert.ok(revisionDownloadPath, 'Revised private review browser download should resolve to a local file path.')
  const revisionDownloadBytes = await readFile(revisionDownloadPath)
  assert.ok(revisionDownloadBytes.byteLength > 0, 'Revised private review browser download should save non-empty MP4 bytes.')
  const revisionDownloadSha256 = sha256Hex(revisionDownloadBytes)
  const revisionDownloadMediaProbe = await probeMedia(revisionDownloadPath)
  assertRenderedDownloadIsNotSourcePassthrough(
    revisionDownloadSha256,
    revisionDownloadMediaProbe,
    [{ label: 'revision browser-uploaded source', sha256: secondSourceSha256, width: secondSourceFixture.width, height: secondSourceFixture.height }],
    'Revision private review download',
  )
  const revisionVisualSamples = await assertRenderedVisualSourceOrder(
    revisionDownloadPath,
    revisionDownloadMediaProbe,
    ['blue'],
    'Revision private review download',
  )
  assert.equal(revisionDownloadMediaProbe.hasAudio, true, 'Revision private review download should include the uploaded-source audio stream.')
  const revisionPrivateReviewMeanVolumeDb = await probeAudioMeanVolume(revisionDownloadPath)
  assert.ok(
    revisionPrivateReviewMeanVolumeDb > -70,
    `Revision private review download should preserve audible uploaded-source audio, got ${revisionPrivateReviewMeanVolumeDb} dB.`,
  )
  const revisionPrivateReviewAudioTone = await probeAudioTone(revisionDownloadPath)
  assertSourceAudioTone(revisionPrivateReviewAudioTone, 'Revision private review download')
  const revisionVerifiedHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      stage?: string
      projectName?: string
      sourceMediaAssets?: Array<{ mediaAssetId?: string; uploadedOrder?: number; fileName?: string; checksumSha256?: string }>
      privateReview?: {
        privateInternalManifestPath?: string
        finalRenderSha256?: string
        editDecisionManifestVerification?: {
          finalRenderArtifactId?: string
          sourceOrderPreserved?: boolean
          sourceStorageIdentityCoverageComplete?: boolean
        }
        expectedReviewVideoMetadata?: {
          durationSeconds?: number
          width?: number
          height?: number
        }
      }
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(revisionVerifiedHandoffs[0]?.projectName, 'Internal revision request smoke')
  assert.equal(revisionVerifiedHandoffs[0]?.stage, 'private_review_verified')
  assert.match(revisionVerifiedHandoffs[0]?.privateReview?.finalRenderSha256 ?? '', /^[a-f0-9]{64}$/i, 'Revision private review should record the private final-render sha256 before the revision request.')
  assert.equal(revisionVerifiedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceStorageIdentityCoverageComplete, true)
  assert.equal(revisionDownloadSha256, revisionVerifiedHandoffs[0]?.privateReview?.finalRenderSha256, 'Revision private review download bytes should match the recorded final-render sha256.')
  assertDownloadedReviewMediaMatchesExpected(revisionDownloadMediaProbe, revisionVerifiedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata, 'Revision private review download')
  const revisionPrivateManifest = await fetchPrivateEditDecisionManifest(
    apiBaseUrl,
    revisionVerifiedHandoffs[0]?.privateReview?.privateInternalManifestPath,
    verifiedToken,
    'Revision private review',
  )
  assertDownloadedPrivateManifestMatchesHandoff(revisionPrivateManifest.manifest, revisionVerifiedHandoffs[0], 'Revision private review')
  const revisionManifestTimelineVisualSamples = await assertManifestTimelineMatchesDownloadedVisuals(
    revisionDownloadPath,
    revisionPrivateManifest.manifest,
    { 1: 'blue' },
    'Revision private review',
  )
  const revisionManifestOverlaySamples = await assertManifestTimelineBurnsApprovedOverlayBand(
    revisionDownloadPath,
    revisionPrivateManifest.manifest,
    'Revision private review',
  )
  const revisionManifestOverlayTextSamples = await assertManifestTimelineBurnsApprovedOverlayText(
    revisionDownloadPath,
    revisionPrivateManifest.manifest,
    'Revision private review',
  )
  const revisionManifestTransitionFadeSamples = await assertManifestTimelineBurnsApprovedTransitionPolish(
    revisionDownloadPath,
    revisionPrivateManifest.manifest,
    'Revision private review',
  )
  const revisionManifestAudioToneSamples = await assertManifestTimelinePreservesUploadedSourceAudioTone(
    revisionDownloadPath,
    revisionPrivateManifest.manifest,
    { 1: true },
    'Revision private review',
  )
  await clickWhenReady(page.getByRole('button', { name: /Request changes/i }))
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Add a short revision note before requesting changes/i)
  const revisionNote = 'Tighten the opening beat and keep the source order unchanged.'
  await page.getByLabel('Review note').fill(revisionNote)
  await clickWhenReady(page.getByRole('button', { name: /Request changes/i }))
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Changes requested and recorded/i)
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Review decision record is attached to this edit/i)
  await expect(page.getByText(/Revision request created from the review note/i)).toBeVisible({ timeout: 12_000 })
  await expect(page.getByText(/Active revision request/i)).toBeVisible({ timeout: 12_000 })
  await expect(page.getByTestId('revision-direction-trace-card')).toContainText(/Revision keeps the approved direction/i)
  await expect(page.getByTestId('revision-direction-trace-card')).toContainText(/Fresh approval needed|ready|needs approval/i)
  await expect(page.getByTestId('revision-direction-trace-card')).toContainText(revisionNote)
  await expect(page.getByTestId('revision-direction-trace-card')).toContainText(/What stays attached/i)
  await expect(page.getByTestId('revision-direction-trace-card')).not.toContainText(/librosa|d3|three|gpac|mp4box|backend|source-truth|Qwen|DeepSeek/i)
  await expect(page.getByTestId('revision-request-card')).toContainText(revisionNote)
  await expect(page.getByTestId('revision-request-card')).toContainText(/Review record/i)
  await expect(page.getByTestId('revision-request-card')).toContainText(/fresh approval/i)
  await expect(page.getByTestId('revision-request-card')).not.toContainText(/librosa|d3|three|gpac|mp4box|backend|source-truth|Qwen|DeepSeek/i)
  const revisionHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      projectId?: string
      stage?: string
      projectName?: string
      sourceSetFingerprint?: string
      privateReview?: {
        manifestVerified?: boolean
        sourceSetFingerprint?: string
        reviewDecision?: string
        reviewNote?: string
        finalRenderArtifactId?: string
        serverReviewId?: string
        serverReviewStatus?: string
        serverNextRequiredGate?: string
        revisionOperationId?: string
        revisionRequestId?: string
        nextRequiredGate?: string
      }
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(revisionHandoffs[0]?.projectName, 'Internal revision request smoke')
  assert.equal(revisionHandoffs[0]?.stage, 'revision_requested')
  assert.ok(revisionHandoffs[0]?.sourceSetFingerprint, 'Revision request should preserve the active source-set fingerprint.')
  assert.equal(revisionHandoffs[0]?.privateReview?.sourceSetFingerprint, revisionHandoffs[0]?.sourceSetFingerprint, 'Revision-requested private review should stay bound to the active source set.')
  assert.equal(revisionHandoffs[0]?.privateReview?.manifestVerified, true)
  assert.equal(revisionHandoffs[0]?.privateReview?.reviewDecision, 'changes_requested')
  assert.equal(revisionHandoffs[0]?.privateReview?.reviewNote, revisionNote)
  assert.match(revisionHandoffs[0]?.privateReview?.serverReviewId ?? '', /^user_preview_review_/, 'Revision-requested private review should persist the server preview-review id.')
  assert.equal(revisionHandoffs[0]?.privateReview?.serverReviewStatus, 'user_preview_review_changes_requested')
  assert.equal(revisionHandoffs[0]?.privateReview?.serverNextRequiredGate, 'preview_revision_plan')
  assert.match(revisionHandoffs[0]?.privateReview?.revisionOperationId ?? '', /operation-\d+$/, 'Revision-requested private review should persist the Edit Map operation id.')
  assert.match(revisionHandoffs[0]?.privateReview?.revisionRequestId ?? '', /revision-request-\d+$/, 'Revision-requested private review should persist the revision request id.')
  assert.equal(revisionHandoffs[0]?.privateReview?.nextRequiredGate, 'revision_request_review')

  await page.getByLabel('I understand this is an internal test revision.').check()
  await page.getByLabel('I understand this prepares a private review only and does not publish media.').check()
  await page.getByLabel('I accept the internal revision credit estimate.').check()
  await clickWhenReady(page.getByRole('button', { name: /Approve Revision/i }))
  await clickWhenReady(page.getByRole('button', { name: /Prepare revised review/i }))
  await expect(page.getByTestId('revision-job-progress-card')).toContainText(/Revision preparation/i, { timeout: 12_000 })
  await expect(page.getByTestId('revision-job-progress-card')).toContainText(/Preparing a revised private review/i)
  await expect(page.getByTestId('revision-job-progress-card')).toContainText(/Reading requested changes/i)
  await expect(page.getByTestId('revision-job-progress-card')).not.toContainText(/mock revision|revision job|renderer|provider|librosa|d3|three|gpac|mp4box|Qwen|DeepSeek/i)
  await clickWhenReady(page.getByRole('button', { name: /Mark review ready/i }))
  await expect(page.getByText(/Revision review is ready for another review pass/i)).toBeVisible({ timeout: 12_000 })
  const revisionReadyHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      projectId?: string
      stage?: string
      projectName?: string
      privateReview?: {
        reviewNote?: string
        revisionRequestId?: string
        revisionPreviewId?: string
        revisionPreviewVersion?: number
        revisionJobId?: string
        nextRequiredGate?: string
      }
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(revisionReadyHandoffs[0]?.projectName, 'Internal revision request smoke')
  assert.equal(revisionReadyHandoffs[0]?.stage, 'revision_preview_ready')
  assert.equal(revisionReadyHandoffs[0]?.privateReview?.reviewNote, revisionNote)
  assert.match(revisionReadyHandoffs[0]?.privateReview?.revisionRequestId ?? '', /revision-request-\d+$/, 'Completed private review revision should preserve the revision request id.')
  assert.match(revisionReadyHandoffs[0]?.privateReview?.revisionPreviewId ?? '', /mock-preview-v2$/, 'Completed private review revision should record the mock revision preview id.')
  assert.equal(revisionReadyHandoffs[0]?.privateReview?.revisionPreviewVersion, 2)
  assert.match(revisionReadyHandoffs[0]?.privateReview?.revisionJobId ?? '', /mock-revision-job-\d+$/, 'Completed private review revision should record the mock revision job id.')
  assert.equal(revisionReadyHandoffs[0]?.privateReview?.nextRequiredGate, 'private_review_after_revision')

  await page.goto(`${viteUrl}projects`)
  const revisionProjectCard = page.locator('.projects-card').filter({ hasText: 'Internal revision request smoke' })
  await expect(revisionProjectCard).toBeVisible()
  await expect(revisionProjectCard).toContainText('Revision ready')
  await expect(revisionProjectCard).toContainText(/A revised private review is ready/i)
  await revisionProjectCard.getByRole('link', { name: /Open project/i }).click()
  const revisionProjectEditCard = page.locator('.project-edit-card').filter({ hasText: 'Revision edit v1' })
  await expect(revisionProjectEditCard).toBeVisible()
  await revisionProjectEditCard.getByRole('link', { name: /Open revision/i }).click()
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: editorBootTimeoutMs })
  await expect(page.getByTestId('editor-header')).toContainText('Revision edit v1')
  await expect(page.getByText(/Restored review state: revision preview ready/i)).toBeVisible()
  await expect(page.getByText(/Next safe step is another review pass/i)).toBeVisible()
  await expect(page.getByTestId('private-internal-test-run-card')).toBeVisible()
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Changes requested and recorded/i)
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Run revised review/i)
  await clickWhenReady(page.getByRole('button', { name: /Run revised review/i }))
  await expect(page.getByText(/Revised review video is ready/i)).toBeVisible({ timeout: 45_000 })
	  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Final QA passed with/i)
	  await clickWhenReady(page.getByRole('button', { name: /Load review video/i }))
	  await expect(page.getByTestId('private-internal-review-video')).toBeVisible({ timeout: 12_000 })
	  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Review QA record verified/i)
	  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/uploaded-source audio QA review/i)
	  await expect(page.getByRole('button', { name: /Download review record/i })).toBeEnabled()
	  await clickWhenReady(page.getByRole('button', { name: /Approve edit/i }))
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Edit approved and recorded/i)
  const revisedAcceptedHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
	      projectId?: string
	      editSessionId?: string
	      stage?: string
	      projectName?: string
	      editorPath?: string
      approvedSnapshotId?: string
      sourceSetFingerprint?: string
      sourceMediaAssets?: Array<{ mediaAssetId?: string; uploadedOrder?: number; fileName?: string; checksumSha256?: string }>
      privateReview?: {
        manifestVerified?: boolean
        sourceSetFingerprint?: string
        reviewDecision?: string
        creditReservationId?: string
        privateInternalDownloadPath?: string
        privateInternalManifestPath?: string
        finalRenderArtifactId?: string
        finalRenderSha256?: string
        editDecisionManifestVerification?: {
          finalRenderArtifactId?: string
          sourceOrderPreserved?: boolean
          sourceStorageIdentityCoverageComplete?: boolean
        }
        reviewVideoMetadata?: {
          playable?: boolean
          durationSeconds?: number
          width?: number
          height?: number
        }
        expectedReviewVideoMetadata?: {
          durationSeconds?: number
          width?: number
          height?: number
        }
	        professionalEditQaSummary?: {
	          privateInternalQaReady?: boolean
	          sourceAudioQaAttached?: boolean
	          sourceAudioQaReviewCount?: number
	        }
      }
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(revisedAcceptedHandoffs[0]?.projectName, 'Internal revision request smoke')
  assert.equal(revisedAcceptedHandoffs[0]?.stage, 'internal_edit_complete')
  assert.match(revisedAcceptedHandoffs[0]?.approvedSnapshotId ?? '', /^approved[-_]snapshot[-_]/, 'Revised private pass should persist an approved snapshot id.')
  assert.equal(revisedAcceptedHandoffs[0]?.sourceSetFingerprint, revisionHandoffs[0]?.sourceSetFingerprint, 'Revised private pass should keep the same active source set.')
  assert.equal(revisedAcceptedHandoffs[0]?.privateReview?.sourceSetFingerprint, revisedAcceptedHandoffs[0]?.sourceSetFingerprint, 'Revised accepted private review should be bound to the active source set.')
  assert.equal(revisedAcceptedHandoffs[0]?.privateReview?.manifestVerified, true)
  assert.equal(revisedAcceptedHandoffs[0]?.privateReview?.reviewDecision, 'accepted_for_internal_testing')
  assert.match(revisedAcceptedHandoffs[0]?.privateReview?.creditReservationId ?? '', /^credit_reservation_/, 'Revised private pass should preserve backend credit reservation id.')
  assert.match(revisedAcceptedHandoffs[0]?.privateReview?.privateInternalDownloadPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/file$/, 'Revised private pass should persist a fresh private download route.')
  assert.match(revisedAcceptedHandoffs[0]?.privateReview?.privateInternalManifestPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/manifest$/, 'Revised private pass should persist a fresh private manifest route.')
  assert.match(revisedAcceptedHandoffs[0]?.privateReview?.finalRenderArtifactId ?? '', /^final-render-/, 'Revised private pass should persist a final render artifact id.')
  assert.match(revisedAcceptedHandoffs[0]?.privateReview?.finalRenderSha256 ?? '', /^[a-f0-9]{64}$/i, 'Revised private pass should persist a final render sha256.')
  assert.notEqual(revisedAcceptedHandoffs[0]?.privateReview?.finalRenderArtifactId, revisionHandoffs[0]?.privateReview?.finalRenderArtifactId, 'Revised private pass must not reuse the previous private review final-render artifact id.')
  assert.equal(revisedAcceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.finalRenderArtifactId, revisedAcceptedHandoffs[0]?.privateReview?.finalRenderArtifactId)
  assert.equal(revisedAcceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceOrderPreserved, true)
  assert.equal(revisedAcceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceStorageIdentityCoverageComplete, true)
  assert.equal(revisedAcceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.playable, true)
  assert.equal(revisedAcceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.width, revisedAcceptedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.width)
  assert.equal(revisedAcceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.height, revisedAcceptedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.height)
  assert.ok(
    Math.abs((revisedAcceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.durationSeconds ?? 0) - (revisedAcceptedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata?.durationSeconds ?? 0)) <= 0.5,
    'Revised browser metadata duration should match the final-render artifact duration.',
  )
	  assert.ok((revisedAcceptedHandoffs[0]?.privateReview?.reviewVideoMetadata?.durationSeconds ?? 0) > 0, 'Revised private pass should preserve browser-playable review video duration.')
	  assert.equal(revisedAcceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.privateInternalQaReady, true)
	  assert.equal(revisedAcceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.sourceAudioQaAttached, true)
	  assert.ok((revisedAcceptedHandoffs[0]?.privateReview?.professionalEditQaSummary?.sourceAudioQaReviewCount ?? 0) > 0, 'Revised private pass should preserve uploaded-source audio QA review count.')
  const backendCompletedState = await waitForInternalEditStateStage(
    apiBaseUrl,
    revisedAcceptedHandoffs[0]?.projectId ?? '',
    verifiedToken,
    'internal_edit_complete',
  )
  assert.equal(backendCompletedState?.privateReview?.manifestVerified, true, 'Backend internal edit state should preserve final private review manifest verification.')
  assert.equal(
    backendCompletedState?.privateReview?.editDecisionManifestVerification?.sourceStorageIdentityCoverageComplete,
    true,
    'Backend completed state should preserve source storage identity verification.',
  )
  assert.equal(
    backendCompletedState?.privateReview?.editDecisionManifestVerification?.finalRenderArtifactId,
    revisedAcceptedHandoffs[0]?.privateReview?.finalRenderArtifactId,
    'Backend completed state should preserve the manifest verification final-render artifact id.',
  )
  assert.equal(backendCompletedState?.projectId, revisedAcceptedHandoffs[0]?.projectId, 'Backend completed state should preserve the revised project id.')
  assert.equal(backendCompletedState?.projectName, revisedAcceptedHandoffs[0]?.projectName, 'Backend completed state should preserve the revised project name.')
  assert.equal(backendCompletedState?.editorPath, revisedAcceptedHandoffs[0]?.editorPath, 'Backend completed state should preserve the revised editor route.')
  assert.equal(backendCompletedState?.approvedSnapshotId, revisedAcceptedHandoffs[0]?.approvedSnapshotId, 'Backend completed state should preserve the revised approved snapshot id.')
  assertPrivateSourceStorageBucketsPreserved(backendCompletedState?.sourceMediaAssets, 'Backend completed internal edit state')
  assertUploadedSourceMetadataPreserved(backendCompletedState?.sourceMediaAssets, 'Backend completed internal edit state', ['176x100'])
  assert.equal(backendCompletedState?.privateReview?.reviewDecision, 'accepted_for_internal_testing')
  assert.equal(backendCompletedState?.privateReview?.finalRenderArtifactId, revisedAcceptedHandoffs[0]?.privateReview?.finalRenderArtifactId, 'Backend completed state should preserve the revised final render artifact id.')
  assert.equal(backendCompletedState?.privateReview?.finalRenderSha256, revisedAcceptedHandoffs[0]?.privateReview?.finalRenderSha256, 'Backend completed state should preserve the revised final render sha256.')
  assert.equal(backendCompletedState?.privateReview?.privateInternalDownloadPath, revisedAcceptedHandoffs[0]?.privateReview?.privateInternalDownloadPath, 'Backend completed state should preserve the revised private download route.')
  assert.equal(backendCompletedState?.privateReview?.privateInternalManifestPath, revisedAcceptedHandoffs[0]?.privateReview?.privateInternalManifestPath, 'Backend completed state should preserve the revised private manifest route.')
  const backendCompletedListState = await waitForInternalEditStateListStage(
    apiBaseUrl,
    verifiedToken,
    revisedAcceptedHandoffs[0]?.projectId ?? '',
    revisedAcceptedHandoffs[0]?.editSessionId ?? '',
    'internal_edit_complete',
  )
  assert.equal(backendCompletedListState?.privateReview?.manifestVerified, true, 'Backend internal edit state list should preserve completed edit manifest verification before browser recovery.')
  clearInternalEditStateMemoryForSmoke()
  clearApprovedEditExecutionPrivateDownloadMemoryForSmoke()
  await page.evaluate((storageKey) => window.localStorage.removeItem(storageKey), getLocalProjectHandoffStorageKey())
  const directRecoveredEditorUrl = new URL(revisedAcceptedHandoffs[0]?.editorPath ?? '/editor', viteUrl).toString()
  await page.goto(directRecoveredEditorUrl)
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: editorBootTimeoutMs })
  await expect(page.getByText(/Restored edit state: the review edit is complete/i)).toBeVisible({ timeout: 12_000 })
  await expect(page.getByTestId('private-internal-test-run-card')).toBeVisible()
  const directRecoveredHandoffs = await page.evaluate((storageKey) => {
    return ((JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as { handoffs?: unknown[] }).handoffs ?? []) as Array<{
      projectId?: string
      editorPath?: string
      approvedSnapshotId?: string
      stage?: string
      sourceMediaAssets?: SmokeSourceMediaAsset[]
      privateReview?: {
        finalRenderArtifactId?: string
        finalRenderSha256?: string
        privateInternalDownloadPath?: string
        privateInternalManifestPath?: string
        editDecisionManifestVerification?: {
          finalRenderArtifactId?: string
          sourceStorageIdentityCoverageComplete?: boolean
        }
      }
    }>
  }, getLocalProjectHandoffStorageKey())
  assert.equal(directRecoveredHandoffs[0]?.projectId, revisedAcceptedHandoffs[0]?.projectId, 'Direct recovered edit should preserve the revised project id.')
  assert.equal(directRecoveredHandoffs[0]?.editorPath, revisedAcceptedHandoffs[0]?.editorPath, 'Direct recovered edit should preserve the revised editor route.')
  assert.equal(directRecoveredHandoffs[0]?.approvedSnapshotId, revisedAcceptedHandoffs[0]?.approvedSnapshotId, 'Direct recovered edit should preserve the revised approved snapshot id.')
  assert.equal(directRecoveredHandoffs[0]?.stage, 'internal_edit_complete', 'Direct recovered edit should preserve complete state.')
  assert.equal(directRecoveredHandoffs[0]?.privateReview?.finalRenderArtifactId, revisedAcceptedHandoffs[0]?.privateReview?.finalRenderArtifactId, 'Direct recovered edit should preserve the revised final render artifact id.')
  assert.equal(directRecoveredHandoffs[0]?.privateReview?.finalRenderSha256, revisedAcceptedHandoffs[0]?.privateReview?.finalRenderSha256, 'Direct recovered edit should preserve the revised final render sha256.')
  assert.equal(directRecoveredHandoffs[0]?.privateReview?.privateInternalDownloadPath, revisedAcceptedHandoffs[0]?.privateReview?.privateInternalDownloadPath, 'Direct recovered edit should preserve the revised private download route.')
  assert.equal(directRecoveredHandoffs[0]?.privateReview?.privateInternalManifestPath, revisedAcceptedHandoffs[0]?.privateReview?.privateInternalManifestPath, 'Direct recovered edit should preserve the revised private manifest route.')
  assert.equal(
    directRecoveredHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceStorageIdentityCoverageComplete,
    true,
    'Direct recovered edit should preserve source storage identity verification.',
  )
  assert.equal(
    directRecoveredHandoffs[0]?.privateReview?.editDecisionManifestVerification?.finalRenderArtifactId,
    revisedAcceptedHandoffs[0]?.privateReview?.finalRenderArtifactId,
    'Direct recovered edit should preserve the manifest verification final-render artifact id.',
  )
  assertPrivateSourceStorageBucketsPreserved(directRecoveredHandoffs[0]?.sourceMediaAssets, 'Direct recovered edit handoff')
  assertUploadedSourceMetadataPreserved(directRecoveredHandoffs[0]?.sourceMediaAssets, 'Direct recovered edit handoff', ['176x100'])
  await clickWhenReady(page.getByRole('button', { name: /Load review video/i }))
  await expect(page.getByTestId('private-internal-review-video')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByTestId('private-internal-test-run-card')).toContainText(/Review QA record verified/i)
  const [directRecoveredDownload] = await Promise.all([
    page.waitForEvent('download'),
    clickWhenReady(page.getByRole('button', { name: /Download MP4/i })),
  ])
  assert.match(directRecoveredDownload.suggestedFilename(), /\.mp4$/i, 'Direct recovered accepted edit download should suggest an MP4 filename.')
  const directRecoveredDownloadPath = await directRecoveredDownload.path()
  assert.ok(directRecoveredDownloadPath, 'Direct recovered accepted edit download should resolve to a local file path.')
  const directRecoveredDownloadBytes = await readFile(directRecoveredDownloadPath)
  assert.ok(directRecoveredDownloadBytes.byteLength > 0, 'Direct recovered accepted edit download should save non-empty MP4 bytes.')
  const directRecoveredDownloadSha256 = sha256Hex(directRecoveredDownloadBytes)
  const directRecoveredDownloadMediaProbe = await probeMedia(directRecoveredDownloadPath)
  assertRenderedDownloadIsNotSourcePassthrough(
    directRecoveredDownloadSha256,
    directRecoveredDownloadMediaProbe,
    [{ label: 'revision browser-uploaded source', sha256: secondSourceSha256, width: secondSourceFixture.width, height: secondSourceFixture.height }],
    'Direct recovered accepted edit download',
  )
  const directRecoveredVisualSamples = await assertRenderedVisualSourceOrder(
    directRecoveredDownloadPath,
    directRecoveredDownloadMediaProbe,
    ['blue'],
    'Direct recovered accepted edit download',
  )
  assert.equal(directRecoveredDownloadMediaProbe.hasAudio, true, 'Direct recovered accepted edit download should include the uploaded-source audio stream.')
  assert.equal(directRecoveredDownloadSha256, revisedAcceptedHandoffs[0]?.privateReview?.finalRenderSha256, 'Direct recovered accepted edit download bytes should match the recorded final-render sha256.')
  assertDownloadedReviewMediaMatchesExpected(directRecoveredDownloadMediaProbe, revisedAcceptedHandoffs[0]?.privateReview?.expectedReviewVideoMetadata, 'Direct recovered accepted edit download')
  await assertPrivateReviewRoutesRejectAnonymousAccess(
    apiBaseUrl,
    revisedAcceptedHandoffs[0]?.privateReview?.privateInternalDownloadPath,
    revisedAcceptedHandoffs[0]?.privateReview?.privateInternalManifestPath,
    'Direct recovered accepted edit',
  )
  await assertPrivateReviewRoutesUseNoStoreCache(
    apiBaseUrl,
    revisedAcceptedHandoffs[0]?.privateReview?.privateInternalDownloadPath,
    revisedAcceptedHandoffs[0]?.privateReview?.privateInternalManifestPath,
    verifiedToken,
    'Direct recovered accepted edit',
  )
  const directRecoveredPrivateManifest = await fetchPrivateEditDecisionManifest(
    apiBaseUrl,
    revisedAcceptedHandoffs[0]?.privateReview?.privateInternalManifestPath,
    verifiedToken,
    'Direct recovered accepted edit',
  )
  assertDownloadedPrivateManifestMatchesHandoff(directRecoveredPrivateManifest.manifest, revisedAcceptedHandoffs[0], 'Direct recovered accepted edit')
  const directRecoveredManifestTimelineVisualSamples = await assertManifestTimelineMatchesDownloadedVisuals(
    directRecoveredDownloadPath,
    directRecoveredPrivateManifest.manifest,
    { 1: 'blue' },
    'Direct recovered accepted edit',
  )
  const directRecoveredManifestOverlaySamples = await assertManifestTimelineBurnsApprovedOverlayBand(
    directRecoveredDownloadPath,
    directRecoveredPrivateManifest.manifest,
    'Direct recovered accepted edit',
  )
  const directRecoveredManifestOverlayTextSamples = await assertManifestTimelineBurnsApprovedOverlayText(
    directRecoveredDownloadPath,
    directRecoveredPrivateManifest.manifest,
    'Direct recovered accepted edit',
  )
  const directRecoveredManifestTransitionFadeSamples = await assertManifestTimelineBurnsApprovedTransitionPolish(
    directRecoveredDownloadPath,
    directRecoveredPrivateManifest.manifest,
    'Direct recovered accepted edit',
  )
  const directRecoveredManifestAudioToneSamples = await assertManifestTimelinePreservesUploadedSourceAudioTone(
    directRecoveredDownloadPath,
    directRecoveredPrivateManifest.manifest,
    { 1: true },
    'Direct recovered accepted edit',
  )
  const directRecoveredPrivateReviewMeanVolumeDb = await probeAudioMeanVolume(directRecoveredDownloadPath)
  assert.ok(
    directRecoveredPrivateReviewMeanVolumeDb > -70,
    `Recovered accepted edit download should preserve audible uploaded-source audio, got ${directRecoveredPrivateReviewMeanVolumeDb} dB.`,
  )
  const directRecoveredPrivateReviewAudioTone = await probeAudioTone(directRecoveredDownloadPath)
  assertSourceAudioTone(directRecoveredPrivateReviewAudioTone, 'Recovered accepted edit download')
  await page.evaluate((storageKey) => window.localStorage.removeItem(storageKey), getLocalProjectHandoffStorageKey())
  await page.goto(`${viteUrl}projects`)
  const recoveredFromBackendCard = page.locator('.projects-card').filter({ hasText: 'Internal revision request smoke' })
  await expect(recoveredFromBackendCard).toBeVisible({ timeout: 10_000 })
  await expect(recoveredFromBackendCard).toContainText('Edit complete')
  await expect(recoveredFromBackendCard).toContainText(/Internal review is complete\. Public release remains gated\./i)

  workspaceMemberships.delete('workspace-internal-testing\u0000supabase-user-browser-full-stack')
  const revokedProjectReadback = await fetchProjectReadback(apiBaseUrl, handoffs[0]?.projectId ?? '', verifiedToken)
  assert.equal(revokedProjectReadback.status, 403, 'Revoked workspace membership must block project readback immediately.')
  const revokedProjectList = await fetchProjectListReadback(apiBaseUrl, verifiedToken)
  assert.equal(revokedProjectList.status, 403, 'Revoked workspace membership must block project listing immediately.')
  const revokedInternalEditStateReadback = await fetchInternalEditStateReadback(apiBaseUrl, handoffs[0]?.projectId ?? '', verifiedToken)
  assert.equal(revokedInternalEditStateReadback.status, 403, 'Revoked workspace membership must block internal edit state readback immediately.')
  const revokedInternalEditStateList = await fetchInternalEditStateListReadback(apiBaseUrl, verifiedToken)
  assert.equal(revokedInternalEditStateList.status, 403, 'Revoked workspace membership must block internal edit state listing immediately.')

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'vite_frontend_configured_for_frontend_safe_backend',
      'browser_full_stack_backend_calls_authenticated_with_supabase_bearer_token',
      'browser_full_stack_internal_test_flow_avoids_supabase_admin_persistence',
      'project_create_page_created_backend_project_identity_before_editor_handoff',
      'backend_project_registry_survives_cleared_in_memory_project_map',
      'backend_project_readback_rejects_cross_user_access',
      'backend_project_list_isolates_workspace_members_by_local_internal_test_owner',
      'backend_internal_edit_state_saved_for_created_handoff',
      'backend_internal_edit_state_readback_rejects_cross_user_access',
      'backend_internal_edit_state_list_isolates_workspace_members_by_local_internal_test_owner',
      'backend_internal_edit_state_save_rejects_cross_user_overwrite',
      'backend_internal_edit_state_save_requires_owned_project_record',
      'project_create_page_handoff_opened_editor_with_project_identity',
      'local_internal_project_record_persisted_for_testing',
      'new_project_handoff_starts_without_executable_demo_source_assets',
      'new_project_source_sequence_card_starts_empty_and_uploadable',
      'project_handoff_hides_demo_scenario_controls',
      'projects_page_reopened_local_internal_edit',
      'browser_uploaded_two_real_synthetic_mp4s_through_backend_intent',
      'browser_upload_created_private_source_assets_before_approval',
      'browser_upload_promoted_two_local_probe_metadata_records_to_source_sequence',
      'approved_plan_created_private_internal_test_run',
      'private_review_card_shows_professional_edit_decision_trace',
      'interrupted_plan_approved_recovery_resumes_private_review_run',
      'private_review_download_loaded_as_blob_video',
      'private_review_download_verified_multi_source_edit_trace_manifest',
      'private_review_download_matches_recorded_final_render_sha',
      'private_review_download_matches_expected_media_metadata',
      'private_review_download_is_new_render_not_source_passthrough',
      'private_review_download_preserves_visual_source_order',
      'private_review_manifest_route_streams_professional_edit_trace',
      'private_review_manifest_timeline_matches_downloaded_visual_frames',
      'private_review_manifest_timeline_burns_approved_overlay_band',
      'private_review_manifest_timeline_burns_approved_overlay_text',
      'private_review_manifest_timeline_burns_approved_transition_polish',
      'private_review_download_preserves_uploaded_source_audio',
      'private_review_download_preserves_uploaded_source_audio_tone',
      'private_review_manifest_timeline_preserves_uploaded_source_audio_tone',
      'download_mp4_action_enabled_after_private_fetch',
      'private_review_download_saves_mp4_bytes',
      'private_review_download_routes_reject_anonymous_access',
      'private_review_download_routes_disable_browser_cache',
      'private_review_download_routes_use_private_delivery_headers',
      'local_internal_project_record_updated_to_private_review_verified',
      'private_review_acceptance_recorded_against_server_edit_trace',
      'private_final_qa_evidence_persisted_in_local_handoff',
      'accepted_private_review_identity_persisted_to_backend_state',
      'projects_page_reflects_internal_edit_complete_state',
      'projects_page_reopens_exact_accepted_edit_identity',
      'editor_reopens_internal_edit_complete_state',
      'editor_reloads_private_review_file_after_reopen',
      'source_change_invalidates_previous_private_review_and_snapshot',
      'stale_private_review_trace_is_discarded_after_source_change',
      'private_review_revision_request_requires_note',
      'private_review_revision_request_recorded_against_server_edit_trace',
      'private_review_revision_note_created_edit_map_revision_request',
      'private_review_revision_request_completed_to_mock_preview',
      'projects_page_reflects_revision_preview_ready_state',
      'editor_reopens_revision_preview_ready_state',
      'revision_preview_runs_revised_private_review_pass',
      'revision_private_review_download_loaded_as_blob_video',
      'revision_private_review_download_matches_recorded_final_render_sha',
      'revision_private_review_download_matches_expected_media_metadata',
      'revision_private_review_download_is_new_render_not_source_passthrough',
      'revision_private_review_download_preserves_uploaded_source_visual',
      'revision_private_review_manifest_route_streams_professional_edit_trace',
      'revision_private_review_manifest_timeline_matches_downloaded_visual_frames',
      'revision_private_review_manifest_timeline_burns_approved_overlay_band',
      'revision_private_review_manifest_timeline_burns_approved_overlay_text',
      'revision_private_review_manifest_timeline_burns_approved_transition_polish',
      'revision_private_review_download_preserves_uploaded_source_audio',
      'revision_private_review_download_preserves_uploaded_source_audio_tone',
      'revision_private_review_manifest_timeline_preserves_uploaded_source_audio_tone',
      'revision_private_review_download_saves_mp4_bytes',
      'revision_private_review_acceptance_completes_internal_edit',
      'revised_private_review_identity_persisted_to_backend_state',
      'server_memory_cleared_before_direct_final_edit_recovery',
      'direct_editor_recovery_loads_accepted_final_edit_after_browser_storage_clear',
      'direct_editor_recovery_preserves_exact_revised_edit_identity',
      'direct_editor_recovery_downloads_accepted_final_edit_mp4',
      'direct_editor_recovery_download_matches_recorded_final_render_sha',
      'direct_editor_recovery_download_matches_expected_media_metadata',
      'direct_editor_recovery_download_routes_reject_anonymous_access',
      'direct_editor_recovery_download_routes_disable_browser_cache',
      'direct_editor_recovery_download_routes_use_private_delivery_headers',
      'direct_editor_recovery_download_is_new_render_not_source_passthrough',
      'direct_editor_recovery_download_preserves_uploaded_source_visual',
      'direct_editor_recovery_manifest_route_survives_backend_memory_clear',
      'direct_editor_recovery_manifest_timeline_matches_downloaded_visual_frames',
      'direct_editor_recovery_manifest_timeline_burns_approved_overlay_band',
      'direct_editor_recovery_manifest_timeline_burns_approved_overlay_text',
      'direct_editor_recovery_manifest_timeline_burns_approved_transition_polish',
      'direct_editor_recovery_download_preserves_uploaded_source_audio',
      'direct_editor_recovery_download_preserves_uploaded_source_audio_tone',
      'direct_editor_recovery_manifest_timeline_preserves_uploaded_source_audio_tone',
      'backend_internal_edit_state_recovers_projects_page_after_browser_storage_clear',
      'revoked_workspace_membership_blocks_project_and_internal_edit_state_reads',
      'public_beta_production_and_billing_remain_blocked',
    ],
    apiBaseUrl,
    authVerificationCount,
    uploadedSourceFileCount: acceptedHandoffs[0]?.sourceFileCount,
    uploadedByteCount: sourceBytes.byteLength + secondSourceBytes.byteLength,
    secondSourceMeanVolumeDb,
    secondSourceAudioTone: formatAudioToneSample(secondSourceAudioTone),
    initialPrivateReviewMeanVolumeDb,
    revisionPrivateReviewMeanVolumeDb,
    directRecoveredPrivateReviewMeanVolumeDb,
    initialPrivateReviewAudioTone: formatAudioToneSample(initialPrivateReviewAudioTone),
    revisionPrivateReviewAudioTone: formatAudioToneSample(revisionPrivateReviewAudioTone),
    directRecoveredPrivateReviewAudioTone: formatAudioToneSample(directRecoveredPrivateReviewAudioTone),
    initialDownloadMatchesRecordedSha: initialDownloadSha256 === verifiedHandoffs[0]?.privateReview?.finalRenderSha256,
    revisionDownloadMatchesRecordedSha: revisionDownloadSha256 === revisionVerifiedHandoffs[0]?.privateReview?.finalRenderSha256,
    directRecoveredDownloadMatchesRecordedSha: directRecoveredDownloadSha256 === revisedAcceptedHandoffs[0]?.privateReview?.finalRenderSha256,
    initialDownloadRenderedFrame: `${initialDownloadMediaProbe.video?.width}x${initialDownloadMediaProbe.video?.height}`,
    revisionDownloadRenderedFrame: `${revisionDownloadMediaProbe.video?.width}x${revisionDownloadMediaProbe.video?.height}`,
    directRecoveredDownloadRenderedFrame: `${directRecoveredDownloadMediaProbe.video?.width}x${directRecoveredDownloadMediaProbe.video?.height}`,
    initialVisualSamples: initialVisualSamples.map(formatRgbSample),
    revisionVisualSamples: revisionVisualSamples.map(formatRgbSample),
    directRecoveredVisualSamples: directRecoveredVisualSamples.map(formatRgbSample),
    initialManifestTimelineVisualSamples: initialManifestTimelineVisualSamples.map(formatRgbSample),
    revisionManifestTimelineVisualSamples: revisionManifestTimelineVisualSamples.map(formatRgbSample),
    directRecoveredManifestTimelineVisualSamples: directRecoveredManifestTimelineVisualSamples.map(formatRgbSample),
    initialManifestOverlaySamples: initialManifestOverlaySamples.map(formatRgbSample),
    revisionManifestOverlaySamples: revisionManifestOverlaySamples.map(formatRgbSample),
    directRecoveredManifestOverlaySamples: directRecoveredManifestOverlaySamples.map(formatRgbSample),
    initialManifestOverlayTextSamples: initialManifestOverlayTextSamples.map(formatOverlayTextSample),
    revisionManifestOverlayTextSamples: revisionManifestOverlayTextSamples.map(formatOverlayTextSample),
    directRecoveredManifestOverlayTextSamples: directRecoveredManifestOverlayTextSamples.map(formatOverlayTextSample),
    initialManifestTransitionFadeSamples: initialManifestTransitionFadeSamples.map(formatTransitionFadeSample),
    revisionManifestTransitionFadeSamples: revisionManifestTransitionFadeSamples.map(formatTransitionFadeSample),
    directRecoveredManifestTransitionFadeSamples: directRecoveredManifestTransitionFadeSamples.map(formatTransitionFadeSample),
    initialManifestAudioToneSamples: initialManifestAudioToneSamples.map(formatAudioToneSample),
    revisionManifestAudioToneSamples: revisionManifestAudioToneSamples.map(formatAudioToneSample),
    directRecoveredManifestAudioToneSamples: directRecoveredManifestAudioToneSamples.map(formatAudioToneSample),
    initialManifestDecisionCount: initialPrivateManifest.manifest.decisions?.length,
    revisionManifestDecisionCount: revisionPrivateManifest.manifest.decisions?.length,
    directRecoveredManifestDecisionCount: directRecoveredPrivateManifest.manifest.decisions?.length,
    verifiedSourceMediaAssetCount: acceptedHandoffs[0]?.privateReview?.editDecisionManifestVerification?.sourceMediaAssetCount,
    privateVideoSrcScheme: videoSrc.split(':')[0],
  }))
  }
  }
  await assertCanonicalEditBriefMarkerLineage({
    projectId: handoffs[0]?.projectId ?? '',
    editSessionId: handoffs[0]?.editSessionId ?? '',
    markerId: approvedEditBriefMarkerId,
  })
  assert.equal(
    canonicalPrivateReviewAccepted,
    true,
    'The signed-in full-stack smoke must complete the canonical private review; a legacy or fail-closed fallback is not a passing result.',
  )
} finally {
  await browserContext?.close()
  await browser?.close()
  await viteServer?.close()
  await new Promise<void>((resolve, reject) => {
    apiServer.close((error) => (error ? reject(error) : resolve()))
  })
}

async function createCanonicalEditBriefMarkerBeforeBrief(
  page: Page,
  scope: { projectId: string; editSessionId: string },
): Promise<string> {
  const workspace = page.getByTestId('editor-edit-brief-canvas')
  const status = workspace.getByTestId('edit-brief-authority-status')
  await expect(status).toContainText('Saved', { timeout: 12_000 })
  await workspace.getByLabel('Timeline playhead').fill(
    String(approvedEditBriefMarker.startSeconds),
  )
  await clickWhenReady(workspace.getByTestId('edit-brief-add-direction'))

  const directionPopover = page.getByTestId('edit-brief-marker-popover')
  await expect(directionPopover).toBeVisible()
  await expect(directionPopover.getByLabel('What should happen here?')).toBeFocused()
  await clickWhenReady(directionPopover.locator('summary').filter({ hasText: 'More options' }))
  await directionPopover.getByLabel('Type').selectOption('caption')
  await directionPopover.getByLabel('Priority').selectOption('must_follow')
  await directionPopover.getByLabel('Short label (optional)').fill(approvedEditBriefMarker.title)
  await directionPopover
    .getByLabel('What should happen here?')
    .fill(approvedEditBriefMarker.note)

  const markerCreate = page.waitForResponse((response) => {
    const request = response.request()
    return request.method() === 'POST'
      && /\/edit-brief\/markers(?:\?|$)/.test(request.url())
  }, { timeout: 15_000 })
  await clickWhenReady(directionPopover.getByRole('button', { name: 'Add direction' }))
  const markerCreateResponse = await markerCreate
  assert.equal(
    markerCreateResponse.status(),
    201,
    `Marker-first Edit Brief creation should commit before an optional overall goal: ${await markerCreateResponse.text()}`,
  )
  await expect(status).toContainText('Saved', { timeout: 12_000 })
  await expect(workspace.getByRole('button', {
    name: new RegExp(approvedEditBriefMarker.title, 'i'),
  })).toBeVisible()

  const markerOnlyAuthority = await readPrivateEditBriefAuthorityAggregate({
    localStorageRoot,
    ownerUserId: 'supabase-user-browser-full-stack',
    workspaceId: 'workspace-internal-testing',
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
  })
  assert.ok(markerOnlyAuthority, 'Marker-first UI creation should create the canonical timeline authority.')
  assert.equal(
    markerOnlyAuthority.brief,
    undefined,
    'A timeline marker must persist without fabricating the optional overall Brief record.',
  )
  assert.equal(markerOnlyAuthority.markers.length, 1)
  assert.equal(markerOnlyAuthority.markers[0]?.title, approvedEditBriefMarker.title)
  assert.equal(markerOnlyAuthority.markers[0]?.note, approvedEditBriefMarker.note)
  assert.equal(markerOnlyAuthority.markers[0]?.startSeconds, approvedEditBriefMarker.startSeconds)
  assert.equal(markerOnlyAuthority.markers[0]?.status, 'draft')
  assert.equal(markerOnlyAuthority.markers[0]?.timingStatus, 'display_seconds_only')

  await assertOverlappingEditBriefMarkersStackAndArchive({
    page,
    scope,
    workspace,
    firstMarkerId: markerOnlyAuthority.markers[0]!.id,
  })
  return markerOnlyAuthority.markers[0]!.id
}

async function assertOverlappingEditBriefMarkersStackAndArchive(input: {
  page: Page
  scope: { projectId: string; editSessionId: string }
  workspace: Locator
  firstMarkerId: string
}): Promise<void> {
  const {
    page,
    scope,
    workspace,
    firstMarkerId,
  } = input
  const secondMarkerTitle = 'Supporting proof at the same moment'
  await clickWhenReady(workspace.getByTestId('edit-brief-add-direction'))
  const directionPopover = page.getByTestId('edit-brief-marker-popover')
  await expect(directionPopover).toBeVisible()
  await expect(directionPopover.getByLabel('What should happen here?')).toBeFocused()
  await clickWhenReady(directionPopover.locator('summary').filter({ hasText: 'More options' }))
  await directionPopover.getByLabel('Short label (optional)').fill(secondMarkerTitle)
  await directionPopover
    .getByLabel('What should happen here?')
    .fill('Keep this supporting instruction independently editable at the same source moment.')

  const markerCreate = page.waitForResponse((response) => {
    const request = response.request()
    return request.method() === 'POST'
      && /\/edit-brief\/markers(?:\?|$)/.test(request.url())
  }, { timeout: 15_000 })
  await clickWhenReady(directionPopover.getByRole('button', { name: 'Add direction' }))
  const markerCreateResponse = await markerCreate
  assert.equal(
    markerCreateResponse.status(),
    201,
    `A second same-time marker should commit without replacing the first: ${await markerCreateResponse.text()}`,
  )

  const markerButtons = workspace.locator('.professional-edit-brief__marker')
  await expect(markerButtons).toHaveCount(2)
  const laneBox = await workspace.getByTestId('edit-brief-marker-lane').boundingBox()
  const firstBox = await markerButtons.nth(0).boundingBox()
  const secondBox = await markerButtons.nth(1).boundingBox()
  assert.ok(laneBox && firstBox && secondBox, 'The marker lane and both same-time markers must be measurable.')
  assert.ok(
    Math.abs(firstBox.y - secondBox.y) >= 44,
    'Same-time Edit Brief markers must occupy separate non-overlapping rows.',
  )
  assert.ok(
    laneBox.height >= 132,
    'The marker lane must grow to keep multiple marker rows visible.',
  )

  const secondMarker = workspace.getByRole('button', {
    name: new RegExp(secondMarkerTitle, 'i'),
  })
  await clickWhenReady(secondMarker)
  await expect(directionPopover).toBeVisible()
  const markerArchive = page.waitForResponse((response) => {
    const request = response.request()
    return request.method() === 'POST'
      && /\/edit-brief\/markers\/[^/]+\/archive(?:\?|$)/.test(request.url())
  }, { timeout: 15_000 })
  await clickWhenReady(directionPopover.getByRole('button', { name: 'Archive' }))
  const markerArchiveResponse = await markerArchive
  assert.equal(
    markerArchiveResponse.status(),
    200,
    `The temporary overlapping-marker regression record should archive cleanly: ${await markerArchiveResponse.text()}`,
  )
  await expect(markerButtons).toHaveCount(1)

  const authorityAfterArchive = await readPrivateEditBriefAuthorityAggregate({
    localStorageRoot,
    ownerUserId: 'supabase-user-browser-full-stack',
    workspaceId: 'workspace-internal-testing',
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
  })
  assert.equal(authorityAfterArchive?.markers.length, 2)
  assert.equal(
    authorityAfterArchive?.markers.find((marker) => marker.title === secondMarkerTitle)?.status,
    'archived',
    'Archived overlapping-marker history must remain durable.',
  )
  await clickWhenReady(workspace.getByRole('button', {
    name: new RegExp(approvedEditBriefMarker.title, 'i'),
  }))
  assert.equal(
    authorityAfterArchive?.markers.find((marker) => marker.id === firstMarkerId)?.status,
    'draft',
    'The original marker must remain independently editable after the overlap regression.',
  )
}

async function confirmCanonicalEditBriefMarker(
  page: Page,
  input: { projectId: string; editSessionId: string; markerId: string },
): Promise<void> {
  const workspace = page.getByTestId('editor-edit-brief-canvas')
  const status = workspace.getByTestId('edit-brief-authority-status')
  const directionPopover = page.getByTestId('edit-brief-marker-popover')
  await expect(directionPopover).toBeVisible()
  const confirmButton = directionPopover.getByRole('button', { name: 'Confirm for plan' })
  // The overall Brief uses a 700 ms canonical autosave debounce. Let that
  // exact write settle before confirming the independently persisted marker.
  await page.waitForTimeout(900)
  await expect(status).toContainText('Saved', { timeout: 12_000 })
  await expect(confirmButton).toBeEnabled({ timeout: 12_000 })
  const popoverBounds = await directionPopover.boundingBox()
  const viewport = page.viewportSize()
  assert.ok(popoverBounds && viewport, 'The Edit Brief direction popup must be measurable.')
  assert.ok(
    popoverBounds.y >= 0 && popoverBounds.y + popoverBounds.height <= viewport.height,
    'The Edit Brief direction popup must remain inside the viewport after the user scrolls through Brief details.',
  )
  const [markerConfirmResponse] = await Promise.all([
    page.waitForResponse((response) => {
      const request = response.request()
      return request.method() === 'POST'
        && /\/edit-brief\/markers\/[^/]+\/confirm(?:\?|$)/.test(request.url())
    }, { timeout: 15_000 }),
    clickWhenReady(confirmButton),
  ])
  assert.equal(
    markerConfirmResponse.status(),
    200,
    `Confirmed marker should commit through the canonical named-edit route: ${await markerConfirmResponse.text()}`,
  )
  await expect(status).toContainText('Saved', { timeout: 12_000 })

  const confirmedAuthority = await readPrivateEditBriefAuthorityAggregate({
    localStorageRoot,
    ownerUserId: 'supabase-user-browser-full-stack',
    workspaceId: 'workspace-internal-testing',
    projectId: input.projectId,
    editSessionId: input.editSessionId,
  })
  const confirmedMarker = confirmedAuthority?.markers.find(
    (marker) => marker.id === input.markerId,
  )
  assert.ok(confirmedMarker, 'Confirmed marker should be recoverable from canonical persistence.')
  assert.equal(confirmedMarker.status, 'confirmed')
  assert.ok(confirmedMarker.confirmedAt)
}

async function assertCanonicalEditBriefMarkerLineage(input: {
  projectId: string
  editSessionId: string
  markerId: string
}): Promise<void> {
  const editBriefAuthority = await readPrivateEditBriefAuthorityAggregate({
    localStorageRoot,
    ownerUserId: 'supabase-user-browser-full-stack',
    workspaceId: 'workspace-internal-testing',
    projectId: input.projectId,
    editSessionId: input.editSessionId,
  })
  assert.ok(editBriefAuthority, 'Approved edit should retain its exact canonical Edit Brief authority.')
  const marker = editBriefAuthority.markers.find((entry) => entry.id === input.markerId)
  assert.ok(marker, 'Approved Edit Brief should retain its exact user-created timeline marker.')
  assert.equal(marker.status, 'confirmed')
  assert.equal(marker.title, approvedEditBriefMarker.title)
  assert.equal(marker.note, approvedEditBriefMarker.note)
  assert.equal(marker.startSeconds, approvedEditBriefMarker.startSeconds)
  assert.equal(marker.timingStatus, 'frame_authoritative')
  assert.equal(marker.frameRate, 30)
  assert.equal(marker.startFrame, 15)

  const contextPackage = [...editBriefAuthority.contextPackages]
    .reverse()
    .find((entry) => entry.markerId === marker.id && entry.markerRevision === marker.revision)
  assert.ok(contextPackage, 'Planning should bind the marker to one current source context package.')
  assert.equal(contextPackage.sourceAuthorityStatus, 'verified_canonical_source_manifest')
  assert.ok(contextPackage.sourceContext.sourceAssetIds.length > 0)
  const sourceCandidateHash = contextPackage.sourceContext.sourceCandidateHashSha256
  const sourceSequenceHash = contextPackage.sourceContext.sourceSequenceHashSha256
  assert.ok(sourceCandidateHash, 'Verified marker context should retain its source-candidate hash.')
  assert.ok(sourceSequenceHash, 'Verified marker context should retain its source-sequence hash.')
  assert.match(sourceCandidateHash, /^[a-f0-9]{64}$/)
  assert.match(sourceSequenceHash, /^[a-f0-9]{64}$/)

  const currentQa = editBriefAuthority.qaReports.at(-1)
  assert.ok(currentQa, 'Planning should retain deterministic marker QA evidence.')
  assert.equal(currentQa.status, 'passed')
  assert.deepEqual(currentQa.findings, [])

  const currentHints = [...editBriefAuthority.planHintPackages]
    .reverse()
    .find((entry) =>
      entry.readiness === 'ready_for_planning'
      && entry.confirmedMarkerHints.some((hint) => hint.markerId === marker.id)
    )
  assert.ok(currentHints, 'Planning should compile the confirmed marker into a current Plan Hint package.')
  const currentMarkerHint = currentHints.confirmedMarkerHints.find(
    (hint) => hint.markerId === marker.id,
  )
  assert.ok(currentMarkerHint)
  assert.equal(currentMarkerHint.instruction, approvedEditBriefMarker.note)
  assert.equal(currentMarkerHint.startFrame, marker.startFrame)
  assert.equal(currentHints.planInputQaStatus, 'passed')
  assert.equal(currentHints.runtimeTruth.plannerExecuted, false)
  assert.equal(currentHints.runtimeTruth.creditsReservedOrSpent, false)

  assert.equal(editBriefAuthority.lifecycle.phase, 'approved_snapshot')
  assert.equal(editBriefAuthority.lifecycle.mutable, false)
  assert.ok(
    editBriefAuthority.lifecycle.approvedSnapshotId,
    'Edit Brief lifecycle should lock to one immutable approved snapshot.',
  )

  const editAuthority = await readPrivateEditAuthorityAggregate({
    localStorageRoot,
    ownerUserId: 'supabase-user-browser-full-stack',
    workspaceId: 'workspace-internal-testing',
  })
  const snapshot = editAuthority?.snapshots.find(
    (entry) => entry.snapshotId === editBriefAuthority.lifecycle.approvedSnapshotId,
  )
  assert.ok(snapshot, 'The Edit Brief lifecycle should reference a real canonical approved snapshot.')
  assert.equal(snapshot.projectId, input.projectId)
  assert.equal(snapshot.editSessionId, input.editSessionId)
  const planningInputAuthorityRef = snapshot.componentRefs.planningInputAuthority
  assert.ok(
    planningInputAuthorityRef,
    'The immutable approved snapshot should include the content-addressed planning-input authority.',
  )
  const planningInputAuthority = resolvedPlanningInputAuthorityBindingSchema.parse(
    await readPrivateAuthorityJsonBlob({
      localStorageRoot,
      ref: planningInputAuthorityRef,
    }),
  )
  assert.equal(planningInputAuthority.workspaceId, 'workspace-internal-testing')
  assert.equal(planningInputAuthority.projectId, input.projectId)
  assert.equal(planningInputAuthority.editSessionId, input.editSessionId)
  assert.equal(planningInputAuthority.editBrief.status, 'bound')
  if (planningInputAuthority.editBrief.status !== 'bound') {
    assert.fail('The approved planning-input authority must bind the canonical Edit Brief.')
  }
  assert.equal(planningInputAuthority.editBrief.publicationBinding.qaStatus, 'passed')
  assert.equal(planningInputAuthority.editBrief.publicationBinding.hasApprovalBlockers, false)
  const snapshotMarkerHint = planningInputAuthority.editBrief.confirmedMarkerHints.find(
    (value) => value.markerId === marker.id,
  )
  assert.ok(
    snapshotMarkerHint,
    'The immutable planning-input component should preserve the exact confirmed marker hint.',
  )
  assert.equal(snapshotMarkerHint.instruction, approvedEditBriefMarker.note)
  assert.equal(snapshotMarkerHint.startFrame, marker.startFrame)
}

async function clickWhenReady(locator: Locator) {
  await locator.scrollIntoViewIfNeeded()
  await expect(locator).toBeVisible()
  await expect(locator).toBeEnabled()
  await locator.click()
}

async function openEditBriefWorkspace(page: Page) {
  const trigger = page.getByTestId('editor-header-edit-brief')
  await clickWhenReady(trigger)
  await expect(trigger).toHaveAttribute('aria-current', 'page')
  await expect(page).toHaveURL(/[?&]view=brief(?:&|$)/)
  await expect(page.getByTestId('editor-edit-brief-canvas')).toBeVisible()
  const directionDetails = page
    .getByTestId('editor-edit-brief-canvas')
    .getByTestId('edit-brief-direction-details')
  if (!(await directionDetails.evaluate((element) => element instanceof HTMLDetailsElement && element.open))) {
    await clickWhenReady(directionDetails.locator('summary'))
  }
  await expect(directionDetails).toHaveJSProperty('open', true)
}

async function openChatWorkspace(page: Page) {
  const trigger = page.getByTestId('edit-workspace-view-chat')
  await clickWhenReady(trigger)
  await expect(trigger).toHaveAttribute('aria-current', 'page')
  await expect(page).not.toHaveURL(/[?&]view=(?:brief|preferences)(?:&|$)/)
  await expect(page.getByTestId('editor-chat-canvas')).toBeVisible()
}

async function clickEditBriefReadyButton(page: Page) {
  const locator = page
    .getByTestId('editor-edit-brief-canvas')
    .getByTestId('edit-brief-mark-ready')
  const canonicalReadyWrite = page.waitForResponse((response) => {
    const request = response.request()
    return (request.method() === 'POST' || request.method() === 'PATCH')
      && request.url().includes('/edit-brief?')
      && (request.postData() ?? '').includes('"status":"ready"')
      && response.ok()
  }, { timeout: 15_000 })
  const targetState = await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
    const rect = element.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const hitTarget = document.elementFromPoint(x, y)
    return {
      enabled: !(element instanceof HTMLButtonElement) || !element.disabled,
      hitTested: Boolean(hitTarget && element.contains(hitTarget)),
    }
  })
  assert.equal(targetState.enabled, true, 'The Edit Brief plan action must be enabled before activation.')
  assert.equal(
    targetState.hitTested,
    true,
    'The Edit Brief plan action must own its visible interactive target before activation.',
  )
  await locator.focus()
  await expect(locator).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(locator).toBeDisabled()
  await canonicalReadyWrite
  await expect(
    page
      .getByTestId('editor-edit-brief-canvas')
      .getByTestId('edit-brief-authority-status'),
  ).toContainText('Saved')
}

async function waitForCanonicalBriefPlanAction(page: Page) {
  await expect(
    page.getByRole('button', { name: /Create edit plan/i }).first(),
    'The exact Edit Brief fields and timeline authority must finish saving before plan creation.',
  ).toBeEnabled({ timeout: 15_000 })
}

function countCanonicalBriefWrites(responses: string[]): number {
  return responses.filter((entry) =>
    entry.includes('PATCH ')
    && entry.includes('/edit-brief?'),
  ).length
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

async function probeMedia(localFilePath: string): Promise<{
  video?: { width: number; height: number; durationSeconds?: number }
  hasAudio: boolean
}> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_streams',
    localFilePath,
  ], {
    timeout: 15_000,
    windowsHide: true,
    maxBuffer: 512 * 1024,
  })
  const parsed = JSON.parse(stdout) as {
    streams?: Array<{ codec_type?: string; width?: number; height?: number; duration?: string | number }>
  }
  const video = parsed.streams?.find((stream) => stream.codec_type === 'video')
  const durationSeconds = Number(video?.duration)
  return {
    video: video && typeof video.width === 'number' && typeof video.height === 'number'
      ? {
          width: video.width,
          height: video.height,
          durationSeconds: Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : undefined,
        }
      : undefined,
    hasAudio: Boolean(parsed.streams?.some((stream) => stream.codec_type === 'audio')),
  }
}

function assertDownloadedReviewMediaMatchesExpected(
  probe: { video?: { width: number; height: number; durationSeconds?: number }; hasAudio: boolean },
  expected: { durationSeconds?: number; width?: number; height?: number } | undefined,
  label: string,
) {
  assert.ok(expected, `${label} should have expected final-render metadata.`)
  assert.equal(probe.video?.width, expected.width, `${label} width should match expected final-render metadata.`)
  assert.equal(probe.video?.height, expected.height, `${label} height should match expected final-render metadata.`)
  assert.ok((probe.video?.durationSeconds ?? 0) > 0, `${label} should have a positive probed duration.`)
  assert.ok(
    Math.abs((probe.video?.durationSeconds ?? 0) - (expected.durationSeconds ?? 0)) <= 0.5,
    `${label} duration should match expected final-render metadata.`,
  )
}

function assertRenderedDownloadIsNotSourcePassthrough(
  downloadSha256: string,
  probe: { video?: { width: number; height: number; durationSeconds?: number }; hasAudio: boolean },
  sourceArtifacts: Array<{ label: string; sha256?: string; width?: number; height?: number }>,
  label: string,
) {
  assert.match(downloadSha256, /^[a-f0-9]{64}$/i, `${label} should have a valid sha256.`)
  assert.ok(probe.video, `${label} should have a video stream.`)
  for (const source of sourceArtifacts) {
    assert.notEqual(downloadSha256, source.sha256, `${label} must be a rendered edit artifact, not the original ${source.label} bytes.`)
    assert.notDeepEqual(
      { width: probe.video?.width, height: probe.video?.height },
      { width: source.width, height: source.height },
      `${label} should use the planned output frame, not the exact ${source.label} source frame.`,
    )
  }
}

type DominantSourceColor = 'red' | 'blue' | 'green'
type RgbSample = { red: number; green: number; blue: number; timestampSeconds: number }
type TransitionFadeSample = {
  decisionIndex: number
  phase: 'fade_in' | 'fade_out'
  fadeSeconds: number
  fadeSample: RgbSample
  referenceSample: RgbSample
  fadeMaxChannel: number
  referenceMaxChannel: number
}
type AudioToneSample = {
  targetFrequencyHz: number
  targetPower: number
  strongestControlFrequencyHz: number
  strongestControlPower: number
  targetToControlRatio: number
  rms: number
  sampleCount: number
  durationSeconds: number
}
type OverlayTextPixelSample = {
  timestampSeconds: number
  brightPixelCount: number
  sampledPixelCount: number
  brightPixelRatio: number
  maxRed: number
  maxGreen: number
  maxBlue: number
}

async function assertRenderedVisualSourceOrder(
  localFilePath: string,
  probe: { video?: { width: number; height: number; durationSeconds?: number }; hasAudio: boolean },
  expectedColors: DominantSourceColor[],
  label: string,
): Promise<RgbSample[]> {
  const durationSeconds = probe.video?.durationSeconds
  assert.ok(durationSeconds && durationSeconds > 0, `${label} should expose a video duration for source-order sampling.`)
  const samples: RgbSample[] = []
  for (let index = 0; index < expectedColors.length; index += 1) {
    const timestampSeconds = sourceOrderSampleTimestamp(durationSeconds, expectedColors.length, index)
    const sample = await sampleCenterFrameColor(localFilePath, timestampSeconds)
    assertDominantSourceColor(sample, expectedColors[index], `${label} visual source sample ${index + 1}`)
    samples.push(sample)
  }
  return samples
}

function sourceOrderSampleTimestamp(durationSeconds: number, expectedColorCount: number, index: number): number {
  const leadingClipWindowSeconds = Math.min(3, Math.max(0.5, durationSeconds / Math.max(expectedColorCount, 1)))
  const sampleOffsetSeconds = Math.min(0.75, Math.max(0.15, leadingClipWindowSeconds / 2))
  const leadingTimestamp = index * leadingClipWindowSeconds + sampleOffsetSeconds
  const lowerBound = Math.min(0.25, Math.max(0.05, durationSeconds / 4))
  const upperBound = Math.max(lowerBound, durationSeconds - lowerBound)
  return Number(Math.min(upperBound, Math.max(lowerBound, leadingTimestamp)).toFixed(3))
}

async function sampleCenterFrameColor(localFilePath: string, timestampSeconds: number): Promise<RgbSample> {
  const result = await execFileAsync('ffmpeg', [
    '-v',
    'error',
    '-i',
    localFilePath,
    '-ss',
    String(timestampSeconds),
    '-frames:v',
    '1',
    '-vf',
    'crop=iw*0.44:ih*0.24:iw*0.28:ih*0.38,scale=1:1:flags=area',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgb24',
    'pipe:1',
  ], {
    timeout: 15_000,
    windowsHide: true,
    encoding: 'buffer',
    maxBuffer: 64 * 1024,
  }) as { stdout: Buffer | string }
  const buffer = Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout, 'binary')
  assert.ok(buffer.byteLength >= 3, `Unable to sample frame color at ${timestampSeconds}s from ${localFilePath}.`)
  return {
    red: buffer[0] ?? 0,
    green: buffer[1] ?? 0,
    blue: buffer[2] ?? 0,
    timestampSeconds,
  }
}

async function sampleOverlayBandColor(localFilePath: string, timestampSeconds: number): Promise<RgbSample> {
  const result = await execFileAsync('ffmpeg', [
    '-v',
    'error',
    '-i',
    localFilePath,
    '-ss',
    String(timestampSeconds),
    '-frames:v',
    '1',
    '-vf',
    'crop=iw*0.42:ih*0.08:iw*0.30:ih*0.88,scale=1:1:flags=area',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgb24',
    'pipe:1',
  ], {
    timeout: 15_000,
    windowsHide: true,
    encoding: 'buffer',
    maxBuffer: 64 * 1024,
  }) as { stdout: Buffer | string }
  const buffer = Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout, 'binary')
  assert.ok(buffer.byteLength >= 3, `Unable to sample overlay band color at ${timestampSeconds}s from ${localFilePath}.`)
  return {
    red: buffer[0] ?? 0,
    green: buffer[1] ?? 0,
    blue: buffer[2] ?? 0,
    timestampSeconds,
  }
}

async function sampleOverlayTextPixels(localFilePath: string, timestampSeconds: number): Promise<OverlayTextPixelSample> {
  const result = await execFileAsync('ffmpeg', [
    '-v',
    'error',
    '-i',
    localFilePath,
    '-ss',
    String(timestampSeconds),
    '-frames:v',
    '1',
    '-vf',
    'crop=iw*0.76:ih*0.13:iw*0.10:ih*0.84',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgb24',
    'pipe:1',
  ], {
    timeout: 15_000,
    windowsHide: true,
    encoding: 'buffer',
    maxBuffer: 2 * 1024 * 1024,
  }) as { stdout: Buffer | string }
  const buffer = Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout, 'binary')
  assert.ok(buffer.byteLength >= 3, `Unable to sample overlay text pixels at ${timestampSeconds}s from ${localFilePath}.`)

  let brightPixelCount = 0
  let maxRed = 0
  let maxGreen = 0
  let maxBlue = 0
  for (let offset = 0; offset + 2 < buffer.byteLength; offset += 3) {
    const red = buffer[offset] ?? 0
    const green = buffer[offset + 1] ?? 0
    const blue = buffer[offset + 2] ?? 0
    maxRed = Math.max(maxRed, red)
    maxGreen = Math.max(maxGreen, green)
    maxBlue = Math.max(maxBlue, blue)
    if (red >= 120 && green >= 135 && blue >= 145) brightPixelCount += 1
  }
  const sampledPixelCount = Math.floor(buffer.byteLength / 3)
  return {
    timestampSeconds,
    brightPixelCount,
    sampledPixelCount,
    brightPixelRatio: sampledPixelCount > 0 ? brightPixelCount / sampledPixelCount : 0,
    maxRed,
    maxGreen,
    maxBlue,
  }
}

function assertDominantSourceColor(sample: RgbSample, expectedColor: DominantSourceColor, label: string) {
  const channels = [
    ['red', sample.red],
    ['green', sample.green],
    ['blue', sample.blue],
  ] as const
  const sorted = [...channels].sort((a, b) => b[1] - a[1])
  const [dominantName, dominantValue] = sorted[0]
  const [, nextValue] = sorted[1]
  assert.equal(dominantName, expectedColor, `${label} should be dominated by the ${expectedColor} uploaded source, got ${formatRgbSample(sample)}.`)
  assert.ok(dominantValue >= 45, `${label} should have visible ${expectedColor} source pixels, got ${formatRgbSample(sample)}.`)
  assert.ok(
    dominantValue - nextValue >= 35,
    `${label} should preserve distinct ${expectedColor} source identity, got ${formatRgbSample(sample)}.`,
  )
}

function assertApprovedOverlayBandColor(sample: RgbSample, label: string) {
  assert.ok(sample.red <= 45, `${label} should have the dark approved overlay band burned in, got ${formatRgbSample(sample)}.`)
  assert.ok(sample.green <= 50, `${label} should have the dark approved overlay band burned in, got ${formatRgbSample(sample)}.`)
  assert.ok(sample.blue <= 70, `${label} should have the dark approved overlay band burned in, got ${formatRgbSample(sample)}.`)
  assert.ok(
    sample.blue >= sample.red && sample.blue >= sample.green,
    `${label} overlay band should keep the approved blue-black review tone, got ${formatRgbSample(sample)}.`,
  )
}

function assertApprovedOverlayTextPixels(sample: OverlayTextPixelSample, label: string) {
  assert.ok(sample.brightPixelCount >= 12, `${label} should have approved overlay/caption text pixels burned in, got ${formatOverlayTextSample(sample)}.`)
  assert.ok(sample.maxGreen >= 150, `${label} should include bright text green-channel pixels, got ${formatOverlayTextSample(sample)}.`)
  assert.ok(sample.maxBlue >= 160, `${label} should include bright text blue-channel pixels, got ${formatOverlayTextSample(sample)}.`)
}

function assertApprovedTransitionFadeSample(sample: TransitionFadeSample, label: string) {
  assert.ok(
    sample.referenceMaxChannel >= 80,
    `${label} should compare against a visible source frame, got reference=${formatRgbSample(sample.referenceSample)}.`,
  )
  assert.ok(
    sample.fadeMaxChannel <= Math.max(50, sample.referenceMaxChannel * 0.72),
    `${label} should darken the exported frame during ${sample.phase}, got fade=${formatRgbSample(sample.fadeSample)} reference=${formatRgbSample(sample.referenceSample)}.`,
  )
  assert.ok(
    sample.referenceMaxChannel - sample.fadeMaxChannel >= 35,
    `${label} should visibly reduce source brightness during ${sample.phase}, got fade=${formatRgbSample(sample.fadeSample)} reference=${formatRgbSample(sample.referenceSample)}.`,
  )
}

function formatRgbSample(sample: RgbSample): string {
  return `${sample.timestampSeconds}s rgb(${sample.red},${sample.green},${sample.blue})`
}

function formatAudioToneSample(sample: AudioToneSample): string {
  return `${sample.durationSeconds.toFixed(3)}s samples=${sample.sampleCount} rms=${sample.rms.toFixed(5)} ${sample.targetFrequencyHz}HzPower=${sample.targetPower.toExponential(4)} control=${sample.strongestControlFrequencyHz}Hz:${sample.strongestControlPower.toExponential(4)} ratio=${sample.targetToControlRatio.toFixed(2)}`
}

function formatOverlayTextSample(sample: OverlayTextPixelSample): string {
  return `${sample.timestampSeconds}s bright=${sample.brightPixelCount}/${sample.sampledPixelCount} ratio=${sample.brightPixelRatio.toFixed(5)} max=rgb(${sample.maxRed},${sample.maxGreen},${sample.maxBlue})`
}

function formatTransitionFadeSample(sample: TransitionFadeSample): string {
  return `decision=${sample.decisionIndex} ${sample.phase} fade=${sample.fadeSeconds}s fadeMax=${sample.fadeMaxChannel} referenceMax=${sample.referenceMaxChannel} fade=${formatRgbSample(sample.fadeSample)} reference=${formatRgbSample(sample.referenceSample)}`
}

type PrivateEditDecisionManifestForSmoke = {
  manifestVersion?: string
  finalRenderArtifactId?: string
  approvedEditContext?: {
    projectId?: string
    editSessionId?: string
    goalSummary?: string
    creditEstimateTotalCredits?: number
  }
  uploadedSourceOrderTrace?: {
    sourceOrderPreserved?: boolean
    sourceMediaAssetIds?: string[]
    uploadedOrders?: number[]
    sourceChecksumSha256ByMediaAssetId?: Record<string, string>
    sourceStorageProviderByMediaAssetId?: Record<string, string>
    sourceStorageBucketByMediaAssetId?: Record<string, string>
    sourceStoragePathByMediaAssetId?: Record<string, string>
    sourceFileNameByMediaAssetId?: Record<string, string>
    sourceMimeTypeByMediaAssetId?: Record<string, string>
    sourceByteSizeByMediaAssetId?: Record<string, number>
  }
  decisions?: Array<{
    sourceMediaAssetId?: string
    sourceChecksumSha256?: string
    sourceStorageProvider?: string
    sourceStorageBucket?: string | null
    sourceStoragePath?: string
    sourceFileName?: string
    sourceMimeType?: string
    sourceByteSize?: number
    uploadedOrder?: number
    finalRenderTimeline?: {
      source?: string
      sequenceIndex?: number
      startSeconds?: number
      durationSeconds?: number
      endSeconds?: number
    }
    reviewOverlay?: {
      present?: boolean
      hasTitle?: boolean
      hasSubtitle?: boolean
      source?: string
    }
    captionOverlay?: {
      present?: boolean
      textPresent?: boolean
      textCharacterCount?: number
      source?: string
    }
    transitionPolish?: {
      present?: boolean
      fadeInSeconds?: number | null
      fadeOutSeconds?: number | null
      source?: string
    }
    privateArtifact?: boolean
    publicArtifact?: boolean
    signedUrl?: string | null
  }>
  blockedRuntimeScopes?: {
    publicArtifactCreated?: boolean
    signedUrlCreated?: boolean
    supabaseOrGcsWrite?: boolean
    externalBetaEnabled?: boolean
    productionEnabled?: boolean
    billingMutation?: boolean
  }
  adapterQaIntegration?: {
    mediaProcessingExecuted?: boolean
    productRuntimeExecuted?: boolean
  }
}

type PrivateReviewManifestHandoffForSmoke = {
  sourceMediaAssets?: Array<{
    mediaAssetId?: string
    uploadedOrder?: number
    storageProvider?: string
    storageBucket?: string
    storagePath?: string
    fileName?: string
    mimeType?: string
    byteSize?: number
    checksumSha256?: string
  }>
  privateReview?: {
    editDecisionManifestVerification?: {
      finalRenderArtifactId?: string
      sourceOrderPreserved?: boolean
      sourceStorageIdentityCoverageComplete?: boolean
      approvedEditContext?: {
        projectId?: string
        editSessionId?: string
        goalSummary?: string
        creditEstimateTotalCredits?: number
      }
    }
  }
}

async function fetchPrivateEditDecisionManifest(
  apiBaseUrl: string,
  manifestPath: string | undefined,
  bearerToken: string,
  label: string,
): Promise<{ manifest: PrivateEditDecisionManifestForSmoke; sha256: string; byteCount: number }> {
  assert.match(manifestPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/manifest$/, `${label} should expose a private manifest route.`)
  const response = await fetch(new URL(manifestPath as string, apiBaseUrl), {
    headers: { Authorization: `Bearer ${bearerToken}` },
  })
  assert.equal(response.status, 200, `${label} private manifest route should stream successfully.`)
  assert.match(response.headers.get('content-type') ?? '', /application\/json/i, `${label} private manifest should be JSON.`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  assert.ok(bytes.byteLength > 0, `${label} private manifest should contain bytes.`)
  const manifestText = Buffer.from(bytes).toString('utf8')
  const manifest = JSON.parse(manifestText) as PrivateEditDecisionManifestForSmoke
  assert.equal(
    /https?:\/\/|\/tmp\/|localFilePath|api[_-]?key|service[_-]?role|secret|password/i.test(JSON.stringify(manifest)),
    false,
    `${label} private manifest should not expose public URLs, local file paths, or secret-like material.`,
  )
  return {
    manifest,
    sha256: sha256Hex(bytes),
    byteCount: bytes.byteLength,
  }
}

async function assertPrivateReviewRoutesRejectAnonymousAccess(
  apiBaseUrl: string,
  filePath: string | undefined,
  manifestPath: string | undefined,
  label: string,
) {
  assert.match(filePath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/file$/, `${label} should expose a private file route.`)
  assert.match(manifestPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/manifest$/, `${label} should expose a private manifest route.`)

  const [fileResponse, manifestResponse] = await Promise.all([
    fetch(new URL(filePath as string, apiBaseUrl)),
    fetch(new URL(manifestPath as string, apiBaseUrl)),
  ])

  assert.equal(fileResponse.status, 401, `${label} private file route should reject anonymous access.`)
  assert.equal(manifestResponse.status, 401, `${label} private manifest route should reject anonymous access.`)
}

async function assertPrivateReviewRoutesUseNoStoreCache(
  apiBaseUrl: string,
  filePath: string | undefined,
  manifestPath: string | undefined,
  bearerToken: string,
  label: string,
) {
  assert.match(filePath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/file$/, `${label} should expose a private file route.`)
  assert.match(manifestPath ?? '', /^\/v1\/edit-executions\/private-internal-downloads\/[^/]+\/manifest$/, `${label} should expose a private manifest route.`)

  const headers = { Authorization: `Bearer ${bearerToken}` }
  const [fileResponse, manifestResponse] = await Promise.all([
    fetch(new URL(filePath as string, apiBaseUrl), { headers }),
    fetch(new URL(manifestPath as string, apiBaseUrl), { headers }),
  ])

  assert.equal(fileResponse.status, 200, `${label} private file route should stream for authorized users.`)
  assert.equal(manifestResponse.status, 200, `${label} private manifest route should stream for authorized users.`)
  assert.equal(fileResponse.headers.get('cache-control'), 'no-store', `${label} private file route should disable browser/proxy caching.`)
  assert.equal(manifestResponse.headers.get('cache-control'), 'no-store', `${label} private manifest route should disable browser/proxy caching.`)
  assert.match(fileResponse.headers.get('content-type') ?? '', /^video\/mp4\b/i, `${label} private file route should stream MP4 content.`)
  assert.match(manifestResponse.headers.get('content-type') ?? '', /^application\/json\b/i, `${label} private manifest route should stream JSON content.`)
  assert.match(fileResponse.headers.get('content-disposition') ?? '', /^attachment(?:;|$)/i, `${label} private file route should be an attachment.`)
  assert.match(manifestResponse.headers.get('content-disposition') ?? '', /^attachment(?:;|$)/i, `${label} private manifest route should be an attachment.`)
  await Promise.all([
    fileResponse.arrayBuffer(),
    manifestResponse.arrayBuffer(),
  ])
}

function assertDownloadedPrivateManifestMatchesHandoff(
  manifest: PrivateEditDecisionManifestForSmoke,
  handoff: PrivateReviewManifestHandoffForSmoke | undefined,
  label: string,
) {
  assert.equal(manifest.manifestVersion, 'private-internal-edit-decision-manifest-v1', `${label} manifest should use the private edit-decision manifest version.`)
  assert.equal(
    manifest.finalRenderArtifactId,
    handoff?.privateReview?.editDecisionManifestVerification?.finalRenderArtifactId,
    `${label} manifest should reference the verified final-render artifact.`,
  )
  assert.equal(manifest.uploadedSourceOrderTrace?.sourceOrderPreserved, true, `${label} manifest should preserve uploaded source order.`)
  assert.equal(handoff?.privateReview?.editDecisionManifestVerification?.sourceOrderPreserved, true, `${label} handoff should preserve uploaded source order.`)
  assert.equal(handoff?.privateReview?.editDecisionManifestVerification?.sourceStorageIdentityCoverageComplete, true, `${label} handoff should preserve source storage identity coverage.`)
  const sourceAssets = handoff?.sourceMediaAssets ?? []
  assert.ok(sourceAssets.length > 0, `${label} handoff should carry source media assets for manifest verification.`)
  const manifestSourceIds = manifest.uploadedSourceOrderTrace?.sourceMediaAssetIds ?? []
  const manifestChecksums = manifest.uploadedSourceOrderTrace?.sourceChecksumSha256ByMediaAssetId ?? {}
  const manifestStorageProviders = manifest.uploadedSourceOrderTrace?.sourceStorageProviderByMediaAssetId ?? {}
  const manifestStorageBuckets = manifest.uploadedSourceOrderTrace?.sourceStorageBucketByMediaAssetId ?? {}
  const manifestStoragePaths = manifest.uploadedSourceOrderTrace?.sourceStoragePathByMediaAssetId ?? {}
  const manifestFileNames = manifest.uploadedSourceOrderTrace?.sourceFileNameByMediaAssetId ?? {}
  const manifestMimeTypes = manifest.uploadedSourceOrderTrace?.sourceMimeTypeByMediaAssetId ?? {}
  const manifestByteSizes = manifest.uploadedSourceOrderTrace?.sourceByteSizeByMediaAssetId ?? {}
  for (const asset of sourceAssets) {
    assert.ok(asset.mediaAssetId, `${label} source media asset should have an id.`)
    assert.ok(asset.checksumSha256, `${label} source media asset should have a checksum.`)
    assert.ok(manifestSourceIds.includes(asset.mediaAssetId), `${label} manifest should include source media asset ${asset.mediaAssetId}.`)
    assert.equal(manifestChecksums[asset.mediaAssetId], asset.checksumSha256, `${label} manifest checksum should match source media asset ${asset.mediaAssetId}.`)
    assert.equal(manifestStorageProviders[asset.mediaAssetId], asset.storageProvider, `${label} manifest storage provider should match source media asset ${asset.mediaAssetId}.`)
    assert.equal(manifestStorageBuckets[asset.mediaAssetId], asset.storageBucket, `${label} manifest storage bucket should match source media asset ${asset.mediaAssetId}.`)
    assert.equal(manifestStoragePaths[asset.mediaAssetId], asset.storagePath, `${label} manifest storage path should match source media asset ${asset.mediaAssetId}.`)
    assert.equal(manifestFileNames[asset.mediaAssetId], asset.fileName, `${label} manifest filename should match source media asset ${asset.mediaAssetId}.`)
    assert.equal(manifestMimeTypes[asset.mediaAssetId], asset.mimeType, `${label} manifest MIME type should match source media asset ${asset.mediaAssetId}.`)
    assert.equal(manifestByteSizes[asset.mediaAssetId], asset.byteSize, `${label} manifest byte size should match source media asset ${asset.mediaAssetId}.`)
  }
  const decisions = manifest.decisions ?? []
  assert.ok(decisions.length > 0, `${label} manifest should carry edit decisions.`)
  assert.equal(decisions.every((decision) => decision.privateArtifact === true), true, `${label} manifest decisions should stay private.`)
  assert.equal(decisions.every((decision) => decision.publicArtifact === false), true, `${label} manifest decisions should not expose public artifacts.`)
  assert.equal(decisions.every((decision) => decision.signedUrl === null), true, `${label} manifest decisions should not expose signed URLs.`)
  assert.equal(decisions.every((decision) =>
    decision.sourceMediaAssetId &&
    decision.sourceChecksumSha256 === manifestChecksums[decision.sourceMediaAssetId]
  ), true, `${label} manifest decisions should match uploaded source checksums.`)
  assert.equal(decisions.every((decision) =>
    decision.sourceMediaAssetId &&
    decision.sourceStorageProvider === manifestStorageProviders[decision.sourceMediaAssetId] &&
    (decision.sourceStorageBucket ?? undefined) === manifestStorageBuckets[decision.sourceMediaAssetId] &&
    decision.sourceStoragePath === manifestStoragePaths[decision.sourceMediaAssetId] &&
    decision.sourceFileName === manifestFileNames[decision.sourceMediaAssetId] &&
    decision.sourceMimeType === manifestMimeTypes[decision.sourceMediaAssetId] &&
    decision.sourceByteSize === manifestByteSizes[decision.sourceMediaAssetId]
  ), true, `${label} manifest decisions should match uploaded source storage identity.`)
  let expectedTimelineStartSeconds = 0
  decisions.forEach((decision, index) => {
    const timeline = decision.finalRenderTimeline
    assert.ok(timeline, `${label} manifest decision ${index + 1} should carry final-render timeline metadata.`)
    assert.equal(timeline.source, 'final_render_execution_sequence', `${label} manifest decision ${index + 1} should use final-render sequence timeline source.`)
    assert.equal(timeline.sequenceIndex, index + 1, `${label} manifest decision ${index + 1} should preserve its final-render sequence index.`)
    assert.ok((timeline.durationSeconds ?? 0) > 0, `${label} manifest decision ${index + 1} should have a positive final-render duration.`)
    assert.ok(
      Math.abs((timeline.startSeconds ?? -1) - expectedTimelineStartSeconds) <= 0.05,
      `${label} manifest decision ${index + 1} should start where the previous decision ended.`,
    )
    assert.ok(
      Math.abs(((timeline.startSeconds ?? 0) + (timeline.durationSeconds ?? 0)) - (timeline.endSeconds ?? -1)) <= 0.05,
      `${label} manifest decision ${index + 1} should have a coherent final-render end time.`,
    )
    expectedTimelineStartSeconds = timeline.endSeconds ?? expectedTimelineStartSeconds
  })
  const approvedContext = handoff?.privateReview?.editDecisionManifestVerification?.approvedEditContext
  if (approvedContext) {
    assert.equal(manifest.approvedEditContext?.projectId, approvedContext.projectId, `${label} manifest should preserve approved project id.`)
    assert.equal(manifest.approvedEditContext?.editSessionId, approvedContext.editSessionId, `${label} manifest should preserve approved edit session id.`)
    assert.equal(manifest.approvedEditContext?.goalSummary, approvedContext.goalSummary, `${label} manifest should preserve approved goal summary.`)
    assert.equal(manifest.approvedEditContext?.creditEstimateTotalCredits, approvedContext.creditEstimateTotalCredits, `${label} manifest should preserve approved credit estimate.`)
  }
  assert.equal(manifest.blockedRuntimeScopes?.publicArtifactCreated, false, `${label} manifest should keep public artifacts blocked.`)
  assert.equal(manifest.blockedRuntimeScopes?.signedUrlCreated, false, `${label} manifest should keep signed URLs blocked.`)
  assert.equal(manifest.blockedRuntimeScopes?.supabaseOrGcsWrite, false, `${label} manifest should keep Supabase/GCS writes blocked.`)
  assert.equal(manifest.blockedRuntimeScopes?.externalBetaEnabled, false, `${label} manifest should keep external beta blocked.`)
  assert.equal(manifest.blockedRuntimeScopes?.productionEnabled, false, `${label} manifest should keep production blocked.`)
  assert.equal(manifest.blockedRuntimeScopes?.billingMutation, false, `${label} manifest should keep billing mutation blocked.`)
  assert.equal(manifest.adapterQaIntegration?.mediaProcessingExecuted, false, `${label} manifest should not claim adapter media processing.`)
  assert.equal(manifest.adapterQaIntegration?.productRuntimeExecuted, false, `${label} manifest should not claim product runtime execution.`)
}

async function assertManifestTimelineMatchesDownloadedVisuals(
  localFilePath: string,
  manifest: PrivateEditDecisionManifestForSmoke,
  colorByUploadedOrder: Record<number, DominantSourceColor>,
  label: string,
): Promise<RgbSample[]> {
  const decisions = manifest.decisions ?? []
  assert.ok(decisions.length > 0, `${label} manifest should carry decisions for visual timeline verification.`)
  const samples: RgbSample[] = []
  for (let index = 0; index < decisions.length; index += 1) {
    const decision = decisions[index]
    const timeline = decision.finalRenderTimeline
    assert.ok(timeline, `${label} decision ${index + 1} should have final-render timeline metadata.`)
    const startSeconds = timeline.startSeconds ?? 0
    const durationSeconds = timeline.durationSeconds ?? 0
    const endSeconds = timeline.endSeconds ?? startSeconds + durationSeconds
    assert.ok(durationSeconds > 0, `${label} decision ${index + 1} should have a positive final-render duration.`)
    const uploadedOrder = decision.uploadedOrder ?? 0
    const expectedColor = colorByUploadedOrder[uploadedOrder]
    assert.ok(expectedColor, `${label} decision ${index + 1} should map uploaded order ${uploadedOrder} to an expected visual source.`)
    const sampleTimestamp = finalRenderTimelineSampleTimestamp(startSeconds, durationSeconds, endSeconds)
    const sample = await sampleCenterFrameColor(localFilePath, sampleTimestamp)
    assertDominantSourceColor(sample, expectedColor, `${label} decision ${index + 1} downloaded visual timeline sample`)
    samples.push(sample)
  }
  return samples
}

async function assertManifestTimelineBurnsApprovedOverlayBand(
  localFilePath: string,
  manifest: PrivateEditDecisionManifestForSmoke,
  label: string,
): Promise<RgbSample[]> {
  const decisions = manifest.decisions ?? []
  const overlayDecisions = decisions.filter((decision) => decision.reviewOverlay?.present || decision.captionOverlay?.present)
  assert.ok(overlayDecisions.length > 0, `${label} manifest should include approved overlay or caption decisions.`)
  const samples: RgbSample[] = []
  for (let index = 0; index < overlayDecisions.length; index += 1) {
    const decision = overlayDecisions[index]
    const timeline = decision.finalRenderTimeline
    assert.ok(timeline, `${label} overlay decision ${index + 1} should have final-render timeline metadata.`)
    const startSeconds = timeline.startSeconds ?? 0
    const durationSeconds = timeline.durationSeconds ?? 0
    const endSeconds = timeline.endSeconds ?? startSeconds + durationSeconds
    assert.ok(durationSeconds > 0, `${label} overlay decision ${index + 1} should have a positive final-render duration.`)
    const sampleTimestamp = finalRenderTimelineSampleTimestamp(startSeconds, durationSeconds, endSeconds)
    const sample = await sampleOverlayBandColor(localFilePath, sampleTimestamp)
    assertApprovedOverlayBandColor(sample, `${label} overlay decision ${index + 1}`)
    samples.push(sample)
  }
  return samples
}

async function assertManifestTimelineBurnsApprovedOverlayText(
  localFilePath: string,
  manifest: PrivateEditDecisionManifestForSmoke,
  label: string,
): Promise<OverlayTextPixelSample[]> {
  const decisions = manifest.decisions ?? []
  const textDecisions = decisions.filter((decision) =>
    decision.reviewOverlay?.hasTitle ||
    decision.reviewOverlay?.hasSubtitle ||
    decision.captionOverlay?.textPresent)
  assert.ok(textDecisions.length > 0, `${label} manifest should include approved review or caption text decisions.`)
  const samples: OverlayTextPixelSample[] = []
  for (let index = 0; index < textDecisions.length; index += 1) {
    const decision = textDecisions[index]
    const timeline = decision.finalRenderTimeline
    assert.ok(timeline, `${label} overlay text decision ${index + 1} should have final-render timeline metadata.`)
    const startSeconds = timeline.startSeconds ?? 0
    const durationSeconds = timeline.durationSeconds ?? 0
    const endSeconds = timeline.endSeconds ?? startSeconds + durationSeconds
    assert.ok(durationSeconds > 0, `${label} overlay text decision ${index + 1} should have a positive final-render duration.`)
    const sampleTimestamp = finalRenderTimelineSampleTimestamp(startSeconds, durationSeconds, endSeconds)
    const sample = await sampleOverlayTextPixels(localFilePath, sampleTimestamp)
    assertApprovedOverlayTextPixels(sample, `${label} overlay text decision ${index + 1}`)
    samples.push(sample)
  }
  return samples
}

async function assertManifestTimelineBurnsApprovedTransitionPolish(
  localFilePath: string,
  manifest: PrivateEditDecisionManifestForSmoke,
  label: string,
): Promise<TransitionFadeSample[]> {
  const decisions = manifest.decisions ?? []
  const transitionDecisions = decisions
    .map((decision, index) => ({ decision, index }))
    .filter(({ decision }) =>
      decision.transitionPolish?.present &&
      ((decision.transitionPolish.fadeInSeconds ?? 0) > 0 || (decision.transitionPolish.fadeOutSeconds ?? 0) > 0))
  assert.ok(transitionDecisions.length > 0, `${label} manifest should include approved transition-polish decisions.`)
  const samples: TransitionFadeSample[] = []
  for (const { decision, index } of transitionDecisions) {
    const timeline = decision.finalRenderTimeline
    assert.ok(timeline, `${label} transition decision ${index + 1} should have final-render timeline metadata.`)
    const startSeconds = timeline.startSeconds ?? 0
    const durationSeconds = timeline.durationSeconds ?? 0
    const endSeconds = timeline.endSeconds ?? startSeconds + durationSeconds
    assert.ok(durationSeconds > 0, `${label} transition decision ${index + 1} should have a positive final-render duration.`)
    const referenceSample = await sampleCenterFrameColor(
      localFilePath,
      finalRenderTimelineSampleTimestamp(startSeconds, durationSeconds, endSeconds),
    )
    const fadeInSeconds = decision.transitionPolish?.fadeInSeconds ?? 0
    if (fadeInSeconds > 0) {
      const fadeSample = await sampleCenterFrameColor(
        localFilePath,
        transitionFadeSampleTimestamp(startSeconds, endSeconds, fadeInSeconds, 'fade_in'),
      )
      const sample = createTransitionFadeSample(index, 'fade_in', fadeInSeconds, fadeSample, referenceSample)
      assertApprovedTransitionFadeSample(sample, `${label} transition decision ${index + 1}`)
      samples.push(sample)
    }
    const fadeOutSeconds = decision.transitionPolish?.fadeOutSeconds ?? 0
    if (fadeOutSeconds > 0) {
      const fadeSample = await sampleCenterFrameColor(
        localFilePath,
        transitionFadeSampleTimestamp(startSeconds, endSeconds, fadeOutSeconds, 'fade_out'),
      )
      const sample = createTransitionFadeSample(index, 'fade_out', fadeOutSeconds, fadeSample, referenceSample)
      assertApprovedTransitionFadeSample(sample, `${label} transition decision ${index + 1}`)
      samples.push(sample)
    }
  }
  return samples
}

async function assertManifestTimelinePreservesUploadedSourceAudioTone(
  localFilePath: string,
  manifest: PrivateEditDecisionManifestForSmoke,
  audioByUploadedOrder: Record<number, boolean>,
  label: string,
): Promise<AudioToneSample[]> {
  const decisions = manifest.decisions ?? []
  const audioDecisions = decisions.filter((decision) => audioByUploadedOrder[decision.uploadedOrder ?? 0] === true)
  assert.ok(audioDecisions.length > 0, `${label} manifest should include decisions for uploaded sources with audio.`)
  const samples: AudioToneSample[] = []
  for (let index = 0; index < audioDecisions.length; index += 1) {
    const decision = audioDecisions[index]
    const timeline = decision.finalRenderTimeline
    assert.ok(timeline, `${label} audio decision ${index + 1} should have final-render timeline metadata.`)
    const startSeconds = timeline.startSeconds ?? 0
    const durationSeconds = timeline.durationSeconds ?? 0
    const endSeconds = timeline.endSeconds ?? startSeconds + durationSeconds
    assert.ok(durationSeconds > 0, `${label} audio decision ${index + 1} should have a positive final-render duration.`)
    const sampleTimestamp = finalRenderTimelineSampleTimestamp(startSeconds, durationSeconds, endSeconds)
    const sampleDurationSeconds = Math.min(1.5, Math.max(0.25, endSeconds - sampleTimestamp - 0.05))
    const sample = await probeAudioTone(localFilePath, {
      startSeconds: sampleTimestamp,
      durationSeconds: sampleDurationSeconds,
    })
    assertSourceAudioTone(sample, `${label} audio decision ${index + 1}`)
    samples.push(sample)
  }
  return samples
}

function finalRenderTimelineSampleTimestamp(startSeconds: number, durationSeconds: number, endSeconds: number): number {
  const offsetSeconds = Math.min(0.75, Math.max(0.15, durationSeconds / 2))
  const latestSafeTimestamp = Math.max(startSeconds + 0.05, endSeconds - 0.05)
  return Number(Math.min(latestSafeTimestamp, startSeconds + offsetSeconds).toFixed(3))
}

function transitionFadeSampleTimestamp(
  startSeconds: number,
  endSeconds: number,
  fadeSeconds: number,
  phase: TransitionFadeSample['phase'],
): number {
  const boundedFadeSeconds = Math.min(0.25, Math.max(0.01, fadeSeconds))
  const offsetSeconds = Math.min(Math.max(boundedFadeSeconds / 2, 0.03), Math.max(0.03, boundedFadeSeconds - 0.01))
  const timestamp = phase === 'fade_in'
    ? Math.min(endSeconds - 0.05, startSeconds + offsetSeconds)
    : Math.max(startSeconds + 0.05, endSeconds - offsetSeconds)
  return Number(timestamp.toFixed(3))
}

function createTransitionFadeSample(
  decisionIndex: number,
  phase: TransitionFadeSample['phase'],
  fadeSeconds: number,
  fadeSample: RgbSample,
  referenceSample: RgbSample,
): TransitionFadeSample {
  return {
    decisionIndex: decisionIndex + 1,
    phase,
    fadeSeconds,
    fadeSample,
    referenceSample,
    fadeMaxChannel: maxRgbChannel(fadeSample),
    referenceMaxChannel: maxRgbChannel(referenceSample),
  }
}

function maxRgbChannel(sample: RgbSample): number {
  return Math.max(sample.red, sample.green, sample.blue)
}

async function probeAudioMeanVolume(localFilePath: string): Promise<number> {
  const { stderr } = await execFileAsync('ffmpeg', [
    '-hide_banner',
    '-nostats',
    '-i',
    localFilePath,
    '-vn',
    '-af',
    'volumedetect',
    '-f',
    'null',
    '-',
  ], {
    timeout: 15_000,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  })
  const match = /mean_volume:\s*(-?(?:\d+(?:\.\d+)?|inf))\s*dB/i.exec(stderr)
  if (!match) throw new Error(`Unable to parse audio mean volume for ${localFilePath}`)
  return match[1]?.toLowerCase() === '-inf' ? Number.NEGATIVE_INFINITY : Number(match[1])
}

async function probeAudioTone(
  localFilePath: string,
  window?: {
    startSeconds?: number
    durationSeconds?: number
    targetFrequencyHz?: number
  },
): Promise<AudioToneSample> {
  const sampleRate = 48_000
  const windowArgs = [
    ...(typeof window?.startSeconds === 'number' && window.startSeconds > 0
      ? ['-ss', String(window.startSeconds)]
      : []),
    ...(typeof window?.durationSeconds === 'number' && window.durationSeconds > 0
      ? ['-t', String(window.durationSeconds)]
      : ['-t', '20']),
  ]
  const { stdout } = await execFileAsync('ffmpeg', [
    '-v',
    'error',
    '-i',
    localFilePath,
    '-vn',
    '-ac',
    '1',
    '-ar',
    String(sampleRate),
    ...windowArgs,
    '-f',
    'f32le',
    'pipe:1',
  ], {
    timeout: 20_000,
    windowsHide: true,
    encoding: 'buffer',
    maxBuffer: 8 * 1024 * 1024,
  }) as { stdout: Buffer | string }
  const buffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout, 'binary')
  assert.ok(buffer.byteLength >= 4, `Unable to decode audio PCM for ${localFilePath}.`)

  const sampleCount = Math.floor(buffer.byteLength / 4)
  const samples = new Float64Array(sampleCount)
  let energy = 0
  for (let index = 0; index < sampleCount; index += 1) {
    const sample = buffer.readFloatLE(index * 4)
    samples[index] = sample
    energy += sample * sample
  }

  const targetFrequencyHz = window?.targetFrequencyHz ?? 440
  assert.ok(
    Number.isInteger(targetFrequencyHz) && targetFrequencyHz >= 20 && targetFrequencyHz <= 20_000,
    `Audio tone target must be an integer between 20 and 20000 Hz, got ${targetFrequencyHz}.`,
  )
  const controlFrequencies = [220, 330, 440, 660, 880, 1320].filter(
    (frequencyHz) => frequencyHz !== targetFrequencyHz,
  )
  const targetPower = goertzelPower(samples, sampleRate, targetFrequencyHz)
  const controlPowers = controlFrequencies.map((frequencyHz) => ({
    frequencyHz,
    power: goertzelPower(samples, sampleRate, frequencyHz),
  }))
  const strongestControl = controlPowers.reduce((strongest, candidate) =>
    candidate.power > strongest.power ? candidate : strongest, controlPowers[0])
  const strongestControlPower = strongestControl?.power ?? 0

  return {
    targetFrequencyHz,
    targetPower,
    strongestControlFrequencyHz: strongestControl?.frequencyHz ?? 0,
    strongestControlPower,
    targetToControlRatio: targetPower / Math.max(strongestControlPower, 1e-12),
    rms: Math.sqrt(energy / Math.max(sampleCount, 1)),
    sampleCount,
    durationSeconds: sampleCount / sampleRate,
  }
}

function assertSourceAudioTone(sample: AudioToneSample, label: string) {
  assert.ok(sample.sampleCount >= 4_800, `${label} should expose enough decoded source-audio samples, got ${formatAudioToneSample(sample)}.`)
  assert.ok(sample.rms > 0.0005, `${label} should preserve audible source-audio energy, got ${formatAudioToneSample(sample)}.`)
  assert.ok(sample.targetPower > 1e-5, `${label} should preserve measurable ${sample.targetFrequencyHz}Hz source-audio power, got ${formatAudioToneSample(sample)}.`)
  assert.ok(
    sample.targetToControlRatio >= 3,
    `${label} should preserve the uploaded ${sample.targetFrequencyHz}Hz source-audio identity, got ${formatAudioToneSample(sample)}.`,
  )
}

function goertzelPower(samples: Float64Array, sampleRate: number, frequencyHz: number): number {
  const normalizedFrequency = frequencyHz / sampleRate
  const coefficient = 2 * Math.cos(2 * Math.PI * normalizedFrequency)
  let previous = 0
  let previous2 = 0
  for (let index = 0; index < samples.length; index += 1) {
    const current = samples[index] + coefficient * previous - previous2
    previous2 = previous
    previous = current
  }
  return (previous2 * previous2 + previous * previous - coefficient * previous * previous2) / Math.max(samples.length * samples.length, 1)
}

async function maybeClickWhenReady(locator: Locator) {
  if (await locator.count()) {
    await clickWhenReady(locator)
  }
}

function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function addressPort(server: Server): number {
  const address = server.address()
  assert(address && typeof address === 'object', 'Server should expose a TCP address.')
  return address.port
}

async function fetchProjectReadback(
  apiBaseUrl: string,
  projectId: string,
  bearerToken: string,
): Promise<{ status: number; json: ProjectReadbackResponse }> {
  const response = await fetch(`${apiBaseUrl}/v1/projects/${encodeURIComponent(projectId)}?workspaceId=workspace-internal-testing`, {
    headers: {
      authorization: `Bearer ${bearerToken}`,
    },
  })
  return {
    status: response.status,
    json: await response.json() as ProjectReadbackResponse,
  }
}

async function fetchInternalEditStateReadback(
  apiBaseUrl: string,
  projectId: string,
  bearerToken: string,
): Promise<{ status: number; json: InternalEditStateReadbackResponse }> {
  const response = await fetch(`${apiBaseUrl}/v1/projects/${encodeURIComponent(projectId)}/internal-edit-state?workspaceId=workspace-internal-testing`, {
    headers: {
      authorization: `Bearer ${bearerToken}`,
    },
  })
  return {
    status: response.status,
    json: await response.json() as InternalEditStateReadbackResponse,
  }
}

async function fetchCanonicalJourneyReadback(input: {
  apiBaseUrl: string
  projectId: string
  editSessionId: string
  bearerToken: string
}): Promise<{ status: number; json: CanonicalJourneyReadbackResponse }> {
  const response = await fetch(
    `${input.apiBaseUrl}/v1/projects/${encodeURIComponent(input.projectId)}` +
      `/edit-sessions/${encodeURIComponent(input.editSessionId)}` +
      '/canonical-journey?workspaceId=workspace-internal-testing',
    {
      headers: {
        authorization: `Bearer ${input.bearerToken}`,
      },
    },
  )
  return {
    status: response.status,
    json: await response.json() as CanonicalJourneyReadbackResponse,
  }
}

function assertCanonicalJourneyDoesNotExposePrivateExecutionAuthority(value: unknown): void {
  const keys = collectObjectKeys(value)
  for (const forbiddenKey of [
    'workItems',
    'jobs',
    'jobIds',
    'approvedToolIds',
    'toolIds',
    'artifactIds',
    'filesystemPath',
    'storagePath',
    'lease',
    'leaseId',
    'dispatchGrant',
    'command',
    'credentials',
    'signedUrl',
    'sourceBytes',
    'rawPlanningInputs',
  ]) {
    assert.equal(
      keys.has(forbiddenKey),
      false,
      `Canonical browser journey must not expose private execution field ${forbiddenKey}.`,
    )
  }
}

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== 'object') return keys
  if (Array.isArray(value)) {
    value.forEach((item) => collectObjectKeys(item, keys))
    return keys
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key)
    collectObjectKeys(nested, keys)
  }
  return keys
}

async function fetchProjectListReadback(
  apiBaseUrl: string,
  bearerToken: string,
): Promise<{ status: number; json: ProjectListReadbackResponse }> {
  const response = await fetch(`${apiBaseUrl}/v1/projects?workspaceId=workspace-internal-testing`, {
    headers: {
      authorization: `Bearer ${bearerToken}`,
    },
  })
  return {
    status: response.status,
    json: await response.json() as ProjectListReadbackResponse,
  }
}

async function fetchInternalEditStateListReadback(
  apiBaseUrl: string,
  bearerToken: string,
): Promise<{ status: number; json: InternalEditStateListReadbackResponse }> {
  const response = await fetch(`${apiBaseUrl}/v1/internal-edit-states?workspaceId=workspace-internal-testing`, {
    headers: {
      authorization: `Bearer ${bearerToken}`,
    },
  })
  return {
    status: response.status,
    json: await response.json() as InternalEditStateListReadbackResponse,
  }
}

async function saveInternalEditStateReadback(input: {
  apiBaseUrl: string
  projectId: string
  bearerToken: string
  workspaceId: unknown
  editSessionId: string
  handoff: unknown
  idempotencyKey: string
}): Promise<{ status: number; json: InternalEditStateReadbackResponse }> {
  const response = await fetch(`${input.apiBaseUrl}/v1/projects/${encodeURIComponent(input.projectId)}/internal-edit-state`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${input.bearerToken}`,
      'content-type': 'application/json',
      'idempotency-key': input.idempotencyKey,
    },
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      editSessionId: input.editSessionId,
      handoff: input.handoff,
    }),
  })
  return {
    status: response.status,
    json: await response.json() as InternalEditStateReadbackResponse,
  }
}

async function waitForInternalEditStateStage(
  apiBaseUrl: string,
  projectId: string,
  bearerToken: string,
  stage: string,
): Promise<LocalInternalProjectHandoff | undefined> {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 10_000) {
    const response = await fetchInternalEditStateReadback(apiBaseUrl, projectId, bearerToken)
    const handoff = response.json.data?.internalEditState?.handoff
    if (response.status === 200 && handoff?.stage === stage) return handoff
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return undefined
}

async function waitForInternalEditStateListStage(
  apiBaseUrl: string,
  bearerToken: string,
  projectId: string,
  editSessionId: string,
  stage: string,
): Promise<LocalInternalProjectHandoff | undefined> {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 10_000) {
    const response = await fetchInternalEditStateListReadback(apiBaseUrl, bearerToken)
    const states = response.json.data?.internalEditStates
    const handoff = states?.find((state) =>
      state.handoff?.projectId === projectId &&
      state.handoff?.editSessionId === editSessionId &&
      state.handoff?.stage === stage,
    )?.handoff
    if (response.status === 200 && handoff) return handoff
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return undefined
}
