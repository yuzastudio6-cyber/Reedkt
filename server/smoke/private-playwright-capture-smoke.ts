import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, relative } from 'node:path'

import {
  createApprovedPrivateArtifactToolOperationEvidence,
  createApprovedToolWorkManifest,
} from '../edit-architecture/approved-tool-work-manifest'
import { createPrivateFinalRenderFromPreviewClips, probeMediaFile } from '../media/ffmpeg-preview'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { loadRuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { createApprovedEditExecutionPackageService } from '../services/approved-edit-execution-package-service'
import type { ServiceContext } from '../types'
import {
  approvedCaptureSpecFromOperation,
  runApprovedPrivatePlaywrightCapture,
} from '../workers/browser-capture/private-playwright-capture-runner'
import {
  PRIVATE_PLAYWRIGHT_CAPTURE_SOURCE_KIND,
  PRIVATE_PLAYWRIGHT_CAPTURE_TEMPLATE_ID,
} from '../workers/browser-capture/private-playwright-capture-types'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import { createExecutionSafeApprovedSnapshotPayload } from '../../src/lib/approved-edit-execution-package-client'
import { sampleClips } from '../../src/lib/mock-planner/default-data'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { ApprovedPlanSnapshot } from '../../src/types/edit-planning-db'
import type { EditPlan, PlannerInput, ToolSettingValue } from '../../src/types/reeditpro'

const workspaceId = 'private-playwright-capture-smoke-workspace'
const projectId = 'private-playwright-capture-smoke-project'
const creditReservationId = 'private-playwright-capture-smoke-reservation'
const approvedSettings: ToolSettingValue[] = [
  setting('captureSourceKind', PRIVATE_PLAYWRIGHT_CAPTURE_SOURCE_KIND, 'user_request'),
  setting('captureTemplateId', PRIVATE_PLAYWRIGHT_CAPTURE_TEMPLATE_ID),
  setting('captureAuthorizationConfirmed', true, 'user_request'),
  setting('captureTextTokens', {
    eyebrow: 'Approved product evidence',
    title: 'One workspace for every approved edit',
    body: 'Review source order, timing, visual direction, and estimated credits before private execution begins.',
    callout: 'Plan first. Execute after approval.',
  }, 'user_request'),
  setting('viewportWidth', 640),
  setting('viewportHeight', 360),
  setting('deviceScaleFactor', 1),
]

const plannerInput: PlannerInput = {
  projectName: 'Private Playwright approved capture smoke',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  editingCategory: 'storytelling',
  workflowType: 'custom_let_ai_decide',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'clean',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions: 'Create a clean professional internal test edit and only use bounded backend-approved tool activities.',
  creditPreference: 'balanced',
  clips: sampleClips,
  sourceSequenceMode: 'multi_clip_story_order',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
}

const unapprovedPlan = createMockEditPlan(plannerInput)
const unapprovedSnapshot = snapshotFor(unapprovedPlan, `${projectId}-unapproved`)
const unapprovedManifest = createApprovedToolWorkManifest({
  workspaceId,
  approvedSnapshot: unapprovedSnapshot,
  creditReservationId,
})
assert.equal(unapprovedManifest.reconciliation.executableOperationCount, 4, 'Normal snapshots keep the four bounded core operations.')
assert.equal(
  unapprovedManifest.operations.filter((operation) => operation.toolId === 'playwright' && operation.disposition === 'executable_private_internal').length,
  0,
  'Unresolved browser capture strategies must remain planning-only.',
)

const approvedPlan = structuredClone(unapprovedPlan) as EditPlan
const approvedToolStrategyItem = approvedPlan.toolStrategyPlan?.items.find((item) => item.chainId === 'browser_capture_chain')
assert.ok(approvedToolStrategyItem, 'Fixture must include a browser_capture_chain item.')
const approvedPlaywrightStep = approvedToolStrategyItem.steps.find((step) => step.toolId === 'playwright')
assert.ok(approvedPlaywrightStep, 'Fixture must include the Playwright strategy step.')
approvedPlaywrightStep.settings = approvedSettings
approvedToolStrategyItem.settingsSummary = 'Fixed approved internal HTML capture template with structured text tokens.'
const approvedRendererLayer = approvedPlan.rendererCompositionPlan?.layers.find((layer) =>
  layer.assetPlanItemId === approvedToolStrategyItem.assetPlanItemId)
assert.ok(approvedRendererLayer, 'Authorized capture must bind to an approved renderer layer.')
const approvedCaptureWorkItem = approvedPlan.editingAgentExecutionPlan?.workItems.find((workItem) =>
  workItem.workItemType === 'capture_browser_asset' &&
  workItem.linkedToolStrategyItemIds.includes(approvedToolStrategyItem.id))
assert.ok(approvedCaptureWorkItem, 'Authorized capture must bind to an approved capture_browser_asset work item.')
approvedCaptureWorkItem.linkedRendererLayerIds = [approvedRendererLayer.id]

const approvedSnapshot = snapshotFor(approvedPlan, projectId)
const manifest = createApprovedToolWorkManifest({ workspaceId, approvedSnapshot, creditReservationId })
assert.notEqual(manifest.status, 'blocked_structural_inconsistency', manifest.blockers.join(' '))
assert.equal(manifest.reconciliation.executableOperationCount, 5, 'Exactly one authorized strategy operation joins the four core operations.')
const operation = manifest.operations.find((candidate) =>
  candidate.toolId === 'playwright' && candidate.disposition === 'executable_private_internal')
assert.ok(operation, 'Authorized Playwright strategy operation should be executable for private internal evidence.')
assert.equal(operation.runner.actualMediaOperationImplemented, true)
assert.equal(operation.privateArtifactsOnly, true)
assert.equal(operation.publicExecutionAllowed, false)
assert.equal(operation.productionExecutionAllowed, false)

const localStorageRoot = await mkdtemp(`${tmpdir()}/reeditpro-private-playwright-capture-`)
try {
  const serviceContext: ServiceContext = {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'local',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      LOCAL_STORAGE_ROOT: localStorageRoot,
    }),
    clients: { admin: null, public: null },
    requestId: 'private-playwright-capture-client-injection-smoke',
    auth: { userId: 'private-playwright-capture-smoke-user', isMockUser: true },
  }
  await assert.rejects(
    createApprovedEditExecutionPackageService(serviceContext).createPackage({
      workspaceId,
      projectId,
      approvedPlanSnapshotId: approvedSnapshot.id,
      approvedSnapshot: createExecutionSafeApprovedSnapshotPayload(approvedSnapshot),
      creditReservationId,
      idempotencyKey: 'client-injected-playwright-capture-package',
    }),
    (error: unknown) => {
      if (!(error instanceof ApiError) || error.code !== 'TOOL_NOT_READY') return false
      const details = error.details
      return Boolean(
        details && typeof details === 'object' &&
        (details as Record<string, unknown>).requiredGate === 'canonical_edit_authority_execution_package',
      )
    },
    'Client-supplied executable-looking capture snapshots must not package without server-owned approval state.',
  )

  const first = await runApprovedPrivatePlaywrightCapture({
    manifest,
    operationId: operation.operationId,
    localStorageRoot,
    completedAt: '2026-07-10T12:00:00.000Z',
  })
  assert.equal(first.reusedExistingArtifact, false)
  assert.equal(first.mimeType, 'image/png')
  assert.equal(first.width, 640)
  assert.equal(first.height, 360)
  assert.equal(first.networkRequestCount, 0)
  assert.equal(first.privateArtifact, true)
  assert.equal(first.publicArtifact, false)
  assert.equal(first.signedUrl, null)
  assert.equal(first.toolOperationEvidence.status, 'actual_private_artifact_work_completed')
  assert.equal(first.toolOperationEvidence.actualToolExecuted, true)
  assert.equal(first.toolOperationEvidence.mediaProcessingExecuted, false)
  assert.equal(first.toolOperationEvidence.artifactBytesProduced, true)
  assert.equal(first.toolOperationEvidence.costEvidence.billableToUser, false)
  assert.equal(first.toolOperationEvidence.costEvidence.serviceFeeIncluded, false)
  assert.equal(first.toolOperationEvidence.costEvidence.walletMutationExecuted, false)
  assert.equal(first.toolOperationEvidence.costEvidence.settlementExecuted, false)
  assert.ok(first.byteSize > 0)
  assert.match(first.sha256, /^[a-f0-9]{64}$/)
  assert.match(first.sourceSpecSha256, /^[a-f0-9]{64}$/)
  assert.equal(isAbsolute(first.localFilePath), true)
  assert.equal(relative(localStorageRoot, first.localFilePath).startsWith('..'), false)
  if (process.platform !== 'win32') {
    assert.equal((await stat(dirname(first.localFilePath))).mode & 0o777, 0o700, 'Capture directory must be private 0700.')
    assert.equal((await stat(first.localFilePath)).mode & 0o777, 0o600, 'Capture PNG must be private 0600.')
  }

  const firstBytes = await readFile(first.localFilePath)
  const second = await runApprovedPrivatePlaywrightCapture({
    manifest,
    operationId: operation.operationId,
    localStorageRoot,
    completedAt: '2026-07-10T12:00:01.000Z',
  })
  assert.equal(second.reusedExistingArtifact, true)
  assert.equal(second.sha256, first.sha256)
  assert.equal(second.byteSize, first.byteSize)
  assert.equal(second.toolOperationEvidence.evidenceId, first.toolOperationEvidence.evidenceId)
  assert.equal(second.toolOperationEvidence.costEvidence.eventId, first.toolOperationEvidence.costEvidence.eventId)
  assert.equal(second.toolOperationEvidence.costEvidence.idempotencyKey, first.toolOperationEvidence.costEvidence.idempotencyKey)

  const sourceFixture = await createSyntheticMp4Fixture({
    localStorageRoot,
    outputPath: `${localStorageRoot}/source.mp4`,
    durationSeconds: 1,
    width: 640,
    height: 360,
    includeAudio: true,
  })
  assert.equal(sourceFixture.available, true, sourceFixture.warnings.join('; '))
  assert.ok(sourceFixture.outputPath)
  const composedOutput = await createPrivateFinalRenderFromPreviewClips(
    [sourceFixture.outputPath],
    `${localStorageRoot}/capture-overlay-final.mp4`,
    {
      localStorageRoot,
      clipOverlays: [{
        approvedBrowserCapture: {
          source: 'approved_playwright_private_capture',
          artifactId: first.artifactId,
          operationId: first.operationId,
          localFilePath: first.localFilePath,
          sha256: first.sha256,
          width: 640,
          height: 360,
          rendererLayerIds: first.rendererLayerIds,
        },
      }],
    },
  )
  const composedProbe = await probeMediaFile(composedOutput.outputPath)
  assert.equal(composedOutput.commandSummary.approvedBrowserCaptureOverlayCount, 1)
  assert.equal(composedOutput.commandSummary.mode, 'overlay_then_concat_with_audio_polish')
  assert.equal(composedProbe.hasVideo, true)
  assert.equal(composedProbe.hasAudio, true)
  assert.notEqual(composedOutput.checksumSha256, sourceFixture.checksumSha256)

  const tamperedBytes = await createDifferentValidPng()
  assert.equal(tamperedBytes.readUInt32BE(16), 640)
  assert.equal(tamperedBytes.readUInt32BE(20), 360)
  assert.notDeepEqual(tamperedBytes, firstBytes)
  await writeFile(first.localFilePath, tamperedBytes)
  await assert.rejects(
    runApprovedPrivatePlaywrightCapture({ manifest, operationId: operation.operationId, localStorageRoot }),
    /deterministic provenance validation/i,
    'A different valid same-dimension PNG at the deterministic path must fail closed.',
  )
  await assert.rejects(
    createPrivateFinalRenderFromPreviewClips(
      [sourceFixture.outputPath],
      `${localStorageRoot}/tampered-capture-overlay-final.mp4`,
      {
        localStorageRoot,
        clipOverlays: [{
          approvedBrowserCapture: {
            source: 'approved_playwright_private_capture',
            artifactId: first.artifactId,
            operationId: first.operationId,
            localFilePath: first.localFilePath,
            sha256: first.sha256,
            width: 640,
            height: 360,
            rendererLayerIds: first.rendererLayerIds,
          },
        }],
      },
    ),
    /checksum changed before final render/i,
    'Final render must re-hash and reject a capture replaced after runner evidence was created.',
  )
  await writeFile(first.localFilePath, firstBytes)

  const slashScopeManifest = createApprovedToolWorkManifest({
    workspaceId: 'private-capture-scope/a',
    approvedSnapshot,
    creditReservationId,
  })
  const colonScopeManifest = createApprovedToolWorkManifest({
    workspaceId: 'private-capture-scope:a',
    approvedSnapshot,
    creditReservationId,
  })
  const slashOperation = slashScopeManifest.operations.find((candidate) =>
    candidate.toolId === 'playwright' && candidate.disposition === 'executable_private_internal')
  const colonOperation = colonScopeManifest.operations.find((candidate) =>
    candidate.toolId === 'playwright' && candidate.disposition === 'executable_private_internal')
  assert.ok(slashOperation && colonOperation)
  const slashScopeArtifact = await runApprovedPrivatePlaywrightCapture({
    manifest: slashScopeManifest,
    operationId: slashOperation.operationId,
    localStorageRoot,
  })
  const colonScopeArtifact = await runApprovedPrivatePlaywrightCapture({
    manifest: colonScopeManifest,
    operationId: colonOperation.operationId,
    localStorageRoot,
  })
  assert.notEqual(slashScopeArtifact.localFilePath, colonScopeArtifact.localFilePath, 'Lossy-safe scope labels must not collide on disk.')
  assert.notEqual(slashScopeArtifact.artifactId, colonScopeArtifact.artifactId, 'Capture artifact identity must include manifest scope entropy.')

  assert.throws(
    () => createApprovedPrivateArtifactToolOperationEvidence({
      manifest,
      operationId: operation.operationId,
      operationInstanceId: 'wrong-reservation-evidence',
      workspaceId,
      projectId,
      creditReservationId: 'wrong-reservation',
      outputArtifactId: first.artifactId,
      outputSha256: first.sha256,
      outputByteSize: first.byteSize,
      sourceSpecSha256: first.sourceSpecSha256,
      elapsedMilliseconds: 1,
      imageProbe: first.toolOperationEvidence.imageProbe!,
      qaChecks: [],
      completedAt: '2026-07-10T12:00:02.000Z',
    }),
    /credit reservation does not match/i,
  )
} finally {
  await rm(localStorageRoot, { recursive: true, force: true })
}

