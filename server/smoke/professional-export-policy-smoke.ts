import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import type { QualityGateResult } from '../../src/backend/contracts/quality-gate-contracts'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import { createCreditEstimateForRender } from '../../src/backend/services/credit-estimate-runtime-service'
import {
  buildProfessionalExportCreditCoverage,
  buildProfessionalExportExecutionAuthority,
  isProfessionalExportFrameCovered,
  resolveProfessionalExportFrame,
} from '../../src/lib/professional-export-policy'
import { buildMockExportEstimate } from '../../src/lib/exports/mock-export-estimator'
import type { ExportSettings } from '../../src/types/export-workflow'
import {
  PROFESSIONAL_EXPORT_ASPECT_RATIOS,
  PROFESSIONAL_EXPORT_COST_RATES,
  PROFESSIONAL_EXPORT_PROFILE_IDS,
} from '../../src/types/professional-export'
import {
  COST_MICROS_PER_CENT,
  TOOL_COST_RATE_CARD,
} from '../tool-cost-metering/rate-card'
import { runFinalRenderExecutionPipeline } from '../workers/final-render'
import type { FinalRenderExecutionInput } from '../workers/final-render'
import type { ProductionWorkerJobPayload } from '../workers/production'

const execFileAsync = promisify(execFile)

const expectedFrames = {
  '16:9': { hd_1080: [1920, 1080], qhd_1440: [2560, 1440], uhd_2160: [3840, 2160] },
  '9:16': { hd_1080: [1080, 1920], qhd_1440: [1440, 2560], uhd_2160: [2160, 3840] },
  '1:1': { hd_1080: [1080, 1080], qhd_1440: [1440, 1440], uhd_2160: [2160, 2160] },
  '4:5': { hd_1080: [1080, 1350], qhd_1440: [1440, 1800], uhd_2160: [2160, 2700] },
  '4:3': { hd_1080: [1440, 1080], qhd_1440: [1920, 1440], uhd_2160: [2880, 2160] },
} as const

for (const aspectRatio of PROFESSIONAL_EXPORT_ASPECT_RATIOS) {
  for (const profileId of PROFESSIONAL_EXPORT_PROFILE_IDS) {
    const frame = resolveProfessionalExportFrame(aspectRatio, profileId)
    assert.deepEqual([frame.width, frame.height], expectedFrames[aspectRatio][profileId])
    assert.equal(frame.width % 2, 0)
    assert.equal(frame.height % 2, 0)
  }
}

assert.equal(COST_MICROS_PER_CENT, PROFESSIONAL_EXPORT_COST_RATES.microsPerCent)
assert.equal(TOOL_COST_RATE_CARD.deterministicRenderer.flatRequestMicros, PROFESSIONAL_EXPORT_COST_RATES.flatRequestMicros)
assert.equal(TOOL_COST_RATE_CARD.deterministicRenderer.perOutputSecondMicros, PROFESSIONAL_EXPORT_COST_RATES.perOutputSecondMicros)
assert.equal(TOOL_COST_RATE_CARD.deterministicRenderer.perMegapixelFrameMicros, PROFESSIONAL_EXPORT_COST_RATES.perMegapixelFrameMicros)

const coverage = buildProfessionalExportCreditCoverage({
  durationSeconds: 60,
  outputFps: 30,
  approvedAspectRatio: '16:9',
})
assert.equal(coverage.assumption, 'always_estimate_4k_uhd')
assert.equal(coverage.costBasisPixelCount, 3840 * 2160)
assert.equal(coverage.includedInInitialEstimate, true)
assert.equal(coverage.requiresSeparateExportEstimate, false)
assert.equal(coverage.allowsAdditionalExportCharge, false)
assert.equal(coverage.usesApprovedEditReservation, true)
assert.equal(coverage.serviceFeeIncludedInToolCost, false)
assert.equal(coverage.approvedFrames.length, 3)
assert.ok(coverage.lowInternalToolCostCredits <= coverage.expectedInternalToolCostCredits)
assert.ok(coverage.expectedInternalToolCostCredits <= coverage.maximumInternalToolCostCredits)

