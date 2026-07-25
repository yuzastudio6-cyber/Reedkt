import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, type Locator, type Page } from '@playwright/test'
import {
  EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS,
  materializeEditReferenceControlledMediaFixture,
} from '../../../server/edit-references/edit-reference-controlled-media-fixtures'
import { probeMediaFile } from '../../../server/workers/media/ffprobe-media-adapter'
import { buildLocalProjectHandoffStorageKey } from '../../../src/lib/local-project-handoff'
import { createProjectPersistenceScopeFingerprint } from '../../../src/lib/project-persistence-scope'
import { expectFloatingComposerAligned, expectNoHorizontalOverflow } from './layout'

export const viewportWidths = [1024, 1280, 1440, 1728, 1920] as const
const EDITOR_READY_TIMEOUT_MS = 15_000
const CONTROLLED_UI_SCOPE = {
  authMode: 'local_test' as const,
  userId: 'local-test-user',
  workspaceId: 'workspace-internal-testing',
}
const CONTROLLED_UI_HANDOFF_STORAGE_KEY = buildLocalProjectHandoffStorageKey(CONTROLLED_UI_SCOPE)
const CONTROLLED_UI_SCOPE_FINGERPRINT = createProjectPersistenceScopeFingerprint(CONTROLLED_UI_SCOPE)
let controlledSourceVideoFixture: Promise<{
  bytes: Buffer
  checksumSha256: string
  sizeBytes: number
  sourceMetadata: {
    probeStatus: 'probed'
    source: 'local_ffprobe'
    durationSeconds: number
    width: number
    height: number
    videoCodec: string
    audioCodec?: string
    formatName: string
    streamCount: number
    hasVideo: boolean
    hasAudio: boolean
  }
}> | undefined

export const checkedRoutes = [
  { path: '/', label: 'landing' },
  { path: '/sign-in', label: 'sign-in' },
  { path: '/dashboard', label: 'dashboard' },
  { path: '/projects', label: 'projects' },
  { path: '/edit-videos', label: 'edit-videos' },
  { path: '/projects/new', label: 'projects-new' },
  { path: '/preferences', label: 'preferences' },
  { path: '/editor', label: 'editor' },
] as const

export const legacyRedirectRoutes = [
  { path: '/wallet', expectedPath: '/preferences', label: 'wallet-to-preferences' },
  { path: '/pricing', expectedPath: '/projects', label: 'pricing-to-projects' },
  { path: '/brand-kit', expectedPath: '/preferences', label: 'brand-kit-to-preferences' },
  { path: '/exports', expectedPath: '/projects', label: 'exports-to-projects' },
  { path: '/upload', expectedPath: '/projects/new', label: 'upload-to-new-project' },
  { path: '/edit-preferences', expectedPath: '/preferences', label: 'edit-preferences-to-preferences' },
  { path: '/settings', expectedPath: '/preferences', label: 'settings-to-preferences' },
  { path: '/app', expectedPath: '/dashboard', label: 'app-to-dashboard' },
] as const

const INTERNAL_TOOL_NAME_PATTERN =
  /\blibrosa\b|\baudioread\b|\bpydub\b|\bscipy\b|\bresampy\b|\bpyloudnorm\b|\baudioflux\b|\bmusic21\b|\bpretty_midi\b|\bmido\b|\bnoisereduce\b|\bpedalboard\b|\bmir_eval\b|\bpydub_effects\b|\bebu_r128_pyloudnorm\b|\bd3\b|\becharts\b|\bvega_lite\b|\bvega\b|\bsatori\b|\bsvg_js\b|\bviz_js\b|\blottie_web\b|\banimejs\b|\bthree_js\b|\bbabylonjs\b|\bbabylon_js\b|\bpixi_js\b|\bpixijs\b|\bkonva\b|\btorch_torchvision\b|\btransformers\b|\bsam2\b|\bbirefnet\b|\brembg\b|\btransparent_background\b|\breal_esrgan\b|\bkornia\b|\bffmpeg\b|\bffprobe\b|\bgpac\b|\bmp4box\b|\bmkvtoolnix\b|\bgstreamer\b|\bstreamer_render_pipeline_support\b|\bmkvtoolnix_container_validation\b|\bgpac_mp4box_packaging_validation\b|\bopencolorio\b|\bopenimageio\b/i