const deniedSnapshot = structuredClone(approvedSnapshot) as ApprovedPlanSnapshot
const deniedItem = deniedSnapshot.toolStrategyPlan?.items.find((item) => item.id === approvedToolStrategyItem.id)
const deniedStep = deniedItem?.steps.find((step) => step.toolId === 'playwright')
assert.ok(deniedStep)
deniedStep.settings = approvedSettings.map((candidate) => candidate.settingId === 'captureAuthorizationConfirmed'
  ? setting('captureAuthorizationConfirmed', false, 'user_request')
  : candidate)
const deniedManifest = createApprovedToolWorkManifest({ workspaceId, approvedSnapshot: deniedSnapshot, creditReservationId })
assert.equal(deniedManifest.reconciliation.executableOperationCount, 4)
assert.equal(
  deniedManifest.operations.find((candidate) => candidate.operationId === operation.operationId)?.disposition,
  'degraded_planning_only',
)

const wrongSourceSnapshot = structuredClone(approvedSnapshot) as ApprovedPlanSnapshot
const wrongSourceStep = wrongSourceSnapshot.toolStrategyPlan?.items
  .find((item) => item.id === approvedToolStrategyItem.id)?.steps
  .find((step) => step.toolId === 'playwright')
assert.ok(wrongSourceStep)
wrongSourceStep.settings = wrongSourceStep.settings.map((candidate) =>
  candidate.settingId === 'captureAuthorizationConfirmed'
    ? { ...candidate, source: 'planner' }
    : candidate)