for (const selectedProfileId of PROFESSIONAL_EXPORT_PROFILE_IDS) {
  const authority = buildProfessionalExportExecutionAuthority({
    approvedEstimateId: 'estimate-professional-export-smoke',
    approvedReservationId: 'reservation-professional-export-smoke',
    approvedDeliverableId: `deliverable-professional-export-smoke-${selectedProfileId}`,
    approvedAspectRatio: '16:9',
    approvedOutputFps: 30,
    approvedDurationSeconds: 60,
    selectedProfileId,
  })
  assert.equal(isProfessionalExportFrameCovered({
    authority,
    width: authority.selectedFrame.width,
    height: authority.selectedFrame.height,
    aspectRatio: '16:9',
    fps: 30,
    durationSeconds: 60,
  }), true)
}

const fourKAuthority = buildProfessionalExportExecutionAuthority({
  approvedEstimateId: 'estimate-professional-export-smoke',
  approvedReservationId: 'reservation-professional-export-smoke',
  approvedDeliverableId: 'deliverable-professional-export-smoke-4k',
  approvedAspectRatio: '16:9',
  approvedOutputFps: 24,
  approvedDurationSeconds: 0.125,
  selectedProfileId: 'uhd_2160',
})
assert.equal(isProfessionalExportFrameCovered({
  authority: fourKAuthority,
  width: 4096,
  height: 2160,
  aspectRatio: '16:9',
  fps: 24,
  durationSeconds: 0.125,
}), false)
const tamperedFourKAuthority = structuredClone(fourKAuthority)
tamperedFourKAuthority.selectedFrame.width = 4096
tamperedFourKAuthority.selectedFrame.pixelCount = 4096 * 2160
assert.equal(isProfessionalExportFrameCovered({
  authority: tamperedFourKAuthority,
  width: 4096,
  height: 2160,
  aspectRatio: '16:9',
  fps: 24,
  durationSeconds: 0.125,
}), false)
assert.equal(isProfessionalExportFrameCovered({
  authority: fourKAuthority,
  width: 3840,
  height: 2160,
  aspectRatio: '16:9',
  fps: 30,
  durationSeconds: 0.125,
}), false)
assert.equal(isProfessionalExportFrameCovered({
  authority: fourKAuthority,
  width: 3840,
  height: 2160,
  aspectRatio: '16:9',
  fps: 24,
  durationSeconds: 1,
}), false)
assert.equal(isProfessionalExportFrameCovered({
  authority: fourKAuthority,
  width: 3840,
  height: 2160,
  aspectRatio: '9:16',
  fps: 24,
  durationSeconds: 0.125,
}), false)

const legacyFinalExportEstimate = createCreditEstimateForRender(createMockDatabase(), {
  workspaceId: 'workspace-professional-export-smoke',
  projectId: 'project-professional-export-smoke',
  finalExport: true,
})
assert.equal(legacyFinalExportEstimate.ok, false)
if (!legacyFinalExportEstimate.ok) {
  assert.match(legacyFinalExportEstimate.error.message, /existing reservation/i)
}

const legacySettings: ExportSettings = {
  id: 'settings-professional-export-smoke',
  projectId: 'project-professional-export-smoke',
  targets: [{
    id: 'target-professional-export-smoke',
    platform: 'youtube',
    label: 'YouTube 4K',
    enabled: true,
    aspectRatio: '16:9',
    resolution: '4k',
    fileFormat: 'mp4',
    quality: 'maximum',
    captionMode: 'burn_in',
    enforceSafeZones: true,
    includeWatermarkPlaceholder: false,
  }],
  defaultQuality: 'maximum',
  defaultFileFormat: 'mp4',
  createdAt: '2026-07-14T00:00:00.000Z',
  updatedAt: '2026-07-14T00:00:00.000Z',
}
const legacyExportCoverage = buildMockExportEstimate({
  projectId: legacySettings.projectId,
  exportSettings: legacySettings,
})
assert.equal(legacyExportCoverage.totalCredits, 0)
assert.equal(legacyExportCoverage.requiresCreditPrompt, false)
assert.equal(legacyExportCoverage.allowsAdditionalExportCharge, false)
assert.equal(legacyExportCoverage.coverageSource, 'approved_edit_4k_ceiling')