export async function expectNoInternalToolNamesInEditor(page: Page) {
  await expect(page.getByTestId('editor-page')).not.toContainText(INTERNAL_TOOL_NAME_PATTERN)
}

export async function expandVisibleEditorDetailsAndExpectNoInternalToolNames(page: Page) {
  const summaries = page.getByTestId('editor-page').locator('details > summary')
  const count = await summaries.count()

  for (let index = 0; index < count; index += 1) {
    const summary = summaries.nth(index)
    if (!(await summary.isVisible())) continue

    const alreadyOpen = await summary.evaluate((node) => {
      const details = node.parentElement as HTMLDetailsElement | null
      return Boolean(details?.open)
    })

    if (!alreadyOpen) {
      await summary.scrollIntoViewIfNeeded()
      await summary.click()
    }
  }

  await expectNoInternalToolNamesInEditor(page)
}

export async function gotoRoute(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('domcontentloaded')
  await page.locator('body').waitFor({ state: 'visible' })

  if (isProtectedAppPath(path)) {
    await page.waitForFunction(() => Boolean(
      document.querySelector('[data-testid="app-shell"]')
      || document.querySelector('[data-testid="local-test-sign-in"]'),
    ), undefined, { timeout: EDITOR_READY_TIMEOUT_MS })

    const localTestEntry = page.getByTestId('local-test-sign-in')
    if (await localTestEntry.count()) {
      await expect(localTestEntry).toBeVisible()
      await localTestEntry.click()
      await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS })
    }
  }
}

function isProtectedAppPath(path: string): boolean {
  const pathname = new URL(path, 'http://reeditpro-e2e.local').pathname
  return pathname !== '/' && pathname !== '/sign-in'
}