const wrongSourceManifest = createApprovedToolWorkManifest({ workspaceId, approvedSnapshot: wrongSourceSnapshot, creditReservationId })
assert.equal(executablePlaywrightCount(wrongSourceManifest), 0, 'Planner-sourced authorization must never promote capture.')

const blockedStrategySnapshot = structuredClone(approvedSnapshot) as ApprovedPlanSnapshot
const blockedStrategyItem = blockedStrategySnapshot.toolStrategyPlan?.items.find((item) => item.id === approvedToolStrategyItem.id)
assert.ok(blockedStrategyItem)
blockedStrategyItem.status = 'blocked'
const blockedStrategyManifest = createApprovedToolWorkManifest({ workspaceId, approvedSnapshot: blockedStrategySnapshot, creditReservationId })
assert.equal(executablePlaywrightCount(blockedStrategyManifest), 0, 'Blocked strategy status must never promote capture.')

const blockedWorkSnapshot = structuredClone(approvedSnapshot) as ApprovedPlanSnapshot
const blockedWorkItem = blockedWorkSnapshot.editingAgentExecutionPlan?.workItems.find((workItem) =>
  workItem.linkedToolStrategyItemIds.includes(approvedToolStrategyItem.id))
assert.ok(blockedWorkItem)
blockedWorkItem.status = 'blocked'
const blockedWorkManifest = createApprovedToolWorkManifest({ workspaceId, approvedSnapshot: blockedWorkSnapshot, creditReservationId })
assert.equal(executablePlaywrightCount(blockedWorkManifest), 0, 'Blocked capture work item must never promote capture.')