const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'reeditpro-professional-export-'))
try {
  const sourcePath = path.join(tempRoot, 'source-master.mp4')
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'color=c=0x24324a:s=320x180:r=24:d=0.25',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    sourcePath,
  ])

  const workspaceId = 'workspace-professional-export-smoke'
  const projectId = 'project-professional-export-smoke'
  const mediaAssetId = 'media-professional-export-smoke'
  const approvedSnapshotId = 'snapshot-professional-export-smoke'
  const creditReservationId = 'reservation-professional-export-smoke'
  const toolExecutionPlanId = 'tool-plan-professional-export-smoke'
  const upstreamGate = passedGate({ workspaceId, projectId, mediaAssetId, toolExecutionPlanId })
  const workerPayload: ProductionWorkerJobPayload = {
    jobId: 'job-professional-export-smoke',
    workspaceId,
    projectId,
    mediaAssetId,
    approvedSnapshotId,
    toolExecutionPlanId,
    workerType: 'render_worker',
    executionMode: 'mock_safe',
    idempotencyKey: 'professional-export-smoke-4k',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: ['ffmpeg'],
    requestedRecipeIds: ['final_export_recipe'],
    storageReferenceIds: ['private/source-master.mp4'],
    creditReservationId,
    renderMode: 'final_export',
    requiredQualityGateIds: [upstreamGate.id],
    requiredQualityGateTypes: [upstreamGate.gateType],
    createdAt: '2026-07-14T00:00:00.000Z',
    metadata: { internalTestingGate: 'professional_export_4k_exact_dimensions' },
  }
  const baseInput: FinalRenderExecutionInput = {
    mode: 'local_dev',
    workspaceId,
    projectId,
    mediaAssetId,
    approvedSnapshotId,
    creditReservationId,
    toolExecutionPlanId,
    idempotencyKey: workerPayload.idempotencyKey,
    workerPayload,
    sourceVideoArtifactIds: ['source-artifact-professional-export-smoke'],
    sourceLocalPaths: [sourcePath],
    outputDirectory: tempRoot,
    outputFileName: 'professional-export-4k.mp4',
    renderEngine: 'ffmpeg',
    renderMode: 'final_export',
    canvas: { width: 3840, height: 2160, aspectRatio: '16:9' },
    fps: 24,
    durationSeconds: 0.125,
    exportSettings: { container: 'mp4', videoCodec: 'h264', audioCodec: 'aac', crf: 24, pixelFormat: 'yuv420p' },
    professionalExportAuthority: fourKAuthority,
    enableLocalDevRender: true,
    sourceAudioRequired: false,
    requiredUpstreamQaGateTypes: [upstreamGate.gateType],
    upstreamQaResults: [upstreamGate],
    timeoutMs: 120_000,
  }

  const mismatchedReservation = await runFinalRenderExecutionPipeline({
    ...baseInput,
    creditReservationId: 'wrong-reservation-professional-export-smoke',
  })
  assert.equal(mismatchedReservation.status, 'blocked')
  assert.ok(mismatchedReservation.skippedReasons.some((reason) => reason.code === 'export_reservation_binding_mismatch'))

  const rendered = await runFinalRenderExecutionPipeline(baseInput)
  assert.equal(rendered.status, 'completed', JSON.stringify({ warnings: rendered.warnings, skipped: rendered.skippedReasons }))
  assert.equal(rendered.finalDeliveryAllowed, true)
  assert.equal(rendered.outputProbe?.width, 3840)
  assert.equal(rendered.outputProbe?.height, 2160)
  assert.ok(rendered.outputLocalPath && existsSync(rendered.outputLocalPath))
  assert.ok(rendered.warnings.some((warning) => /must not claim.*restores source detail/i.test(warning)))
} finally {
  await rm(tempRoot, { recursive: true, force: true })
}

console.log('professional export policy smoke passed')

function passedGate(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  toolExecutionPlanId: string
}): QualityGateResult {
  return {
    id: 'gate-professional-export-smoke',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    recipeId: 'final_export_recipe',
    gateType: 'cut_smoothness',
    status: 'passed',
    required: true,
    blocking: false,
    checkedAt: '2026-07-14T00:00:00.000Z',
    checkedByWorkerType: 'qa_worker',
    inputArtifactIds: [],
    outputArtifactIds: [],
    issues: [],
    recommendations: [],
    fallbackRequired: false,
    blocksPreview: false,
    blocksFinalExport: false,
    humanReviewRequired: false,
  }
}