function isolatedEditorPath(path: string) {
  const url = new URL(path, 'http://reeditpro-e2e.local')
  if (url.pathname !== '/editor') return path

  const uniqueId = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`
  if (!url.searchParams.has('projectId')) {
    url.searchParams.set('projectId', `${uniqueId}-project`)
  }
  if (!url.searchParams.has('editSessionId')) {
    url.searchParams.set('editSessionId', `${uniqueId}-edit`)
  }

  return `${url.pathname}${url.search}${url.hash}`
}

export async function gotoEditor(page: Page, path = '/editor') {
  await gotoRoute(page, isolatedEditorPath(path))
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS })
  await expect(page.getByTestId('editor-header')).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS })
  await expect(page.getByTestId('chat-composer')).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS })
}

export async function clickWhenReady(locator: Locator) {
  await expect(locator).toBeVisible()
  await expect(locator).toBeEnabled()
  await locator.click()
}

export async function findPlanReview(page: Page) {
  const checkpoint = page.getByTestId('plan-approval-checkpoint')
  const legacyCard = page.getByTestId('plan-review-card')
  const card = await checkpoint.count() ? checkpoint : legacyCard
  await card.scrollIntoViewIfNeeded()
  await expect(card).toBeVisible()
  await expect(page.getByTestId('plan-review-approve')).toBeVisible()
  return card
}

export async function expectNoGenerationBeforeApproval(page: Page) {
  await expect(page.getByTestId('generation-progress-card')).toHaveCount(0)
  await expect(page.getByTestId('preview-ready-card')).toHaveCount(0)
  await expect(page.getByTestId('editor-processing')).toHaveCount(0)
  await expect(page.getByTestId('private-review')).toHaveCount(0)
}

export async function uploadEditorSourceFile(page: Page, fileName = 'e2e-source-story.mp4') {
  const cleanSource = page.getByTestId('source-summary')
  const legacySource = page.getByTestId('source-sequence-card')
  const sourceCard = await cleanSource.count() ? cleanSource : legacySource
  await expect(sourceCard).toBeVisible()
  await sourceCard.locator('input[type="file"]').setInputFiles({
    name: fileName,
    mimeType: 'video/mp4',
    buffer: await getEditorSourceVideoBytes(fileName),
  })
  await expect(sourceCard).toContainText(fileName, { timeout: EDITOR_READY_TIMEOUT_MS })
  await expect(sourceCard).toContainText(/File uploaded to private source storage|Source file uploaded|Source file planned/i)
  await bindControlledSourceAuthorityForMockUi(page, fileName)
}

export async function uploadEditorGateSourceVideo(
  page: Page,
  fileName = 'e2e-source-story.mp4',
  sourceFilePath?: string,
) {
  const gate = page.getByTestId('edit-upload-gate')
  await expect(gate).toBeVisible()
  await expect(page.getByTestId('chat-composer-textarea')).toBeDisabled()
  await page.getByTestId('edit-upload-gate-input').setInputFiles(
    sourceFilePath ?? {
      name: fileName,
      mimeType: 'video/mp4',
      buffer: await getEditorSourceVideoBytes(fileName),
    },
  )

  const cleanSource = page.getByTestId('source-summary')
  const legacySource = page.getByTestId('source-sequence-card')
  await expect(cleanSource.or(legacySource)).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS })
  const sourceCard = await cleanSource.count() ? cleanSource : legacySource
  await expect(sourceCard).toContainText(fileName, { timeout: EDITOR_READY_TIMEOUT_MS })
  await expect(page.getByTestId('chat-composer-textarea')).toBeEnabled()
  await bindControlledSourceAuthorityForMockUi(page, fileName)
}

export async function openEditBriefSourcePreview(
  page: Page,
  fileName = 'e2e-source-story.mp4',
) {
  const workspace = page.getByTestId('professional-edit-brief-workspace')
  await expect(workspace).toBeVisible()
  await workspace.locator('input[type="file"][accept="video/*"]').setInputFiles({
    name: fileName,
    mimeType: 'video/mp4',
    buffer: await getEditorSourceVideoBytes(fileName),
  })
  await expect(page.getByTestId('edit-brief-source-player')).toBeVisible()
}

async function getEditorSourceVideoBytes(fileName: string): Promise<Buffer> {
  void fileName
  return Buffer.from((await getControlledSourceVideoFixture()).bytes)
}

async function getControlledSourceVideoFixture() {
  if (!controlledSourceVideoFixture) {
    controlledSourceVideoFixture = (async () => {
      const definition = EDIT_REFERENCE_CONTROLLED_MEDIA_FIXTURE_DEFINITIONS.find(
        (candidate) => candidate.fixtureId === 'target_b_travel_talking_head',
      )
      if (!definition) {
        throw new Error('The controlled ordinary-editor source fixture is unavailable.')
      }
      const fixture = await materializeEditReferenceControlledMediaFixture({
        definition,
        outputRoot: join(
          process.cwd(),
          'test-results',
          'ordinary-editor-controlled-source-fixtures',
          String(process.pid),
        ),
        timeoutMs: 60_000,
      })
      const probe = await probeMediaFile({
        ffprobeBin: process.env.FFPROBE_BIN ?? 'ffprobe',
        localFilePath: fixture.videoPath,
        timeoutMs: 60_000,
      })
      const video = probe.videoStreams[0]
      const audio = probe.audioStreams[0]
      if (
        !video ||
        !Number.isFinite(probe.durationSeconds) ||
        probe.durationSeconds <= 0 ||
        video.width <= 0 ||
        video.height <= 0
      ) {
        throw new Error('The controlled ordinary-editor source fixture did not produce verified video facts.')
      }

      return {
        bytes: await readFile(fixture.videoPath),
        checksumSha256: fixture.videoChecksumSha256,
        sizeBytes: fixture.videoSizeBytes,
        sourceMetadata: {
          probeStatus: 'probed',
          source: 'local_ffprobe',
          durationSeconds: probe.durationSeconds,
          width: video.width,
          height: video.height,
          videoCodec: video.codecName,
          ...(audio ? { audioCodec: audio.codecName } : {}),
          formatName: probe.formatName,
          streamCount: probe.streamCount,
          hasVideo: probe.videoStreams.length > 0,
          hasAudio: probe.audioStreams.length > 0,
        },
      }
    })()
  }

  return controlledSourceVideoFixture
}

async function bindControlledSourceAuthorityForMockUi(page: Page, fileName: string) {
  if (process.env.E2E_PROFESSIONAL_EDITOR_SOURCE_ONLY_PREFERENCES === 'true') return

  const url = new URL(page.url())
  const namedEditMatch = url.pathname.match(/^\/projects\/([^/]+)\/edits\/([^/]+)$/)
  const projectId = namedEditMatch?.[1] ?? url.searchParams.get('projectId')
  const editSessionId = namedEditMatch?.[2] ?? url.searchParams.get('editSessionId')
  if (!projectId || !editSessionId) {
    throw new Error('Controlled UI source authority requires an exact project and edit identity.')
  }

  const fixture = await getControlledSourceVideoFixture()
  await page.evaluate((input) => {
    const parsed = JSON.parse(window.localStorage.getItem(input.storageKey) ?? '{}') as {
      handoffs?: Array<Record<string, unknown>>
    }
    const handoffs = Array.isArray(parsed.handoffs) ? parsed.handoffs : []
    const now = new Date().toISOString()
    const existingIndex = handoffs.findIndex((candidate) =>
      candidate.projectId === input.projectId &&
      candidate.editSessionId === input.editSessionId,
    )
    const existing = existingIndex >= 0 ? handoffs[existingIndex] : undefined
    const existingAssets = Array.isArray(existing?.sourceMediaAssets)
      ? existing.sourceMediaAssets as Array<Record<string, unknown>>
      : []
    const existingAsset = existingAssets.find((candidate) => candidate.fileName === input.fileName)
      ?? existingAssets[0]
    const sourceAsset = {
      ...(existingAsset ?? {}),
      mediaAssetId: typeof existingAsset?.mediaAssetId === 'string'
        ? existingAsset.mediaAssetId
        : `controlled-ui-${input.editSessionId}-media`,
      storageObjectRecordId: typeof existingAsset?.storageObjectRecordId === 'string'
        ? existingAsset.storageObjectRecordId
        : `controlled-ui-${input.editSessionId}-storage`,
      sourceSequenceItemId: typeof existingAsset?.sourceSequenceItemId === 'string'
        ? existingAsset.sourceSequenceItemId
        : `controlled-ui-${input.editSessionId}-sequence`,
      uploadedClipId: typeof existingAsset?.uploadedClipId === 'string'
        ? existingAsset.uploadedClipId
        : `controlled-ui-${input.editSessionId}-clip`,
      uploadedOrder: 1,
      storageProvider: 'local_private',
      storageBucket: 'source-media',
      storagePath: `local-private/e2e/workspaces/${input.scope.workspaceId}/projects/${input.projectId}/${input.editSessionId}/${input.fileName}`,
      fileName: input.fileName,
      mimeType: 'video/mp4',
      byteSize: input.sizeBytes,
      checksumSha256: input.checksumSha256,
      sourceMetadata: input.sourceMetadata,
      privateArtifact: true,
      publicUrl: null,
      signedUrl: null,
    }
    const handoff = {
      ...(existing ?? {}),
      id: input.editSessionId,
      workspaceId: input.scope.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      projectName: typeof existing?.projectName === 'string' ? existing.projectName : 'Controlled UI edit',
      editName: typeof existing?.editName === 'string' ? existing.editName : 'Controlled UI edit',
      category: typeof existing?.category === 'string' ? existing.category : 'storytelling',
      productWorkflow: 'video_edit',
      editorPath: `/projects/${input.projectId}/edits/${input.editSessionId}`,
      stage: 'source_uploaded',
      sourceFileCount: 1,
      sourceMediaAssets: [sourceAsset],
      setup: {
        ...(existing?.setup && typeof existing.setup === 'object' ? existing.setup : {}),
        sourceSequenceMode: 'single_source',
        sourceOrderConfirmed: false,
        cleanupPreferenceConfirmed: false,
        aspectRatioConfirmed: false,
        editLevelConfirmed: false,
        visualPreferenceConfirmed: false,
      },
      approvedSnapshotId: undefined,
      approvedCreditReservationId: undefined,
      privateReview: undefined,
      createdAt: typeof existing?.createdAt === 'string' ? existing.createdAt : now,
      updatedAt: now,
      persistence: 'browser_local_internal_testing',
    }
    if (existingIndex >= 0) handoffs[existingIndex] = handoff
    else handoffs.push(handoff)

    window.localStorage.setItem(input.storageKey, JSON.stringify({
      recordVersion: 2,
      scope: input.scope,
      scopeFingerprint: input.scopeFingerprint,
      handoffs,
      savedAt: now,
    }))
  }, {
    checksumSha256: fixture.checksumSha256,
    editSessionId,
    fileName,
    projectId,
    scope: CONTROLLED_UI_SCOPE,
    scopeFingerprint: CONTROLLED_UI_SCOPE_FINGERPRINT,
    sizeBytes: fixture.sizeBytes,
    sourceMetadata: fixture.sourceMetadata,
    storageKey: CONTROLLED_UI_HANDOFF_STORAGE_KEY,
  })

  await page.reload()
  await page.waitForLoadState('domcontentloaded')
  await expect(page.getByTestId('editor-page')).toBeVisible({ timeout: EDITOR_READY_TIMEOUT_MS })
  await expect(page.getByTestId('source-summary').or(page.getByTestId('source-sequence-card')))
    .toContainText(fileName, { timeout: EDITOR_READY_TIMEOUT_MS })
}

export async function createPlanFromUploadedEditorSources(page: Page) {
  await completeRequiredEditorSetupBeforeFootagePrep(page)
  await clickWhenReady(page.getByRole('button', { name: /Prepare source/i }).first())
  await expect(page.getByText(/Source prep is ready for 1 uploaded source file/i)).toBeVisible()

  if (await page.getByTestId('planning-preparation').count()) {
    await expect(page.getByTestId('planning-preparation')).toContainText(/Ready to create the plan/i)
    await expect(page.getByTestId('plan-approval-checkpoint')).toHaveCount(0)
    await expect(page.getByTestId('edit-brief-panel')).toHaveCount(0)
    await expect(page.getByTestId('editor-header-edit-brief')).toBeVisible()
    await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
    await expect(page.getByTestId('plan-approval-checkpoint')).toBeVisible()
    await expect(page.getByText(/Plan updated from your source assembly/i)).toBeVisible()
    await expectNoInternalToolNamesInEditor(page)
    await findPlanReview(page)
    await expectNoHorizontalOverflow(page)
    await expectFloatingComposerAligned(page)
    return
  }

  await expect(page.getByTestId('edit-workspace-progress-card')).toContainText(/Prepare the edit plan/i)
  await expect(page.getByTestId('plan-review-card')).toHaveCount(0)
  await expect(page.getByTestId('edit-brief-panel')).toHaveCount(0)
  await expect(page.getByTestId('editor-header-edit-brief')).toBeVisible()
  await expect(page.getByText(/No Edit Brief added/i)).toBeVisible()
  await expect(page.getByText(/create the edit plan from the prompt and source context/i)).toBeVisible()
  await clickWhenReady(page.getByRole('button', { name: /Create edit plan/i }).first())
  await findPlanReview(page)
  await expect(page.getByText(/Plan updated from your source assembly/i)).toBeVisible()
  await expect(page.getByTestId('plan-review-approval-summary')).toContainText(/What I understood/i)
  await expect(page.getByTestId('plan-review-decision-summary')).toContainText(/Visual explanation|Premium motion|Sound design|Story animation|Clean source edit/i)
  await expect(page.getByTestId('plan-review-card')).not.toContainText(/\b(Qwen|DeepSeek|GPT-Image-2|Wan|Hailuo|Veo|Mirelo|MMAudio|Lyria)\b/i)
  await expectNoInternalToolNamesInEditor(page)

  await findPlanReview(page)
  await expectNoHorizontalOverflow(page)
  await expectFloatingComposerAligned(page)
}

export async function completeRequiredEditorSetupBeforeFootagePrep(page: Page) {
  await applySourceOnlyProfessionalEditorPreferencesIfRequested(page)

  if (await page.getByTestId('source-summary').count()) {
    await clickWhenReady(page.getByRole('button', { name: /Use this source|Confirm order/i }))
    const outputFrame = page.getByTestId('output-frame-control')
    await expect(outputFrame).toBeVisible()
    await clickWhenReady(outputFrame.getByRole('radio', { name: /9:16/i }))
    await clickWhenReady(page.getByRole('button', { name: /Confirm frame/i }))
    await clickWhenReady(page.getByRole('button', { name: /Confirm cleanup/i }))
    await clickWhenReady(page.getByRole('button', { name: /Use (Normal|Premium|Ultra Premium)/i }))
    await clickWhenReady(page.getByRole('button', { name: /Confirm direction/i }))
    await clickWhenReady(page.getByRole('button', { name: /Skip reference/i }))
    return
  }

  await clickWhenReady(page.getByRole('button', { name: /Confirm source order|Use this as the full source video/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm output frame/i }).first())
  await clickWhenReady(page.getByRole('button', { name: /Confirm (Preserve natural|Light cleanup|Balanced cleanup|Tight retention|Aggressive|Documentary faithful|Tutorial complete|Custom)/i }).first())
  await clickOptionalSetupAction(page.getByRole('button', { name: /Use this level/i }).first())
  await clickOptionalSetupAction(page.getByRole('button', { name: /Use this preference/i }).first())

  const intentButton = page.getByRole('button', { name: /Looks right/i }).first()
  if (await intentButton.count()) {
    await clickWhenReady(intentButton)
  }
}

async function applySourceOnlyProfessionalEditorPreferencesIfRequested(page: Page) {
  if (process.env.E2E_PROFESSIONAL_EDITOR_SOURCE_ONLY_PREFERENCES !== 'true') return

  await clickWhenReady(page.getByTestId('current-edit-preferences-trigger'))
  const advanced = page.getByTestId('current-edit-preferences-advanced')
  await expect(advanced).toBeVisible()
  if (await advanced.getAttribute('open') === null) {
    await clickWhenReady(advanced.locator('summary'))
  }

  await page.getByTestId('current-edit-preference-workflow').selectOption('simple_clean_edit')
  await page.getByTestId('current-edit-preference-visual-direction').selectOption('no_extra_visuals')
  await page.getByTestId('current-edit-preference-cleanup').selectOption('preserve_natural')
  const apply = page.getByRole('button', { name: /^Apply to this edit$/i })
  if (await apply.count()) {
    await clickWhenReady(apply)
    await expect(page.getByText(/^Current edit is up to date$/i)).toBeVisible()
  }
  await clickWhenReady(page.getByTestId('edit-workspace-view-chat'))
}

async function clickOptionalSetupAction(locator: Locator) {
  try {
    await locator.waitFor({ state: 'visible', timeout: 7_500 })
  } catch {
    return
  }

  await clickWhenReady(locator)
}

export async function completeEditorSetup(page: Page, path = '/editor') {
  await gotoEditor(page, path)
  await uploadEditorSourceFile(page)
  await createPlanFromUploadedEditorSources(page)
}

export async function openTimeline(page: Page) {
  const trigger = page.getByTestId('timeline-open-trigger')
  await clickWhenReady(trigger)
  await expect(page.getByTestId('timeline-drawer')).toBeVisible()
  await expectNoHorizontalOverflow(page)
}

export async function openSFXFlow(page: Page) {
  await clickWhenReady(page.getByRole('button', { name: /Plan sound effects/i }).first())
  await expect(page.getByTestId('sfx-flow')).toBeVisible()
  await expectNoHorizontalOverflow(page)
}

export async function openMusicFlow(page: Page) {
  await clickWhenReady(page.getByRole('button', { name: /^Plan music$/i }).first())
  await expect(page.getByTestId('music-flow')).toBeVisible()
  await expectNoHorizontalOverflow(page)
}