const exactSettings = Object.fromEntries(approvedSettings.map((candidate) => [candidate.settingId, candidate.value]))
assert.throws(
  () => approvedCaptureSpecFromOperation({ ...exactSettings, url: 'http://127.0.0.1/private' }),
  /fixed capture specification/i,
)
assert.throws(
  () => approvedCaptureSpecFromOperation({ ...exactSettings, rawHtml: '<main>not approved</main>' }),
  /fixed capture specification/i,
)
assert.throws(
  () => approvedCaptureSpecFromOperation({
    ...exactSettings,
    captureTextTokens: { ...(exactSettings.captureTextTokens as object), title: 'Password secret' },
  }),
  /credential-like content/i,
)
assert.throws(
  () => approvedCaptureSpecFromOperation({
    ...exactSettings,
    captureTextTokens: { ...(exactSettings.captureTextTokens as object), body: 'x'.repeat(181) },
  }),
  /1-180 characters/i,
)

console.log(JSON.stringify({
  ok: true,
  normalExecutableOperationCount: unapprovedManifest.reconciliation.executableOperationCount,
  authorizedExecutableOperationCount: manifest.reconciliation.executableOperationCount,
  authorizedPlaywrightOperationId: operation.operationId,
  fixedTemplateId: PRIVATE_PLAYWRIGHT_CAPTURE_TEMPLATE_ID,
  privateArtifactOnly: true,
  zeroNetwork: true,
  deterministicReuseValidated: true,
  sameDimensionPngTamperRejected: true,
  preRenderCaptureTamperRejected: true,
  approvedFfmpegOverlayValidated: true,
  collisionResistantScopePathsValidated: true,
  privateFilesystemModesValidated: process.platform !== 'win32',
  clientInjectedCapturePackageRejected: true,
  billableToUser: false,
  walletMutationExecuted: false,
  settlementExecuted: false,
}, null, 2))

function snapshotFor(plan: EditPlan, snapshotProjectId: string): ApprovedPlanSnapshot {
  return createApprovedPlanSnapshot({
    approvedBy: 'private-playwright-capture-smoke-user',
    editSessionId: `private-playwright-capture-smoke-edit-${snapshotProjectId}`,
    plan,
    projectId: snapshotProjectId,
  })
}

function setting(
  settingId: string,
  value: unknown,
  source: ToolSettingValue['source'] = 'planner',
): ToolSettingValue {
  return { settingId, value, source }
}

function executablePlaywrightCount(manifest: ReturnType<typeof createApprovedToolWorkManifest>): number {
  return manifest.operations.filter((candidate) =>
    candidate.toolId === 'playwright' && candidate.disposition === 'executable_private_internal').length
}

async function createDifferentValidPng(): Promise<Buffer> {
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 640, height: 360 }, javaScriptEnabled: false })
    await page.setContent('<!doctype html><html><body style="margin:0;width:640px;height:360px;background:#b91c1c"></body></html>')
    return Buffer.from(await page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' }))
  } finally {
    await browser.close()
  }
}
